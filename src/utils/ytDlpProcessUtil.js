const { YTDLP_PATH } = require("../config/config.js")
const { activeDownloadsUtil } = require("./activeDownloadsUtil.js")
const { spawn } = require("child_process")
const { cleanLogUtil } = require("./cleanLogUtil.js")

const ytDlpProcessUtil = (downloadId, args, url) => {
    // Llamada directa al binario "yt-dlp" instalado en el sistema
    const ytDlpProcess = spawn(YTDLP_PATH, args);

    ytDlpProcess.on("error", (err) => {
        console.error(err);

        const state = activeDownloadsUtil.get(downloadId);

        if (state) {
            state.status = "failed";
            state.logs.push(err.message);
        }
    });
    
    activeDownloadsUtil.set(downloadId, {
        process: ytDlpProcess,
        logs: ["Iniciando descarga con binario local..."],
        status: "downloading"
    });

    console.log(`[INFO] Descarga ${downloadId} iniciada para: ${url}`);

    ytDlpProcess.stdout.on("data", (data) => {
        const line = cleanLogUtil(data);
        if (!line) return;
        
        const state = activeDownloadsUtil.get(downloadId);
        if (state) {
            state.logs.push(line);
            console.log(`[yt-dlp ${downloadId}]: ${line}`);
        }
    });

    ytDlpProcess.stderr.on("data", (data) => {
        const line = cleanLogUtil(data);
        if (!line) return;

        console.error(`[ERROR yt-dlp ${downloadId}]: ${line}`);
        const state = activeDownloadsUtil.get(downloadId);
        if (state) state.logs.push(`[ERR] ${line}`);
    });

    ytDlpProcess.on("close", (code) => {
        console.log(`[INFO] Proceso ${downloadId} finalizado con código ${code}`);
        const state = activeDownloadsUtil.get(downloadId);
        if (!state) return;

        if (code === 0) {
            state.status = "completed";
            state.logs.push("¡Proceso completado con éxito!");
        } else {
            state.status = "failed";
            state.logs.push(`El proceso terminó con errores (Código ${code}).`);
        }
    });
}

module.exports = { ytDlpProcessUtil }