const fs = require("fs")
const path = require("path")
const { spawn } = require("child_process")

const { YTDLP_PATH, DOWNLOADS_PATH } = require("../config/config.js")
const { ColorLogs } = require("./colorLogs.util.js")
const { activeDownloadsUtil } = require("./activeDownloadsUtil.js")
const { cleanLogUtil } = require("./cleanLogUtil.js")

const ytDlpProcessUtil = (downloadId, args, url) => {

    console.log(`${ColorLogs.cyan}${ColorLogs.bold}══════════════════════════════════════════════════════${ColorLogs.reset}`)
    console.log(`${ColorLogs.cyan}${ColorLogs.bold}Nueva descarga iniciada${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}ID:${ColorLogs.reset} ${downloadId}`)
    console.log(`${ColorLogs.gray}URL:${ColorLogs.reset} ${url}`)
    console.log(`${ColorLogs.gray}Binario:${ColorLogs.reset} ${YTDLP_PATH}`)
    console.log(`${ColorLogs.cyan}${ColorLogs.bold}══════════════════════════════════════════════════════${ColorLogs.reset}\n`)

    const ytDlpProcess = spawn(YTDLP_PATH, args)

    ytDlpProcess.on("error", err => {

        console.error(`${ColorLogs.red}${ColorLogs.bold}[ERROR] No se pudo iniciar yt-dlp${ColorLogs.reset}`)
        console.error(`${ColorLogs.gray}${err.message}${ColorLogs.reset}`)

        const state = activeDownloadsUtil.get(downloadId)

        if (state) {
            state.status = "failed"
            state.logs.push(err.message)
        }

    })

    activeDownloadsUtil.set(downloadId, {
        process: ytDlpProcess,
        logs: ["Iniciando descarga con yt-dlp..."],
        status: "downloading"
    })

    ytDlpProcess.stdout.on("data", data => {

        const line = cleanLogUtil(data)

        if (!line) {
            return
        }

        const state = activeDownloadsUtil.get(downloadId)

        if (state) {
            state.logs.push(line)
            console.log(`${ColorLogs.green}[yt-dlp ${downloadId}]${ColorLogs.reset} ${line}`)
        }

    })

    ytDlpProcess.stderr.on("data", data => {

        const line = cleanLogUtil(data)

        if (!line) {
            return
        }

        console.error(`${ColorLogs.yellow}[yt-dlp ${downloadId}][stderr]${ColorLogs.reset} ${line}`)

        const state = activeDownloadsUtil.get(downloadId)

        if (state) {
            state.logs.push(`[ERR] ${line}`)
        }

    })

    ytDlpProcess.on("close", (code, signal) => {

        const state = activeDownloadsUtil.get(downloadId)

        if (!state) {
            return
        }

        if (signal === "SIGTERM") {

            console.log(`${ColorLogs.yellow}${ColorLogs.bold}⚠ Descarga ${downloadId} cancelada por el usuario${ColorLogs.reset}`)

            try {

                const files = fs.readdirSync(DOWNLOADS_PATH)

                for (const file of files) {

                    if (!file.startsWith(`[${downloadId}]`)) {
                        continue
                    }

                    try {

                        fs.unlinkSync(path.join(DOWNLOADS_PATH, file))

                        console.log(`${ColorLogs.gray}Archivo eliminado:${ColorLogs.reset} ${file}`)

                    } catch (err) {

                        console.error(`${ColorLogs.red}No se pudo eliminar ${file}: ${err.message}${ColorLogs.reset}`)

                    }

                }

            } catch (err) {

                console.error(`${ColorLogs.red}Error al limpiar archivos: ${err.message}${ColorLogs.reset}`)

            }

            state.status = "cancelled"
            state.logs.push("Descarga cancelada por el usuario.")

            console.log("")
            return

        }

        if (code === 0) {

            console.log(`${ColorLogs.green}${ColorLogs.bold}✔ Descarga ${downloadId} finalizada correctamente${ColorLogs.reset}`)

            state.status = "completed"
            state.logs.push("¡Proceso completado con éxito!")

        } else {

            console.error(`${ColorLogs.red}${ColorLogs.bold}✖ Descarga ${downloadId} finalizada con errores (Código ${code})${ColorLogs.reset}`)

            state.status = "failed"
            state.logs.push(`El proceso terminó con errores (Código ${code}).`)

        }

        console.log("")

    })

}

module.exports = { ytDlpProcessUtil }