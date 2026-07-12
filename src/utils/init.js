const { YTDLP_PATH, FFMPEG_PATH, DOWNLOADS_PATH } = require("../config/config.js")
const fs = require("fs")

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

module.exports = inicializarServidor