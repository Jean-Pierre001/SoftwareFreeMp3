const path = require("path")
const { spawn } = require("child_process")
const { ytDlpProcessUtil } = require("../utils/ytDlpProcessUtil.js")
const { activeDownloadsUtil } = require("../utils/activeDownloadsUtil.js")
const { getPreviewStream } = require("../service/songPreview.service.js")
const { FFMPEG_PATH, DOWNLOADS_PATH, COOKIES_PATH } = require("../config/config.js")

const sanitizeName = name => {
    return (name || "download")
        .replace(/[<>:"/\\|?*]/g, "")
        .trim()
}

const downloadService = (url, format, start, end, previewId) => {
    const downloadId = Date.now().toString()
    let fileName = "download"

    if (previewId) {
        const preview = getPreviewStream(previewId)
        if (preview?.title) {
            fileName = sanitizeName(preview.title)
        }
    }

    const outputPath = path.join(
        DOWNLOADS_PATH,
        `[${downloadId}]-${fileName}.${format === "MP3" ? "mp3" : "mp4"}`
    )

    // --- PROCESAMIENTO CON PREVIEW CACHE (FFMPEG) ---
    if (previewId) {
        const preview = getPreviewStream(previewId)

        if (preview && preview.status === "ready" && preview.filePath) {
            const ffmpegArgs = []

            // Fast Seek: colocar -ss antes de -i para que sea instantáneo
            if (start && end) {
                ffmpegArgs.push("-ss", String(start), "-to", String(end))
            }

            ffmpegArgs.push("-i", preview.filePath)

            if (format === "MP3") {
                ffmpegArgs.push(
                    "-vn",
                    "-c:a", "libmp3lame",
                    "-q:a", "0" // Máxima calidad VBR
                )
            } else {
                ffmpegArgs.push(
                    "-c:v", "libx264",
                    "-crf", "18", // CRF 18 = Calidad visualmente sin pérdida (Visually Lossless)
                    "-preset", "preset_or_fast", // Mantén balance velocidad/tamaño
                    "-c:a", "aac",
                    "-b:a", "320k", // Máximo bitrate de audio AAC
                    "-movflags", "+faststart"
                )
            }

            ffmpegArgs.push(outputPath)

            const ffmpeg = spawn(FFMPEG_PATH, ffmpegArgs)

            activeDownloadsUtil.set(downloadId, {
                process: ffmpeg,
                status: "downloading",
                logs: ["Generando archivo desde preview cache..."]
            })

            ffmpeg.stderr.on("data", d => {
                const text = d.toString()
                if (!text.includes("time=")) {
                    console.log("[FFMPEG]", text)
                }
            })

            ffmpeg.on("close", code => {
                const state = activeDownloadsUtil.get(downloadId)
                if (code === 0) {
                    activeDownloadsUtil.set(downloadId, {
                        ...state,
                        status: "completed",
                        filePath: outputPath
                    })
                } else {
                    activeDownloadsUtil.set(downloadId, {
                        ...state,
                        status: "error"
                    })
                }
            })

            ffmpeg.on("error", err => {
                activeDownloadsUtil.set(downloadId, {
                    ...activeDownloadsUtil.get(downloadId),
                    status: "error",
                    error: err.message
                })
            })

            return downloadId
        }
    }

    // --- DESCARGA DIRECTA (YT-DLP) ---
    let formatArgs = []

    if (format === "MP3") {
        formatArgs = [
            "-x",
            "--audio-format", "mp3",
            "--audio-quality", "0"
        ]
    } else {
        formatArgs = [
            // Selecciona la mejor calidad posible de vídeo y audio combinados
            "-f", "bestvideo+bestaudio/best",
            "--merge-output-format", "mp4"
        ]
    }

    let trimArgs = []
    if (start && end) {
        trimArgs = [
            "--download-sections",
            `*${start}-${end}`
        ]
    }

    const outputTemplate = path.join(
        DOWNLOADS_PATH,
        `[${downloadId}]-%(title)s.%(ext)s`
    )

    const args = [
        url,
        ...formatArgs,
        ...trimArgs,
        "--cookies", COOKIES_PATH,
        "--ffmpeg-location", FFMPEG_PATH,
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36",
        "--no-playlist",
        "--force-ipv4",
        "--retries", "10",
        "--fragment-retries", "10",
        "--concurrent-fragments", "8",
        "--newline",
        "--output", outputTemplate
    ]

    ytDlpProcessUtil(downloadId, args, url)

    return downloadId
}

module.exports = {
    downloadService
}