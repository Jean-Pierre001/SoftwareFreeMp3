const { download } = require("../service/download.service")
const { activeDownloads } = require("../utils/activeDownloads")

channelSSEController = (req, res) => {
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

module.exports = { channelSSEController }