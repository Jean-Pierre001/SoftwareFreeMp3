const { downloadService } = require("../service/download.service")
const { downloadPlaylist } = require("../service/downloadPlaylist.service")

const downloadController = (req, res) => {

    const { url, isPlaylist, limit, format} = req.body

    if (!url) {
        return res.status(400).json({
            error: "Falta la URL."
        })
    }

    const downloadId = isPlaylist
        ? downloadPlaylist(url, limit, format)
        : downloadService(url, format)

    res.json({ downloadId })

}

module.exports = { downloadController }