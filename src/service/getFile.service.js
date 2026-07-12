const activeDownloads = require("../utils/activeDownloads")
const path = require("path")
const fs = require("fs")
const { DOWNLOADS_PATH } = require("../config/config.js")

function getFile(downloadId) {
    const state = activeDownloads.get(downloadId);

    if (!state || state.status !== "completed") {
        return {
            ok: false,
            status: 400,
            message: "El archivo no está listo o la descarga falló."
        };
    }

    const files = fs.readdirSync(DOWNLOADS_PATH);
    const targetFiles = files.filter(file =>
        file.startsWith(`[${downloadId}]-`)
    );

    if (targetFiles.length === 0) {
        return {
            ok: false,
            status: 404,
            message: "No se encontró el archivo procesado."
        };
    }

    const filePath = path.join(DOWNLOADS_PATH, targetFiles[0]);

    if (!fs.existsSync(filePath)) {
        return {
            ok: false,
            status: 404,
            message: "El archivo físico no existe."
        };
    }

    return {
        ok: true,
        filePath,
        clientName: targetFiles[0].replace(`[${downloadId}]-`, "")
    };
};

module.exports = getFile