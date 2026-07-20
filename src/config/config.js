const PORT = process.env.PORT || 8080;
const path = require("path");
const fs = require("fs");
const ffmpegPath = require("ffmpeg-static");
const DOWNLOADS_PATH = path.join(__dirname, "../tempDowloads");
const COOKIES_PATH = path.join(__dirname, "../cookies.txt")

const YTDLP_PATH =
    process.platform === "win32"
        ? path.join(__dirname, "../bin/yt-dlp.exe")
        : path.join(__dirname, "../bin/yt-dlp");
const FFMPEG_PATH = ffmpegPath;

module.exports = {
    PORT,
    YTDLP_PATH,
    FFMPEG_PATH,
    DOWNLOADS_PATH,
    COOKIES_PATH
}