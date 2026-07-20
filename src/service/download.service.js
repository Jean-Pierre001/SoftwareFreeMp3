const path = require("path")
const { ytDlpProcessUtil } = require("../utils/ytDlpProcessUtil.js")
const { FFMPEG_PATH, DOWNLOADS_PATH } = require("../config/config.js")

const downloadService = (url, format, start, end) => {

    const downloadId = Date.now().toString()

    const outputPath = path.join(
        DOWNLOADS_PATH,
        `[${downloadId}]-%(title)s.%(ext)s`
    )

    let formatArgs = []

    if (format === "MP3") {
        formatArgs = [
            "-x",
            "--audio-format", "mp3",
            "--audio-quality", "0"
        ]
    } else {
        formatArgs = [
            "-f", "bv*+ba/b",
            "--merge-output-format", "mp4",
            "--remux-video", "mp4"
        ]
    }

    let trimArgs = []

    if (start && end) {
        trimArgs = [
            "--download-sections",
            `*${start}-${end}`
        ]
    }

    const args = [
        url,

        ...formatArgs,
        ...trimArgs,

        "--ffmpeg-location", FFMPEG_PATH,

        "--user-agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",

        "--no-playlist",

        "--force-ipv4",

        "--retries", "10",
        "--fragment-retries", "10",

        "--concurrent-fragments", "8",

        "--newline",

        "--output", outputPath
    ]

    ytDlpProcessUtil(downloadId, args, url)

    return downloadId

}

module.exports = { downloadService }