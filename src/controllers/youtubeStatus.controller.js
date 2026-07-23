const fs = require("fs")
const { COOKIES_PATH } = require("../config/config.js")

const youtubeStatusController = (req,res) => {

    res.json({
        connected: fs.existsSync(COOKIES_PATH)
    })

}

module.exports = {
    youtubeStatusController
}