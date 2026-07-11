const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const ffmpegPath = require("ffmpeg-static");

const app = express();
const YTDLP_PATH =
    process.platform === "win32"
        ? path.join(__dirname, "bin", "yt-dlp.exe")
        : path.join(__dirname, "bin", "yt-dlp");
const FFMPEG_PATH = ffmpegPath;
const COOKIES_PATH = path.join(__dirname, "cookies.txt");
const DOWNLOADS_PATH = path.join(__dirname, "downloads");

if (!fs.existsSync(YTDLP_PATH)) {
    console.error("Archivo yt-dlp.exe no encontrado. Por favor, asegúrate de tenerlo en la raíz del proyecto.");
    console.log("YTDLP_PATH:", YTDLP_PATH);
    process.exit(1);    
} else {
    console.log("Ruta de yt-dlp.exe:", YTDLP_PATH);
}

if (!fs.existsSync(FFMPEG_PATH)) {
    console.error("Archivo ffmpeg.exe no encontrado. Por favor, asegúrate de tenerlo en la raíz del proyecto.");
    console.log("FFMPEG_PATH:", FFMPEG_PATH);
    process.exit(1);
} else {
    console.log("Ruta de ffmpeg.exe:", FFMPEG_PATH);
}

if (!fs.existsSync(COOKIES_PATH)) {
    console.error("Archivo cookies.txt no encontrado. Por favor, crea uno en la raíz del proyecto.");
    console.log("COOKIES_PATH:", COOKIES_PATH);
    process.exit(1);
} else {
    console.log("Ruta de cookies.txt:", COOKIES_PATH);
}

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

// Endpoint para iniciar la descarga de un tema usando el binario nativo
app.post("/api/download", (req, res) => {
    const { url } = req.body; 
    if (!url) return res.status(400).json({ error: "Falta la URL." });

    const downloadId = Date.now().toString();
    const outputPath = path.join(DOWNLOADS_PATH, `[${downloadId}]-%(title)s.%(ext)s`);

    // Mapeo directo de configuraciones a argumentos de CLI para yt-dlp
    const args = [
        url,
        "--extract-audio",
        "--audio-format", "mp3",
        "--cookies", COOKIES_PATH,
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
        "--referer", "https://www.youtube.com/",
        "--add-header", "Accept-Language: es-ES,es;q=0.9",
        "--ffmpeg-location", FFMPEG_PATH,
        "--no-playlist",
        "--force-ipv4",
        "--retries", "10",
        "--fragment-retries", "10",
        "--output", outputPath
    ];

    // Llamada directa al binario "yt-dlp" instalado en el sistema
    const ytDlpProcess = spawn(YTDLP_PATH, args);

    ytDlpProcess.on("error", (err) => {
        console.error(err);

        const state = activeDownloads.get(downloadId);

        if (state) {
            state.status = "failed";
            state.logs.push(err.message);
        }
    });
    
    activeDownloads.set(downloadId, {
        process: ytDlpProcess,
        logs: ["Iniciando descarga con binario local..."],
        status: "downloading"
    });

    console.log(`[INFO] Descarga ${downloadId} iniciada para: ${url}`);

    ytDlpProcess.stdout.on("data", (data) => {
        const line = cleanLog(data);
        if (!line) return;
        
        const state = activeDownloads.get(downloadId);
        if (state) {
            state.logs.push(line);
            console.log(`[yt-dlp ${downloadId}]: ${line}`);
        }
    });

    ytDlpProcess.stderr.on("data", (data) => {
        const line = cleanLog(data);
        if (!line) return;

        console.error(`[ERROR yt-dlp ${downloadId}]: ${line}`);
        const state = activeDownloads.get(downloadId);
        if (state) state.logs.push(`[ERR] ${line}`);
    });

    ytDlpProcess.on("close", (code) => {
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});