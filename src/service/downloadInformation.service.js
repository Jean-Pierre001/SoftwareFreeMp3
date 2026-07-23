const { spawn } = require("child_process")
const { YTDLP_PATH } = require("../config/config.js")

const downloadInformationService = (url) => {

    return new Promise((resolve, reject) => {
        const args = [
            "--dump-single-json",
            "--no-playlist",
            "--cookies-from-browser",
            url
        ]

        const ytDlp = spawn(YTDLP_PATH, args)

        let stdout = ""
        let stderr = ""

        ytDlp.stdout.on("data", (data) => {
            stdout += data.toString()
        })

        ytDlp.stderr.on("data", (data) => {
            stderr += data.toString()
        })

        ytDlp.on("close", (code) => {
            if (code !== 0) {
                return reject(new Error(stderr || "No se pudo obtener la información del video."))
            }

            try {
                const info = JSON.parse(stdout)

                resolve({
                    title: info.title,
                    duration: info.duration,
                    thumbnail: info.thumbnail,
                    extractor: info.extractor,
                    uploader: info.uploader,
                    webpageUrl: info.webpage_url,
                    formats: info.formats
                })
            } catch {
                reject(new Error("No se pudo interpretar la respuesta de yt-dlp."))
            }
        })
    })
}

module.exports = { downloadInformationService }