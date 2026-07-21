const { spawn } = require("child_process")
const { YTDLP_PATH, COOKIES_PATH } = require("../config/config.js")

const searchSongService = (query) => {

    return new Promise((resolve, reject) => {

        if (!query) {
            return reject(new Error("No se recibió ninguna búsqueda"))
        }

        const args = [
            "--dump-single-json",
            "--no-playlist",
            "--cookies", COOKIES_PATH,
            `ytsearch10:${query}`
        ]

        const ytDlp = spawn(YTDLP_PATH, args)

        let stdout = ""
        let stderr = ""

        ytDlp.stdout.on("data", data => {
            stdout += data.toString()
        })

        ytDlp.stderr.on("data", data => {
            stderr += data.toString()
        })

        ytDlp.on("error", err => {
            reject(err)
        })

        ytDlp.on("close", code => {

            if (code !== 0) {
                return reject(new Error(stderr))
            }

            try {

                const json = JSON.parse(stdout)

                const results = (json.entries || []).map(video => ({
                    id: video.id,
                    title: video.title,
                    url: video.webpage_url,
                    duration: video.duration,
                    thumbnail: video.thumbnail,
                    channel: video.channel,
                    uploader: video.uploader,
                    views: video.view_count
                }))

                resolve(results)

            } catch (err) {
                reject(err)
            }

        })

    })

}

module.exports = { searchSongService }