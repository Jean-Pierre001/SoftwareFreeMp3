const fs = require("path")
const path = require("path")
const fsExtra = require("fs") // Usamos el fs nativo que ya tenías

const { activeDownloadsUtil } = require("../utils/activeDownloadsUtil")
const { getFileService } = require("../service/getFile.service")

const getFileController = async (req, res) => {

    const { id } = req.params

    // Ajuste clave: agregamos el await porque el servicio ahora procesa el zip de forma asíncrona
    const result = await getFileService(id)

    if (!result.ok) {
        return res.status(result.status).send(result.message)
    }

    res.download(result.filePath, result.clientName, err => {

        if (err) {
            console.error("Error en la descarga del cliente:", err);
            // Si hay un error, igualmente intentamos limpiar los archivos residuales
        }

        if (result.filePath.endsWith(".zip")) {

            const folderPath = result.filePath.replace(/\.zip$/, "")

            // Borra el .zip generado
            fsExtra.unlink(result.filePath, () => {})

            // Borra la carpeta original de canciones
            fsExtra.rm(folderPath, {
                recursive: true,
                force: true
            }, () => {})

        } else {

            fsExtra.unlink(result.filePath, () => {})

        }

        activeDownloadsUtil.delete(id)

    })

}

module.exports = {
    getFileController
}