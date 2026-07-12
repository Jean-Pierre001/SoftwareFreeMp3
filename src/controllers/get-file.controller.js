const controller = {}
const path = require("path")

controller.getFile = (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/index.html"))
}

module.exports = controller