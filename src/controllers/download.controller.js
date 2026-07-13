const { downloadService } = require("../service/download.service")

const downloadController = (req, res) => {
    const { url } = req.body; 
    if (!url) return res.status(400).json({ error: "Falta la URL." });

    const downloadId = downloadService(url);

    res.json({ downloadId });
}

module.exports = { downloadController }