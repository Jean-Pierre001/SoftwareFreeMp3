const { downloadService } = require("../service/download.service")
const { downloadPlaylist } = require("../service/downloadPlaylist.service")

const downloadController = (req, res) => {

    const { url, isPlaylist } = req.body

    if (!url) {
        return res.status(400).json({
            error: "Falta la URL."
        })
    }

    const downloadId = isPlaylist
        ? downloadPlaylist(url)
        : downloadService(url)

    res.json({ downloadId })

}

module.exports = { downloadController }