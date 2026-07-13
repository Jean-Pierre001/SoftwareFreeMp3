const path = require("path")

const indexController = (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/index.html"))
}

module.exports = { indexController }