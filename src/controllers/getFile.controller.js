const fs = require("fs")
const { activeDownloadsUtil } = require("../utils/activeDownloadsUtil")
const { getFileService } = require("../service/getFile.service")

const getFileController = (req, res) => {
    const { id } = req.params;

    const result = getFileService(id);

    if (!result.ok) {
        return res.status(result.status).send(result.message);
    }

    res.download(result.filePath, result.clientName, (err) => {
        if (!err) {
            fs.unlink(result.filePath, () => {});
            activeDownloadsUtil.delete(id);
        }
    });
};

module.exports = { getFileController }