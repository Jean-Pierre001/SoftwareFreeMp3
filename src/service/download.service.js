const path = require("path")
const { ytDlpProcessUtil } = require("../utils/ytDlpProcessUtil.js")

const { FFMPEG_PATH, DOWNLOADS_PATH } = require("../config/config.js")

const downloadService = (url) => {
    const downloadId = Date.now().toString();
    const outputPath = path.join(DOWNLOADS_PATH, `[${downloadId}]-%(title)s.%(ext)s`);

    // Argumentos para yt-dlp
    const args = [
        url,

        "--extract-audio",
        "--audio-format", "mp3",

        // Runtime JavaScript para resolver desafíos de YouTube
        "--js-runtimes", "node",

        // Cliente de YouTube
        "--extractor-args", "youtube:player_client=web,android",

        "--user-agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",

        "--referer", "https://www.youtube.com/",

        "--add-header", "Accept-Language: es-ES,es;q=0.9",

        "--ffmpeg-location", FFMPEG_PATH,

        "--no-playlist",
        "--force-ipv4",

        "--retries", "10",
        "--fragment-retries", "10",

        "--output", outputPath
    ];

    ytDlpProcessUtil(downloadId, args, url)

    return downloadId
}

module.exports = { downloadService }