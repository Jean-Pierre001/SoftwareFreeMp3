const { spawn } = require("child_process")
const fs = require("fs")
const { FFMPEG_PATH } = require("../config/config.js")
const { getPreviewStream } = require("../service/songPreview.service")

const { ColorLogs } = require("../utils/colorLogs.util.js")

const previewStreamController = async (req, res) => {

    const { previewId } = req.params
    const timestamp = new Date().toLocaleTimeString()

    console.log(`\n${ColorLogs.gray}[${timestamp}]${ColorLogs.reset} ${ColorLogs.bgBlue}${ColorLogs.black}${ColorLogs.bold} STREAM PREVIEW ${ColorLogs.reset} ${ColorLogs.cyan}${ColorLogs.bold}#${previewId}${ColorLogs.reset} ${ColorLogs.bold}Solicitud de streaming recibida...${ColorLogs.reset}`)

    const entry = getPreviewStream(previewId)

    if (!entry) {
        console.error(`${ColorLogs.gray}└── Estado preview:${ColorLogs.reset}  ${ColorLogs.bgRed}${ColorLogs.white}${ColorLogs.bold} NO ENCONTRADO ${ColorLogs.reset} ${ColorLogs.red}No existe entrada en cache para ID: ${previewId}${ColorLogs.reset}`)
        return res.status(404).end()
    }

    if (entry.status === "error") {
        console.error(`${ColorLogs.gray}└── Estado preview:${ColorLogs.reset}  ${ColorLogs.bgRed}${ColorLogs.white}${ColorLogs.bold} FALLO ENTRADA ${ColorLogs.reset} ${ColorLogs.red}La preparación previa del audio/video falló.${ColorLogs.reset}`)
        return res.status(500).json({
            success: false,
            message: "Falló la preparación del audio/video"
        })
    }

    if (entry.status !== "ready") {

        console.log(`${ColorLogs.gray}├── Estado preview:${ColorLogs.reset}  ${ColorLogs.bgYellow}${ColorLogs.black}${ColorLogs.bold} ESPERANDO ${ColorLogs.reset} ${ColorLogs.yellow}Esperando que el stream esté listo...${ColorLogs.reset}`)

        try {
            await entry.readyPromise
            console.log(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.green}Stream ahora está listo.${ColorLogs.reset}`)
        } catch (err) {
            console.error(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.bgRed}${ColorLogs.white}${ColorLogs.bold} ERROR PROCESO ${ColorLogs.reset} ${ColorLogs.red}Error en la promesa de lectura: ${err.message}${ColorLogs.reset}`)
            return res.status(500).json({
                success: false,
                message: err.message
            })
        }

    }

    if (!entry.filePath || !fs.existsSync(entry.filePath)) {
        console.error(`${ColorLogs.gray}└── Archivo físico:${ColorLogs.reset}  ${ColorLogs.bgRed}${ColorLogs.white}${ColorLogs.bold} NO EXISTE ${ColorLogs.reset} ${ColorLogs.red}La ruta ${entry.filePath || 'nula'} no existe en disco.${ColorLogs.reset}`)
        return res.status(500).end()
    }

    const { format, duration, filePath } = entry

    let start = Number(req.query.start)
    let end = Number(req.query.end)
    let seek = Number(req.query.seek) || 0 // <--- CAPTURAMOS EL SEEK DEL REPRODUCTOR

    if (Number.isNaN(start) || start < 0) start = 0
    if (Number.isNaN(end) || end <= start) end = duration
    if (Number.isNaN(seek) || seek < 0) seek = 0

    // El punto real de corte en el archivo físico es start + seek
    const realStart = Math.min(start + seek, duration)
    const clipDuration = Math.max(0.5, end - realStart)

    console.log(`${ColorLogs.gray}┌── Archivo origen:${ColorLogs.reset} ${ColorLogs.cyan}${filePath}${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}├── Formato:${ColorLogs.reset}        ${ColorLogs.magenta}${format}${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}├── Recorte real:${ColorLogs.reset}   ${ColorLogs.yellow}${realStart.toFixed(1)}s ➔ ${end.toFixed(1)}s${ColorLogs.reset} ${ColorLogs.gray}(Offset Seek: ${seek.toFixed(1)}s | Duración Restante: ${clipDuration.toFixed(1)}s)${ColorLogs.reset}`)

    res.setHeader(
        "Content-Type",
        format === "mp4" ? "video/mp4" : "audio/mpeg"
    )

    res.setHeader("Cache-Control", "no-store")

    const ffmpegArgs = [
        "-ss",
        String(realStart), // <--- FFmpeg arranca directo en el seek indicado
        "-i",
        filePath,
        "-t",
        String(clipDuration)
    ]

    if (format === "mp4") {

        ffmpegArgs.push(
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            "-preset",
            "ultrafast", // Preset ultra rápido para menor latencia al hacer seek
            "-movflags",
            "frag_keyframe+empty_moov+default_base_moof", // Flags para streaming MP4 fluido en HTML5
            "-f",
            "mp4"
        )

    } else {

        ffmpegArgs.push(
            "-vn",
            "-c:a",
            "libmp3lame",
            "-q:a",
            "4",
            "-f",
            "mp3"
        )

    }

    ffmpegArgs.push("pipe:1")

    console.log(`${ColorLogs.gray}└── Tubería Stream:${ColorLogs.reset} ${ColorLogs.blue}${ColorLogs.bold}FFmpeg pipe:1${ColorLogs.reset} ${ColorLogs.gray}(Servidor ➔ Cliente)${ColorLogs.reset}`)

    const ffmpeg = spawn(
        FFMPEG_PATH,
        ffmpegArgs
    )

    ffmpeg.stdout.pipe(res)

    ffmpeg.stderr.on("data", d => {

        const log = d.toString()

        if (
            !log.includes("size=") &&
            !log.includes("time=") &&
            !log.includes("speed=")
        ) {
            console.error(`${ColorLogs.gray}[FFMPEG STREAM #${previewId}]${ColorLogs.reset} ${ColorLogs.gray}${log.trim()}${ColorLogs.reset}`)
        }

    })

    req.on("close", () => {
        if (!ffmpeg.killed) {
            ffmpeg.kill("SIGKILL")
        }
    })

    ffmpeg.on("error", (err) => {

        console.error(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.bgRed}${ColorLogs.white}${ColorLogs.bold} ERROR FFMPEG ${ColorLogs.reset} ${ColorLogs.red}Error en el proceso de streaming: ${err?.message || 'Error desconocido'}${ColorLogs.reset}`)

        if (!res.headersSent) {
            res.status(500).end()
        }

    })

}

module.exports = {
    previewStreamController
}