const { spawn } = require("child_process")
const crypto = require("crypto")
const fs = require("fs")
const os = require("os")
const path = require("path")
const { YTDLP_PATH, COOKIES_PATH } = require("../config/config.js")

const previewCache = new Map()
const PREVIEW_TTL = 1000 * 60 * 30 // 30 min

const TEMP_DIR = path.join(os.tmpdir(), "song-previews")
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

const cleanupExpired = () => {
    const now = Date.now()
    for (const [id, entry] of previewCache) {
        if (entry.expiresAt < now) {
            if (entry.filePath) {
                fs.unlink(entry.filePath, () => {}) // borrado silencioso
            }
            previewCache.delete(id)
        }
    }
}

const getFormatArg = (format) => format === "mp4"
    ? "best[ext=mp4][height<=480]/best[height<=480]"
    : "bestaudio[ext=m4a]/bestaudio"

// Descarga el audio/video crudo a disco, en segundo plano.
// No hace trim, eso lo sigue haciendo ffmpeg en el momento del stream.
const startBackgroundDownload = (previewId, url, format) => {

    const entry = previewCache.get(previewId)
    if (!entry) return

    const ext = format === "mp4" ? "mp4" : "m4a"
    const filePath = path.join(TEMP_DIR, `${previewId}.${ext}`)

    entry.status = "downloading"
    entry.filePath = filePath

    entry.readyPromise = new Promise((resolve, reject) => {

        const ytDlp = spawn(YTDLP_PATH, [
            "--no-playlist",
            "--cookies",
            COOKIES_PATH,
            "-f",
            getFormatArg(format),
            "-o",
            filePath,
            url
        ])

        let stderr = ""
        ytDlp.stderr.on("data", d => stderr += d.toString())

        ytDlp.on("error", err => {
            entry.status = "error"
            reject(err)
        })

        ytDlp.on("close", code => {

            if (code !== 0) {
                entry.status = "error"
                return reject(new Error(stderr || "Fallo la descarga en segundo plano"))
            }

            entry.status = "ready"
            resolve(filePath)

        })

    })

    // evita "unhandled rejection" si nadie está escuchando todavía
    entry.readyPromise.catch(() => {})

}

const songPreviewService = (url, format) => {

    return new Promise((resolve, reject) => {

        if (!url) return reject(new Error("No se recibió ninguna URL"))

        const args = [
            "--dump-single-json",
            "--no-playlist",
            "--cookies",
            COOKIES_PATH,
            url
        ]

        const ytDlp = spawn(YTDLP_PATH, args)

        let stdout = ""
        let stderr = ""

        ytDlp.stdout.on("data", d => stdout += d.toString())
        ytDlp.stderr.on("data", d => stderr += d.toString())
        ytDlp.on("error", reject)

        ytDlp.on("close", code => {

            if (code !== 0) return reject(new Error(stderr || "No se pudo obtener la información del video"))

            try {

                const info = JSON.parse(stdout)
                cleanupExpired()

                const previewId = crypto.randomUUID()
                const duration = Math.max(1, Math.floor(info.duration || 0))

                previewCache.set(previewId, {
                    url: info.webpage_url || url,
                    format,
                    duration,
                    expiresAt: Date.now() + PREVIEW_TTL,
                    status: "pending",
                    filePath: null,
                    readyPromise: null
                })

                // arrancamos la descarga real ya mismo, sin esperarla
                startBackgroundDownload(previewId, info.webpage_url || url, format)

                resolve({
                    previewId,
                    title: info.title,
                    uploader: info.uploader,
                    thumbnail: info.thumbnail,
                    duration
                })

            } catch (err) {
                reject(err)
            }

        })

    })

}

// solo LEE la entrada del cache, no la crea ni la modifica
const getPreviewStream = (previewId) => {
    const entry = previewCache.get(previewId)
    if (!entry || entry.expiresAt < Date.now()) return null
    return entry
}

module.exports = { songPreviewService, getPreviewStream }