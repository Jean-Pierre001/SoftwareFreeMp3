const { activeDownloadsUtil } = require("../utils/activeDownloadsUtil")
const { ColorLogs } = require("../utils/colorLogs.util")

const channelSSEController = (req, res) => {

    const downloadId = req.params.id
    const state = activeDownloadsUtil.get(downloadId)

    if (!state) {
        console.log(`${ColorLogs.yellow}[SSE]${ColorLogs.reset} Intento de conexión a una descarga inexistente (${downloadId})`)
        return res.status(404).send("Descarga no encontrada.")
    }

    console.log(`${ColorLogs.cyan}${ColorLogs.bold}[SSE] Cliente conectado${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}ID:${ColorLogs.reset} ${downloadId}\n`)

    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")

    let logIndex = 0

    const interval = setInterval(() => {

        const currentState = activeDownloadsUtil.get(downloadId)

        if (!currentState) {
            console.log(`${ColorLogs.yellow}[SSE]${ColorLogs.reset} Descarga eliminada (${downloadId})`)
            clearInterval(interval)
            res.end()
            return
        }

        while (logIndex < currentState.logs.length) {
            res.write(`data: ${JSON.stringify({ type: "log", message: currentState.logs[logIndex] })}\n\n`)
            logIndex++
        }

        if (currentState.status === "completed") {

            console.log(`${ColorLogs.green}${ColorLogs.bold}[SSE] Descarga completada${ColorLogs.reset}`)
            console.log(`${ColorLogs.gray}ID:${ColorLogs.reset} ${downloadId}\n`)

            res.write(`data: ${JSON.stringify({ type: "status", status: "completed" })}\n\n`)
            clearInterval(interval)
            res.end()

        } else if (currentState.status === "failed") {

            console.log(`${ColorLogs.red}${ColorLogs.bold}[SSE] Descarga fallida${ColorLogs.reset}`)
            console.log(`${ColorLogs.gray}ID:${ColorLogs.reset} ${downloadId}\n`)

            res.write(`data: ${JSON.stringify({ type: "status", status: "failed" })}\n\n`)
            clearInterval(interval)
            res.end()
        }

    }, 500)

    req.on("close", () => {
        console.log(`${ColorLogs.gray}[SSE] Cliente desconectado (${downloadId})${ColorLogs.reset}`)
        clearInterval(interval)
    })
}

module.exports = { channelSSEController }