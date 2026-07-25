const path = require("path")
const { ytDlpProcessUtil } = require("../utils/ytDlpProcessUtil.js")
const { FFMPEG_PATH, DOWNLOADS_PATH, COOKIES_PATH, DENO_PATH } = require("../config/config.js")

const ColorLogs = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",

    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",

    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m"
}

const downloadPlaylistService = (url, limit, format) => {

    const downloadId = Date.now().toString()
    const timestamp = new Date().toLocaleTimeString()

    console.log(`\n${ColorLogs.gray}[${timestamp}]${ColorLogs.reset} ${ColorLogs.bgMagenta}${ColorLogs.black}${ColorLogs.bold} PLAYLIST ${ColorLogs.reset} ${ColorLogs.cyan}${ColorLogs.bold}#${downloadId}${ColorLogs.reset} ${ColorLogs.bold}Iniciando descarga de lista de reproducción...${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}┌── URL objetivo:${ColorLogs.reset} ${ColorLogs.blue}${url}${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}├── Formato:${ColorLogs.reset}     ${ColorLogs.magenta}${format}${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}└── Límite items:${ColorLogs.reset} ${ColorLogs.yellow}${limit || 'Sin límite'}${ColorLogs.reset}`)

    const outputPath = path.join(
        DOWNLOADS_PATH,
        downloadId,
        "%(playlist_index)02d - %(title)s.%(ext)s"
    )

    console.log(`${ColorLogs.gray}├── Directorio:${ColorLogs.reset}  ${ColorLogs.cyan}${path.join(DOWNLOADS_PATH, downloadId)}${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}└── Plantilla:${ColorLogs.reset}   ${ColorLogs.gray}%(playlist_index)02d - %(title)s.%(ext)s${ColorLogs.reset}`)

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

    console.log(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.cyan}${ColorLogs.bold}yt-dlp${ColorLogs.reset} Delegando lote de playlist para Tarea #${downloadId}...`)

    ytDlpProcessUtil(downloadId, args, url)

    return downloadId

}

module.exports = { downloadPlaylistService }