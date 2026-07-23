const { app, BrowserWindow, ipcMain } = require("electron")
const { autoUpdater } = require("electron-updater")
const path = require("path")
const { PORT } = require("../src/config/config")

require("../src/server")

// Evita el error de "Unable to move the cache: Acceso denegado"
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache")
app.commandLine.appendSwitch("disable-http-cache")
app.disableHardwareAcceleration()

let win

function createWindow() {

    win = new BrowserWindow({

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

        // Buscar actualizaciones
        autoUpdater.checkForUpdates()

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

/* ===========================
        AUTO UPDATER
=========================== */

autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = false

autoUpdater.on("checking-for-update", () => {

    console.log("Buscando actualizaciones...")

})

autoUpdater.on("update-available", info => {

    console.log("Nueva versión encontrada:", info.version)

    if (win)
        win.webContents.send("update-available", info)

})

autoUpdater.on("update-not-available", info => {

    console.log("No hay actualizaciones.")

    if (win)
        win.webContents.send("update-not-available", info)

})

autoUpdater.on("download-progress", progress => {

    console.log(`Descargando ${progress.percent.toFixed(1)}%`)

    if (win)
        win.webContents.send("download-progress", progress)

})

autoUpdater.on("update-downloaded", info => {

    console.log("Actualización descargada.")

    if (win)
        win.webContents.send("update-downloaded", info)

})

autoUpdater.on("error", err => {

    console.error("Error del actualizador")

    console.error(err)

    if (win)
        win.webContents.send("update-error", err.message)

})

/* ===========================
            IPC
=========================== */

ipcMain.on("install-update", () => {

    autoUpdater.quitAndInstall()

})

ipcMain.on("check-for-updates", () => {

    autoUpdater.checkForUpdates()

})