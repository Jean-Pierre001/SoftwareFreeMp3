const express = require("express")
const app = express()
const path = require("path")
const { PORT } = require("./config/config.js")
const { inicializarServidorUtil } = require("./utils/inicializarServidorUtil.js")
const { ColorLogs } = require("./utils/colorLogs.util.js")

app.use(express.static(path.join(__dirname, "../public")))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const routes = require("./routes/routes.js")
const notFound = require("./middleware/notFound.middleware.js")
app.use(routes)
app.use(notFound)

inicializarServidorUtil();

app.listen(PORT, () => {

    console.log(`${ColorLogs.green}${ColorLogs.bold}`)
    console.log("╔══════════════════════════════════════════════════════════════╗")
    console.log("║                    Servidor iniciado                        ║")
    console.log("╚══════════════════════════════════════════════════════════════╝")
    console.log(`${ColorLogs.reset}`)

    console.log(`${ColorLogs.green}Estado:${ColorLogs.reset} Escuchando conexiones`)
    console.log(`${ColorLogs.cyan}URL:${ColorLogs.reset} http://localhost:${PORT}`)
    console.log(`${ColorLogs.gray}Puerto:${ColorLogs.reset} ${PORT}`)
    console.log(`${ColorLogs.gray}Inicio:${ColorLogs.reset} ${new Date().toLocaleString()}\n`)

})