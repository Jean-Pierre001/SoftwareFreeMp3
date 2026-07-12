const PORT = process.env.PORT || 8080;
const path = require("path");
const fs = require("fs");
const ffmpegPath = require("ffmpeg-static");
const DOWNLOADS_PATH = path.join(__dirname, "../tempDowloads");

const YTDLP_PATH =
    process.platform === "win32"
        ? path.join(__dirname, "../bin/yt-dlp.exe")
        : path.join(__dirname, "../bin/yt-dlp");
const FFMPEG_PATH = ffmpegPath;

function inicializarServidor() {
    if (!fs.existsSync(YTDLP_PATH)) {
        console.error("Archivo yt-dlp.exe no encontrado. Por favor, asegúrate de tenerlo en la raíz del proyecto.");
        console.log("YTDLP_PATH:", YTDLP_PATH);
        process.exit(1);    
    } else {
        console.log("Ruta de yt-dlp.exe:", YTDLP_PATH);
    }
    
    if (!fs.existsSync(FFMPEG_PATH)) {
        console.error("Archivo ffmpeg.exe no encontrado. Por favor, asegúrate de tenerlo en la raíz del proyecto.");
        console.log("FFMPEG_PATH:", FFMPEG_PATH);
        process.exit(1);
    } else {
        console.log("Ruta de ffmpeg.exe:", FFMPEG_PATH);
    }
    
    if (!fs.existsSync(DOWNLOADS_PATH)) {
        fs.mkdirSync(DOWNLOADS_PATH);
    }
}

module.exports = {
    PORT,
    YTDLP_PATH,
    FFMPEG_PATH,
    DOWNLOADS_PATH,
    inicializarServidor
}