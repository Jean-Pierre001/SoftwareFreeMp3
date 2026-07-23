const { spawn } = require("child_process")
const { YTDLP_PATH, FFMPEG_PATH, COOKIES_PATH } = require("../config/config.js")
const { getPreviewStream } = require("../service/songPreview.service")

const previewStreamController = (req, res) => {

    const { previewId } = req.params
    const stream = getPreviewStream(previewId)

    if (!stream) {
        return res.status(404).end()
    }

    const { url, format, duration } = stream

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


    const formatArg = format === "mp4"
        ? "best[ext=mp4][height<=480]/best[height<=480]"
        : "bestaudio[ext=m4a]/bestaudio"


    const ytDlp = spawn(YTDLP_PATH, [
        "--no-playlist",
        "--cookies",
        COOKIES_PATH,
        "-f",
        formatArg,
        "-o",
        "-",
        url
    ])


    const ffmpegArgs = [
        "-i",
        "pipe:0",
        "-ss",
        String(start),
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


    const ffmpeg = spawn(
        FFMPEG_PATH,
        ffmpegArgs
    )


    ytDlp.stdout.pipe(ffmpeg.stdin)

    ffmpeg.stdout.pipe(res)


    ytDlp.stderr.on("data", d => {
        console.error(
            "yt-dlp:",
            d.toString()
        )
    })


    ffmpeg.stderr.on("data", d => {
        console.error(
            "ffmpeg:",
            d.toString()
        )
    })


    req.on("close", () => {

        ytDlp.kill("SIGKILL")
        ffmpeg.kill("SIGKILL")

    })


    ytDlp.on("error", () => {

        if (!res.headersSent)
            res.status(500).end()

    })


    ffmpeg.on("error", () => {

        if (!res.headersSent)
            res.status(500).end()

    })

}


module.exports = {
    previewStreamController
}