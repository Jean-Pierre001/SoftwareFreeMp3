const { download } = require("../service/download.service")

downloadController = (req, res) => {
    const { url } = req.body; 
    if (!url) return res.status(400).json({ error: "Falta la URL." });

    const downloadId = download(url);

    res.json({ downloadId });
}

module.exports = { downloadController }