const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

// Detectamos si estamos en producción (Linux/Render) o local (Windows)
const isProduction = process.env.NODE_ENV === "production" || process.platform !== "win32";

// Si es Linux, usamos el yt-dlp que descargamos en el Build Command. Si es Windows, tu .exe
const YTDLP_PATH = isProduction 
    ? path.join(__dirname, "bin", "yt-dlp") 
    : path.join(__dirname, "bin", "yt-dlp.exe");

// En Render/Linux ffmpeg ya está instalado globalmente en el sistema, solo ponemos "ffmpeg"
const FFMPEG_PATH = isProduction ? "ffmpeg" : path.join(__dirname, "bin", "ffmpeg.exe");

const DOWNLOADS_PATH = path.join(__dirname, "downloads");

if (!fs.existsSync(DOWNLOADS_PATH)) {
    fs.mkdirSync(DOWNLOADS_PATH);
}

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const activeDownloads = new Map();

function cleanLog(data) {
    return data.toString().replace(/[\r\n]+/g, "").trim();
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Endpoint para iniciar la descarga de un tema
app.post("/api/download", (req, res) => {
    const { url } = req.body; 
    if (!url) return res.status(400).json({ error: "Falta la URL." });

    const downloadId = Date.now().toString();
    
    const args = [
        "-x",
        "--audio-format",
        "mp3",
        "--ffmpeg-location",
        FFMPEG_PATH,
        "--no-playlist",
        "-o",
        path.join(DOWNLOADS_PATH, `[${downloadId}]-%(title)s.%(ext)s`),
        url
    ];

    const process = spawn(YTDLP_PATH, args);
    
    activeDownloads.set(downloadId, {
        process,
        logs: ["Iniciando descarga..."],
        status: "downloading"
    });

    console.log(`[INFO] Descarga individual ${downloadId} iniciada para: ${url}`);

    process.stdout.on("data", (data) => {
        const line = cleanLog(data);
        if (!line) return;
        
        const state = activeDownloads.get(downloadId);
        if (state) {
            state.logs.push(line);
            console.log(`[yt-dlp ${downloadId}]: ${line}`);
        }
    });

    process.stderr.on("data", (data) => {
        const line = cleanLog(data);
        console.error(`[ERROR yt-dlp ${downloadId}]: ${line}`);
        const state = activeDownloads.get(downloadId);
        if (state) state.logs.push(`[ERR] ${line}`);
    });

    process.on("close", (code) => {
        console.log(`[INFO] Proceso ${downloadId} finalizado con código ${code}`);
        const state = activeDownloads.get(downloadId);
        if (!state) return;

        if (code === 0) {
            state.status = "completed";
            state.logs.push("¡Proceso completado con éxito!");
        } else {
            state.status = "failed";
            state.logs.push(`El proceso terminó con errores (Código ${code}).`);
        }
    });

    res.json({ downloadId });
});

// Canal SSE para reportar logs al frontend
app.get("/api/progress/:id", (req, res) => {
    const downloadId = req.params.id;
    const state = activeDownloads.get(downloadId);

    if (!state) {
        return res.status(404).send("Descarga no encontrada.");
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let logIndex = 0;

    const interval = setInterval(() => {
        const currentState = activeDownloads.get(downloadId);
        if (!currentState) {
            clearInterval(interval);
            res.end();
            return;
        }

        while (logIndex < currentState.logs.length) {
            res.write(`data: ${JSON.stringify({ type: "log", message: currentState.logs[logIndex] })}\n\n`);
            logIndex++;
        }

        if (currentState.status === "completed") {
            res.write(`data: ${JSON.stringify({ type: "status", status: "completed" })}\n\n`);
            clearInterval(interval);
            res.end();
        } else if (currentState.status === "failed") {
            res.write(`data: ${JSON.stringify({ type: "status", status: "failed" })}\n\n`);
            clearInterval(interval);
            res.end();
        }
    }, 500);

    req.on("close", () => {
        clearInterval(interval);
    });
});

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

// CAMBIO CRÍTICO: Escuchar en el puerto que te da Render
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});