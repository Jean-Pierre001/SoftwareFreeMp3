const { searchSongService } = require("../service/searchSong.service")

const searchSongController = async (req, res) => {

    try {

        const { query } = req.body

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Debe enviar una búsqueda"
            })
        }

        const results = await searchSongService(query)

        res.json({
            success: true,
            total: results.length,
            results
        })

    } catch (err) {

        console.error(err)

        res.status(500).json({
            success: false,
            message: err.message
        })

    }

}

module.exports = { searchSongController }