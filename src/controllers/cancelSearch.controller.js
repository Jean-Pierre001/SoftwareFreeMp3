const { activeDownloadsUtil } = require("../utils/activeDownloadsUtil")

const cancelSearchController = (req, res) => {

    const { searchId } = req.body

    if (!searchId) {
        return res.status(400).json({
            success: false,
            message: "Debe enviar un searchId"
        })
    }

    const process = activeDownloadsUtil.get(searchId)

    if (!process) {
        return res.status(404).json({
            success: false,
            message: "La búsqueda no existe o ya finalizó"
        })
    }

    process.kill()

    activeDownloadsUtil.delete(searchId)

    res.json({
        success: true,
        message: "Búsqueda cancelada"
    })

}

module.exports = { cancelSearchController }