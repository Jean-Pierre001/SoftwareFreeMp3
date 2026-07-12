const express = require("express")
const app = express()
const path = require("path")
const { PORT } = require("./config/config.js")
const inicializarServidor = require("./utils/init.js")

app.use(express.static(path.join(__dirname, "../public")))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Rutas
const routes = require("./routes/routes.js")
app.use(routes)

inicializarServidor();

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})