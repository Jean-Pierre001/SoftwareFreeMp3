const express = require("express")
const app = express()
const path = require("path")
const { PORT } = require("../src/config/config.js")

app.use(express.static(path.join(__dirname, "../public")))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Rutas
const routes = require("../src/routes/index.routes.js")
app.use(routes)



app.listen(PORT , () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})