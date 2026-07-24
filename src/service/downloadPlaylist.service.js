const path = require("path")
const { ytDlpProcessUtil } = require("../utils/ytDlpProcessUtil.js")
const { FFMPEG_PATH, DOWNLOADS_PATH, COOKIES_PATH, DENO_PATH } = require("../config/config.js")

const downloadPlaylistService = (url, limit, format) => {

    const downloadId = Date.now().toString()

    const outputPath = path.join(
        DOWNLOADS_PATH,
        downloadId,
        "%(playlist_index)02d - %(title)s.%(ext)s"
    )

    let formatArgs = []

    if (format === "MP3") { 
        formatArgs = [
            "--extract-audio",
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

    const args = [
        url,

        ...formatArgs,

        "--playlist-end", limit,

        "--ffmpeg-location", FFMPEG_PATH,

        "--js-runtime",
        DENO_PATH,

        "--cookies",
        COOKIES_PATH,

        "--user-agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",

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

module.exports = { downloadPlaylistService }