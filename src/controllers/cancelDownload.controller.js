const { activeDownloadsUtil } = require("../utils/activeDownloadsUtil")

const cancelDownloadController = (req, res) => {

    const { downloadId } = req.body

    if (!downloadId) {
        return res.status(400).json({
            success: false,
            message: "Debe enviar un downloadId"
        })
    }

    const download = activeDownloadsUtil.get(downloadId)

    if (!download) {
        return res.status(404).json({
            success: false,
            message: "La descarga no existe o ya finalizó"
        })
    }

    download.process.kill()

    activeDownloadsUtil.set(downloadId, {
        ...download,
        status: "cancelled"
    })

    res.json({
        success: true
    })

}

module.exports = { cancelDownloadController }