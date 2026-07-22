const { app, BrowserWindow } = require("electron")
const path = require("path")
const { PORT } = require("../src/config/config")

require("../src/server")

// Evita el error de "Unable to move the cache: Acceso denegado"
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
app.commandLine.appendSwitch('disable-http-cache')
app.disableHardwareAcceleration()

function createWindow() {

    const win = new BrowserWindow({

        show: false,

        icon: path.join(__dirname, "../build/icon.ico"),

        autoHideMenuBar: true,

        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    win.loadURL(`http://localhost:${PORT}`)

    win.once("ready-to-show", () => {
        win.maximize()
        win.show()
    })
}

app.whenReady().then(() => {

    createWindow()

    app.on("activate", () => {

        if (BrowserWindow.getAllWindows().length === 0)
            createWindow()

    })

})

app.on("window-all-closed", () => {

    if (process.platform !== "darwin")
        app.quit()

})