const { spawn } = require("child_process")
const { YTDLP_PATH } = require("../config/config.js")

const searchSongService = (query) => {

    if (!query) {
        throw new Error("No se recibió ninguna búsqueda")
    }

    const args = [
        "--dump-single-json",
        "--no-playlist",
        `ytsearch6:${query}`
    ]

    const ytDlp = spawn(YTDLP_PATH, args)

    const promise = new Promise((resolve, reject) => {

        let stdout = ""
        let stderr = ""

        ytDlp.stdout.on("data", data => {
            stdout += data.toString()
        })

        ytDlp.stderr.on("data", data => {
            stderr += data.toString()
        })

        ytDlp.on("error", reject)

        ytDlp.on("close", code => {

            if (code !== 0) {
                return reject(new Error(stderr))
            }

            try {

                const json = JSON.parse(stdout)

                resolve(
                    (json.entries || []).map(video => ({
                        id: video.id,
                        title: video.title,
                        url: video.webpage_url,
                        duration: video.duration,
                        thumbnail: video.thumbnail,
                        channel: video.channel,
                        uploader: video.uploader,
                        views: video.view_count
                    }))
                )

            } catch (err) {
                reject(err)
            }

        })

    })

    return {
        process: ytDlp,
        promise
    }

}

module.exports = { searchSongService }