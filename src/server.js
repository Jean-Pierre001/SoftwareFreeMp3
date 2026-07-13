const express = require("express")
const app = express()
const path = require("path")
const { PORT } = require("./config/config.js")
const { inicializarServidorUtil } = require("./utils/inicializarServidorUtil.js")

app.use(express.static(path.join(__dirname, "../public")))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const routes = require("./routes/routes.js")
const notFound = require("./middleware/notFound.middleware.js")
app.use(routes)
app.use(notFound)

inicializarServidorUtil();

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})