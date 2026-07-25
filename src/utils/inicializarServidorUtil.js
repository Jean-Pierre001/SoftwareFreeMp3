const { YTDLP_PATH, FFMPEG_PATH, DOWNLOADS_PATH, DENO_PATH, COOKIES_PATH } = require("../config/config.js")
const { ColorLogs } = require("./colorLogs.util")
const fs = require("fs")

const inicializarServidorUtil = () => {

    console.clear()

    console.log(`${ColorLogs.cyan}${ColorLogs.bold}`)
    console.log("╔══════════════════════════════════════════════════════════════╗")
    console.log("║                SoftwareFreeYTD - Dev Console                ║")
    console.log("╚══════════════════════════════════════════════════════════════╝")
    console.log(`${ColorLogs.reset}`)

    console.log(`${ColorLogs.green}Iniciando comprobación del entorno...${ColorLogs.reset}\n`)

    if (!fs.existsSync(YTDLP_PATH)) {
        console.error(`${ColorLogs.red}✖ yt-dlp.exe no encontrado${ColorLogs.reset}`)
        console.log(`${ColorLogs.gray}Ruta esperada:${ColorLogs.reset} ${YTDLP_PATH}`)
        process.exit(1)
    }

    console.log(`${ColorLogs.green}✔ yt-dlp encontrado${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}   ${YTDLP_PATH}${ColorLogs.reset}\n`)

    if (!fs.existsSync(DENO_PATH)) {
        console.error(`${ColorLogs.red}✖ deno.exe no encontrado${ColorLogs.reset}`)
        console.log(`${ColorLogs.gray}Ruta esperada:${ColorLogs.reset} ${DENO_PATH}`)
        process.exit(1)
    }

    console.log(`${ColorLogs.green}✔ Deno encontrado${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}   ${DENO_PATH}${ColorLogs.reset}\n`)

    if (!fs.existsSync(FFMPEG_PATH)) {
        console.error(`${ColorLogs.red}✖ ffmpeg.exe no encontrado${ColorLogs.reset}`)
        console.log(`${ColorLogs.gray}Ruta esperada:${ColorLogs.reset} ${FFMPEG_PATH}`)
        process.exit(1)
    }

    console.log(`${ColorLogs.green}✔ FFmpeg encontrado${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}   ${FFMPEG_PATH}${ColorLogs.reset}\n`)

    if (!fs.existsSync(COOKIES_PATH)) {
        console.error(`${ColorLogs.red}✖ cookies.txt no encontrado${ColorLogs.reset}`)
        console.log(`${ColorLogs.gray}Ruta esperada:${ColorLogs.reset} ${COOKIES_PATH}`)
    } else {
        console.log(`${ColorLogs.green}✔ Cookies encontrado${ColorLogs.reset}`)
        console.log(`${ColorLogs.gray}   ${COOKIES_PATH}${ColorLogs.reset}\n`)
    }

    if (!fs.existsSync(DOWNLOADS_PATH)) {
        fs.mkdirSync(DOWNLOADS_PATH)
        console.log(`${ColorLogs.yellow}📁 Carpeta de descargas creada${ColorLogs.reset}`)
    } else {
        console.log(`${ColorLogs.green}✔ Carpeta de descargas lista${ColorLogs.reset}`)
    }

    console.log(`${ColorLogs.gray}   ${DOWNLOADS_PATH}${ColorLogs.reset}\n`)

    console.log(`${ColorLogs.green}${ColorLogs.bold}Entorno inicializado correctamente${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}Servidor listo para recibir solicitudes.${ColorLogs.reset}\n`)
}

module.exports = { inicializarServidorUtil }