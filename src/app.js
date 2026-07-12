const express = require("express");
const path = require("path");
const app = express();
const { PORT,  } = require("./config/config")
const activeDownloads = new Map();



// Endpoint de entrega directa del archivo MP3 descargado
app.get("/api/get-file/:id", (req, res) => {
    const downloadId = req.params.id;
    const state = activeDownloads.get(downloadId);

    if (!state || state.status !== "completed") {
        return res.status(400).send("El archivo no está listo o la descarga falló.");
    }

    const files = fs.readdirSync(DOWNLOADS_PATH);
    const targetFiles = files.filter(f => f.startsWith(`[${downloadId}]-`));

    if (targetFiles.length === 0) {
        return res.status(404).send("No se encontró el archivo procesado en el disco.");
    }

    const filePath = path.join(DOWNLOADS_PATH, targetFiles[0]);
    
    if (fs.existsSync(filePath)) {
        const clientName = targetFiles[0].replace(`[${downloadId}]-`, "");
        
        res.download(filePath, clientName, (err) => {
            if (!err) {
                fs.unlink(filePath, () => {});
                activeDownloads.delete(downloadId);
            }
        });
    } else {
        res.status(404).send("El archivo físico no existe en la carpeta downloads.");
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});