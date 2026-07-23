// ---------- Actualizaciones de la app (Electron) ----------

import { modal, progressBar, progressText, updateText, updateButton } from "./dom.js";

window.electron.onUpdateAvailable(() => {

    modal.classList.remove("hidden")

    updateText.textContent = "Descargando actualización..."

})

window.electron.onDownloadProgress(progress => {

    progressBar.style.width = `${progress.percent}%`

    progressText.textContent = `${progress.percent.toFixed(1)}%`

})

window.electron.onUpdateDownloaded(() => {

    updateText.textContent = "La actualización está lista."

    progressBar.style.width = "100%"

    progressText.textContent = "100%"

    updateButton.disabled = false

})

window.electron.onUpdateError(error => {

    updateText.textContent = error

})

updateButton.onclick = () => {

    window.electron.installUpdate()

}