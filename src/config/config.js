const path = require("path")
const fs = require("fs")
const ffmpegPath = require("ffmpeg-static")

const PORT = process.env.PORT || 8080

let BASE_PATH

if (process.versions.electron) {

    const { app } = require("electron")

    BASE_PATH = app.isPackaged
        ? process.resourcesPath
        : path.join(__dirname, "..")

} else {

    BASE_PATH = path.join(__dirname, "..")

}

const DOWNLOADS_PATH = path.join(BASE_PATH, "tempDownloads")

if (!fs.existsSync(DOWNLOADS_PATH)) {
    fs.mkdirSync(DOWNLOADS_PATH, { recursive: true })
}

const YTDLP_PATH =
    process.platform === "win32"
        ? path.join(BASE_PATH, "bin", "yt-dlp.exe")
        : path.join(BASE_PATH, "bin", "yt-dlp")

const FFMPEG_PATH = ffmpegPath

module.exports = {
    PORT,
    YTDLP_PATH,
    FFMPEG_PATH,
    DOWNLOADS_PATH
}