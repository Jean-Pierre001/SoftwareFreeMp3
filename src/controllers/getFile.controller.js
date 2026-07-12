const fs = require("fs")
const { activeDownloads } = require("../utils/activeDownloads")
const { getFile } = require("../service/getFile.service")

getFileController = (req, res) => {
    const { id } = req.params;

    const result = getFile(id);

    if (!result.ok) {
        return res.status(result.status).send(result.message);
    }

    res.download(result.filePath, result.clientName, (err) => {
        if (!err) {
            fs.unlink(result.filePath, () => {});
            activeDownloads.delete(id);
        }
    });
};

module.exports = { getFileController }