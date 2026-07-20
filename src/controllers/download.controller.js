const { downloadService } = require("../service/download.service")
const { downloadPlaylistService } = require("../service/downloadPlaylist.service")

const downloadController = (req, res) => {

    const { url, isPlaylist, limit, format, start, end} = req.body

    if (!url) {
        return res.status(400).json({
            error: "Falta la URL."
        })
    }

    const downloadId = isPlaylist
        ? downloadPlaylistService(url, limit, format)
        : downloadService(url, format, start, end)

    res.json({ downloadId })

}

module.exports = { downloadController }