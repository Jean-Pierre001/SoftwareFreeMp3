const path = require("path")

indexController = (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/index.html"))
}

module.exports = { indexController }