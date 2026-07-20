const { downloadInformationService } = require("../service/downloadInformation.service")

const downloadInformationController = async (req, res) => {
    try {
        const { url } = req.body

        if (!url) {
            return res.status(400).json({
                error: "La URL es obligatoria."
            })
        }

        const information = await downloadInformationService(url)

        return res.json(information)

    } catch (error) {
        return res.status(500).json({
            error: error.message || "No se pudo obtener la información del video."
        })
    }

}

module.exports = { downloadInformationController }