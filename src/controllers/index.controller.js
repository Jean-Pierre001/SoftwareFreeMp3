const controller = {}
const path = require("path")

controller.index = (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/index.html"))
}

controller.getFile = (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/index.html"))
}

controller.download = (req, res) => {
    const { url } = req.body; 
    if (!url) return res.status(400).json({ error: "Falta la URL." });

    const downloadId = Date.now().toString();
    const outputPath = path.join(DOWNLOADS_PATH, `[${downloadId}]-%(title)s.%(ext)s`);

    // Argumentos para yt-dlp
    const args = [
        url,

        "--extract-audio",
        "--audio-format", "mp3",

        // Runtime JavaScript para resolver desafíos de YouTube
        "--js-runtimes", "node",

        // Cliente de YouTube
        "--extractor-args", "youtube:player_client=web,android",

        "--user-agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",

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
}

controller.chanelSSE = (req, res) => {
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
};

module.exports = controller