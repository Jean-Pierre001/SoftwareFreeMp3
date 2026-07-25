const { getSearchHistory } = require("../service/searchHistory.service")


const searchHistoryController = (req, res) => {

    try {

        const history = getSearchHistory()

        res.json({
            success: true,
            total: history.length,
            history
        })

    } catch (err) {

        console.error(err)

        res.status(500).json({
            success: false,
            message: err.message
        })

    }

}


module.exports = { searchHistoryController }