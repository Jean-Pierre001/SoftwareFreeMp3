const { activeDownloadsUtil } = require("../utils/activeDownloadsUtil")

const cancelDownloadController = (req, res) => {

    const { downloadId } = req.body

    if (!downloadId) {
        return res.status(400).json({
            success: false,
            message: "Debe enviar un downloadId."
        })
    }

    const download = activeDownloadsUtil.get(downloadId)

    if (!download) {
        return res.status(404).json({
            success: false,
            message: "La descarga no existe o ya finalizó."
        })
    }

    const { process, status } = download

    if (!process) {
        return res.status(409).json({
            success: false,
            message: "La descarga no puede cancelarse."
        })
    }

    if (["completed", "error", "cancelled"].includes(status)) {
        return res.status(409).json({
            success: false,
            message: `La descarga ya se encuentra ${status}.`
        })
    }

    try {

        const killed = process.kill()

        if (!killed) {
            return res.status(500).json({
                success: false,
                message: "No fue posible cancelar la descarga."
            })
        }

        res.json({
            success: true,
            message: "Solicitud de cancelación enviada correctamente."
        })

    } catch (err) {

        console.error(err)

        res.status(500).json({
            success: false,
            message: err.message
        })

    }

}

module.exports = { cancelDownloadController }