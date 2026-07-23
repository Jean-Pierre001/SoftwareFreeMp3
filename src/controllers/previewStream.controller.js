const { spawn } = require("child_process")
const fs = require("fs")
const { FFMPEG_PATH } = require("../config/config.js")
const { getPreviewStream } = require("../service/songPreview.service")

const previewStreamController = async (req, res) => {

    const { previewId } = req.params
    const entry = getPreviewStream(previewId)

    if (!entry) {
        return res.status(404).end()
    }

    if (entry.status === "error") {
        return res.status(500).json({
            success: false,
            message: "Falló la preparación del audio/video"
        })
    }

    // si todavía se está descargando, esperamos ESA descarga
    // (no relanzamos yt-dlp)
    if (entry.status !== "ready") {
        try {
            await entry.readyPromise
        } catch (err) {
            if (!res.headersSent) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                })
            }
            return
        }
    }

    if (!fs.existsSync(entry.filePath)) {
        return res.status(500).end()
    }

    const { format, duration, filePath } = entry

    let start = Number(req.query.start)
    let end = Number(req.query.end)

    if (Number.isNaN(start) || start < 0) start = 0
    if (Number.isNaN(end) || end <= start) end = duration

    start = Math.min(start, duration)
    end = Math.min(end, duration)

    const clipDuration = Math.max(0.5, end - start)

    res.setHeader(
        "Content-Type",
        format === "mp4" ? "video/mp4" : "audio/mpeg"
    )

    res.setHeader("Cache-Control", "no-store")

    const ffmpegArgs = [
        "-ss",
        String(start),
        "-i",
        filePath,
        "-t",
        String(clipDuration)
    ]

    if (format === "mp4") {

        ffmpegArgs.push(
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            "-preset",
            "veryfast",
            "-movflags",
            "frag_keyframe+empty_moov",
            "-f",
            "mp4"
        )

    } else {

        ffmpegArgs.push(
            "-vn",
            "-c:a",
            "libmp3lame",
            "-q:a",
            "4",
            "-f",
            "mp3"
        )

    }

    ffmpegArgs.push("pipe:1")

    const ffmpeg = spawn(FFMPEG_PATH, ffmpegArgs)

    ffmpeg.stdout.pipe(res)

    ffmpeg.stderr.on("data", d => {
        console.error("ffmpeg:", d.toString())
    })

    req.on("close", () => {
        ffmpeg.kill("SIGKILL")
    })

    ffmpeg.on("error", () => {
        if (!res.headersSent)
            res.status(500).end()
    })

}

module.exports = {
    previewStreamController
}