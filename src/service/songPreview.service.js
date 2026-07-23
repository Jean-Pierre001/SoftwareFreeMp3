const { spawn } = require("child_process")
const crypto = require("crypto")
const fs = require("fs")
const os = require("os")
const path = require("path")
const { YTDLP_PATH, COOKIES_PATH } = require("../config/config.js")

const previewCache = new Map()
const PREVIEW_TTL = 1000 * 60 * 30

const TEMP_DIR = path.join(os.tmpdir(), "song-previews")

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true })
}

const cleanupExpired = () => {
    const now = Date.now()

    for (const [id, entry] of previewCache) {
        if (entry.expiresAt < now) {
            if (entry.filePath && fs.existsSync(entry.filePath)) {
                fs.unlink(entry.filePath, () => {})
            }
            previewCache.delete(id)
        }
    }
}

const getFormatArg = format => {
    return format === "mp4"
        ? "best[height<=480]/best"
        : "bestaudio[ext=m4a]/bestaudio"
}

const startBackgroundDownload = (previewId, url, format) => {
    const entry = previewCache.get(previewId)
    if (!entry) return

    const ext = format === "mp4" ? "mp4" : "m4a"

    const filePath = path.join(
        TEMP_DIR,
        `${previewId}.${ext}`
    )

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

        ytDlp.stderr.on("data", d => {
            stderr += d.toString()
        })

        ytDlp.on("error", err => {
            entry.status = "error"
            reject(err)
        })

        ytDlp.on("close", code => {

            if (code !== 0) {
                entry.status = "error"
                return reject(
                    new Error(stderr || "Error descargando archivo")
                )
            }

            entry.status = "ready"
            resolve(filePath)

        })

    })

    entry.readyPromise.catch(() => {})
}

const songPreviewService = (url, format) => {

    return new Promise((resolve, reject) => {

        if (!url) {
            return reject(new Error("No se recibió ninguna URL"))
        }

        const ytDlp = spawn(YTDLP_PATH, [
            "--dump-single-json",
            "--no-playlist",
            "--cookies",
            COOKIES_PATH,
            url
        ])

        let stdout = ""
        let stderr = ""

        ytDlp.stdout.on("data", d => stdout += d.toString())
        ytDlp.stderr.on("data", d => stderr += d.toString())

        ytDlp.on("error", reject)

        ytDlp.on("close", code => {

            if (code !== 0) {
                return reject(
                    new Error(stderr || "No se pudo obtener información")
                )
            }

            try {

                const info = JSON.parse(stdout)

                cleanupExpired()

                const previewId = crypto.randomUUID()

                const duration = Math.max(
                    1,
                    Math.floor(info.duration || 0)
                )

                previewCache.set(previewId, {
                    url: info.webpage_url || url,
                    title: info.title,
                    uploader: info.uploader,
                    thumbnail: info.thumbnail,
                    format,
                    duration,
                    filePath: null,
                    status: "pending",
                    readyPromise: null,
                    expiresAt: Date.now() + PREVIEW_TTL
                })

                startBackgroundDownload(
                    previewId,
                    info.webpage_url || url,
                    format
                )

                resolve({
                    previewId,
                    title: info.title,
                    uploader: info.uploader,
                    thumbnail: info.thumbnail,
                    duration
                })

            } catch(err) {
                reject(err)
            }

        })

    })

}

const getPreviewStream = previewId => {

    const entry = previewCache.get(previewId)

    if (!entry || entry.expiresAt < Date.now()) {
        return null
    }

    return entry
}

module.exports = {
    songPreviewService,
    getPreviewStream
}