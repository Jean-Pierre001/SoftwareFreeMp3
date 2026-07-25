const crypto = require("crypto")
const { searchSongService } = require("../service/searchSong.service")
const { activeDownloadsUtil } = require("../utils/activeDownloadsUtil")
const { saveSearchHistory } = require("../service/searchHistory.service")

const searchSongController = async (req, res) => {

    let searchId

    try {

        const { query } = req.body

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Debe enviar una búsqueda"
            })
        }

        searchId = crypto.randomUUID()

        const { process, promise } = searchSongService(query)

        activeDownloadsUtil.set(searchId, process)

        const results = await promise

        saveSearchHistory(query, results)

        activeDownloadsUtil.delete(searchId)

        res.json({
            success: true,
            searchId,
            total: results.length,
            results
        })

    } catch (err) {

        if (searchId) {
            activeDownloadsUtil.delete(searchId)
        }

        console.error(err)

        res.status(500).json({
            success: false,
            message: err.message
        })

    }

}

module.exports = { searchSongController }