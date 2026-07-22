const { spawn } = require("child_process")
const { YTDLP_PATH, FFMPEG_PATH } = require("../config/config.js")
const { getPreviewStream } = require("../service/songPreview.service")

const previewStreamController = (req, res) => {

    const { previewId } = req.params
    const stream = getPreviewStream(previewId)

    if (!stream) {
        return res.status(404).end()
    }

    const { url, format, duration } = stream

    // tiempos que el usuario seleccionó en el slider
    let start = Number(req.query.start)
    let end = Number(req.query.end)

    if (Number.isNaN(start) || start < 0) start = 0
    if (Number.isNaN(end) || end <= start) end = duration

    start = Math.min(start, duration)
    end = Math.min(end, duration)

    const clipDuration = Math.max(0.5, end - start)

    res.setHeader("Content-Type", format === "mp4" ? "video/mp4" : "audio/mpeg")
    res.setHeader("Cache-Control", "no-store")

    // 1) resolvemos la URL directa del media (googlevideo, etc.) con yt-dlp
    const formatArg = format === "mp4"
        ? "best[ext=mp4][height<=480]/best[height<=480]"
        : "bestaudio[ext=m4a]/bestaudio"

    const ytDlp = spawn(YTDLP_PATH, [
        "--no-playlist",
        "-f", formatArg,
        "-g",
        url
    ])

    let directUrl = ""
    let ytDlpErr = ""

    ytDlp.stdout.on("data", d => directUrl += d.toString())
    ytDlp.stderr.on("data", d => ytDlpErr += d.toString())

    ytDlp.on("error", () => {
        if (!res.headersSent) res.status(500).end()
    })

    ytDlp.on("close", code => {

        const resolvedUrl = directUrl.trim().split("\n")[0]

        if (code !== 0 || !resolvedUrl) {
            console.error(ytDlpErr)
            if (!res.headersSent) res.status(500).end()
            return
        }

        // 2) cortamos el tramo exacto con ffmpeg y lo mandamos por stdout
        const ffmpegArgs = [
            "-i", resolvedUrl,
            "-ss", String(start),
            "-t", String(clipDuration),
            "-vn",
        ]

        if (format === "mp4") {
            ffmpegArgs.splice(3, 1) // sacamos -vn, sí queremos video
            ffmpegArgs.push(
                "-c:v", "libx264",
                "-c:a", "aac",
                "-preset", "veryfast",
                "-movflags", "frag_keyframe+empty_moov",
                "-f", "mp4"
            )
        } else {
            ffmpegArgs.push(
                "-c:a", "libmp3lame",
                "-q:a", "4",
                "-f", "mp3"
            )
        }

        ffmpegArgs.push("pipe:1")

        const ffmpeg = spawn(FFMPEG_PATH, ffmpegArgs)

        ffmpeg.stdout.pipe(res)
        ffmpeg.stderr.on("data", d => console.error(d.toString()))

        req.on("close", () => ffmpeg.kill("SIGKILL"))
        ffmpeg.on("error", () => {
            if (!res.headersSent) res.status(500).end()
        })

    })

    req.on("close", () => ytDlp.kill("SIGKILL"))

}

module.exports = { previewStreamController }