const path = require("path")
const { spawn } = require("child_process")
const { ytDlpProcessUtil } = require("../utils/ytDlpProcessUtil.js")
const { activeDownloadsUtil } = require("../utils/activeDownloadsUtil.js")
const { getPreviewStream } = require("../service/songPreview.service.js")
const { FFMPEG_PATH, DOWNLOADS_PATH, COOKIES_PATH, DENO_PATH } = require("../config/config.js")

const { ColorLogs } = require("../utils/colorLogs.util.js")

const sanitizeName = name => {
    return (name || "download")
        .replace(/[<>:"/\\|?*]/g, "")
        .trim()
}

const downloadService = (url, format, start, end, previewId) => {

    const downloadId = Date.now().toString()
    const timestamp = new Date().toLocaleTimeString()

    console.log(`${ColorLogs.gray}[${timestamp}]${ColorLogs.reset} ${ColorLogs.bgBlue}${ColorLogs.black}${ColorLogs.bold} TAREA ${ColorLogs.reset} ${ColorLogs.cyan}${ColorLogs.bold}#${downloadId}${ColorLogs.reset} ${ColorLogs.bold}Iniciando descarga...${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}┌── URL destino:${ColorLogs.reset} ${ColorLogs.blue}${url}${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}├── Formato:${ColorLogs.reset}     ${ColorLogs.magenta}${format}${ColorLogs.reset}`)
    if (start || end) {
        console.log(`${ColorLogs.gray}├── Recorte:${ColorLogs.reset}     ${ColorLogs.yellow}${start || '0'}s ➔ ${end || 'fin'}s${ColorLogs.reset}`)
    }

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

    if (previewId) {

        const preview = getPreviewStream(previewId)

        if (preview && preview.status === "ready" && preview.filePath) {

            console.log(`${ColorLogs.gray}├── Estrategia:${ColorLogs.reset}  ${ColorLogs.bgGreen}${ColorLogs.black}${ColorLogs.bold} PREVIEW CACHE HIT ${ColorLogs.reset} ${ColorLogs.gray}(usando flujo existente)${ColorLogs.reset}`)
            console.log(`${ColorLogs.gray}└── Salida:${ColorLogs.reset}      ${ColorLogs.cyan}${outputPath}${ColorLogs.reset}`)

            const ffmpegArgs = [
                "-i",
                preview.filePath
            ]

            if (start && end) {
                ffmpegArgs.push(
                    "-ss",
                    String(start),
                    "-to",
                    String(end)
                )
            }

            if (format === "MP3") {

                ffmpegArgs.push(
                    "-vn",
                    "-c:a",
                    "libmp3lame",
                    "-q:a",
                    "0"
                )

            } else {

                ffmpegArgs.push(
                    "-c:v",
                    "libx264",
                    "-c:a",
                    "aac",
                    "-movflags",
                    "+faststart"
                )

            }

            ffmpegArgs.push(outputPath)

            console.log(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.yellow}${ColorLogs.bold}FFmpeg${ColorLogs.reset} Proceso iniciado para conversión desde preview...`)

            const ffmpeg = spawn(
                FFMPEG_PATH,
                ffmpegArgs
            )

            activeDownloadsUtil.set(downloadId, {
                process: ffmpeg,
                status: "downloading",
                logs: [
                    "Generando archivo desde preview cache..."
                ]
            })

            ffmpeg.stderr.on("data", d => {

                const text = d.toString()

                if (!text.includes("time=")) {
                    console.log(`${ColorLogs.gray}[FFMPEG #${downloadId}]${ColorLogs.reset} ${text.trim()}`)
                }

            })

            ffmpeg.on("close", code => {

                const state = activeDownloadsUtil.get(downloadId)

                if (code === 0) {

                    console.log(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.bgGreen}${ColorLogs.black}${ColorLogs.bold} ÉXITO ${ColorLogs.reset} ${ColorLogs.green}${ColorLogs.bold}¡Tarea #${downloadId} completada correctamente!${ColorLogs.reset}`)
                    console.log(`${ColorLogs.gray}└── Guardado en:${ColorLogs.reset} ${ColorLogs.green}${outputPath}${ColorLogs.reset}`)

                    activeDownloadsUtil.set(downloadId, {
                        ...state,
                        status: "completed",
                        filePath: outputPath
                    })

                } else {

                    console.error(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.bgRed}${ColorLogs.white}${ColorLogs.bold} ERROR ${ColorLogs.reset} ${ColorLogs.red}${ColorLogs.bold}Proceso FFmpeg falló para la Tarea #${downloadId} (Código: ${code})${ColorLogs.reset}`)

                    activeDownloadsUtil.set(downloadId, {
                        ...state,
                        status: "error"
                    })

                }

            })

            ffmpeg.on("error", err => {

                console.error(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.bgRed}${ColorLogs.white}${ColorLogs.bold} CRÍTICO ${ColorLogs.reset} ${ColorLogs.red}${ColorLogs.bold}Error al iniciar FFmpeg en Tarea #${downloadId}: ${err.message}${ColorLogs.reset}`)

                activeDownloadsUtil.set(downloadId, {
                    ...activeDownloadsUtil.get(downloadId),
                    status: "error",
                    error: err.message
                })

            })

            return downloadId

        }

    }

    console.log(`${ColorLogs.gray}├── Estrategia:${ColorLogs.reset}  ${ColorLogs.bgYellow}${ColorLogs.black}${ColorLogs.bold} DESCARGA DIRECTA ${ColorLogs.reset} ${ColorLogs.gray}(vía yt-dlp)${ColorLogs.reset}`)

    let formatArgs = []

    if (format === "MP3") {

        formatArgs = [
            "-x",
            "--audio-format",
            "mp3",
            "--audio-quality",
            "0"
        ]

    } else {

        formatArgs = [
            "-f",
            "bv*+ba/b",
            "--merge-output-format",
            "mp4",
            "--remux-video",
            "mp4"
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

    console.log(`${ColorLogs.gray}└── Plantilla:${ColorLogs.reset}   ${ColorLogs.cyan}${outputTemplate}${ColorLogs.reset}`)

    const args = [
        url,

        ...formatArgs,
        ...trimArgs,

        "--js-runtime",
        DENO_PATH,

        "--cookies",
        COOKIES_PATH,

        "--ffmpeg-location",
        FFMPEG_PATH,

        "--user-agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36",

        "--no-playlist",

        "--force-ipv4",

        "--retries",
        "10",

        "--fragment-retries",
        "10",

        "--concurrent-fragments",
        "8",

        "--newline",

        "--output",
        outputTemplate
    ]

    console.log(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.cyan}${ColorLogs.bold}yt-dlp${ColorLogs.reset} Delegando ejecución para la Tarea #${downloadId}...`)

    ytDlpProcessUtil(
        downloadId,
        args,
        url
    )

    return downloadId

}

module.exports = {
    downloadService,
    ColorLogs
}