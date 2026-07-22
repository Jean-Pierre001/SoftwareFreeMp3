const { songPreviewService } = require("../service/songPreview.service.js")

const songPreviewController = async (req, res) => {

    try {

        const { url, format } = req.body

        if (!url) {
            return res.status(400).json({
                success: false,
                message: "Debe enviar una URL"
            })
        }

        if (!["mp3", "mp4"].includes(format)) {
            return res.status(400).json({
                success: false,
                message: "Formato inválido"
            })
        }

        const preview = await songPreviewService(url, format)

        res.json({
            success: true,
            ...preview
        })

    } catch (err) {

        console.error(err)

        res.status(500).json({
            success: false,
            message: err.message
        })

    }

}

module.exports = { songPreviewController }