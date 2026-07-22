const { spawn } = require("child_process")
const crypto = require("crypto")
const { YTDLP_PATH, COOKIES_PATH } = require("../config/config.js")

const previewCache = new Map()
const PREVIEW_TTL = 1000 * 60 * 30 // 30 min

const cleanupExpired = () => {
    const now = Date.now()
    for (const [id, entry] of previewCache) {
        if (entry.expiresAt < now) previewCache.delete(id)
    }
}

const songPreviewService = (url, format) => {

    return new Promise((resolve, reject) => {

        if (!url) return reject(new Error("No se recibió ninguna URL"))

        const args = [
            "--dump-single-json",
            "--no-playlist",
            "--cookies", COOKIES_PATH,
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
                    expiresAt: Date.now() + PREVIEW_TTL
                })

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