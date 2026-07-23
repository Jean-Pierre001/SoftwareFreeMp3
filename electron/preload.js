const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {

    onUpdateAvailable: (callback) =>
        ipcRenderer.on("update-available", (_, info) => callback(info)),

    onUpdateNotAvailable: (callback) =>
        ipcRenderer.on("update-not-available", (_, info) => callback(info)),

    onDownloadProgress: (callback) =>
        ipcRenderer.on("download-progress", (_, progress) => callback(progress)),

    onUpdateDownloaded: (callback) =>
        ipcRenderer.on("update-downloaded", (_, info) => callback(info)),

    onUpdateError: (callback) =>
        ipcRenderer.on("update-error", (_, message) => callback(message)),

    installUpdate: () =>
        ipcRenderer.send("install-update"),

    checkForUpdates: () =>
        ipcRenderer.send("check-for-updates"),

    openYoutubeLogin: () =>
        ipcRenderer.send("open-youtube-login"),

    saveYoutubeCookies: () =>
        ipcRenderer.invoke("save-youtube-cookies")

})