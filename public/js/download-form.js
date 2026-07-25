// ---------- Envío del formulario ----------

import {
    form,
    urlInput,
    startBtn,
    progressLine,
    logBox,
    status,
    statusText,
    isPlaylistCheckbox,
    limitInput,
    trimToggle
} from "./dom.js";

import { state } from "./state.js";
import { closeTrimPanel } from "./preview.js";

// No lo importamos de dom.js para no depender de que ese archivo
// haya sido actualizado con el export correspondiente.


let currentDownloadId = null;
let currentEventSource = null;

function appendLog(logBox, message, isError = false) {
    const line = document.createElement('div');
    line.className = isError ? 'log-line err' : 'log-line';
    line.textContent = message;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
}

function resetDownloadUI() {

    progressLine.classList.remove("active");
    startBtn.hidden = false;
    startBtn.disabled = false;

    if (cancelDownloadBtn) {
        cancelDownloadBtn.hidden = true;
        cancelDownloadBtn.disabled = false;
    }

    currentDownloadId = null;

    if (currentEventSource) {
        currentEventSource.close();
        currentEventSource = null;
    }

}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const url = urlInput.value.trim();

    if (!url) {
        urlInput.focus();
        return;
    }

    const isPlaylist = isPlaylistCheckbox.checked;
    const limit = limitInput.value || 10;
    const format = state.selectedFormat;

    const payload = {
        url,
        isPlaylist,
        limit,
        format,
        previewId: state.currentPreviewId
    };

    if (trimToggle.checked && state.trimInfo) {
        payload.start = state.trimInfo.start;
        payload.end = state.trimInfo.end;
    }

    startBtn.hidden = true;
    startBtn.disabled = true;

    if (cancelDownloadBtn) {
        cancelDownloadBtn.hidden = false;
        cancelDownloadBtn.disabled = false;
    }

    progressLine.classList.add("active");

    logBox.style.display = "block";
    logBox.innerHTML = "";
    appendLog(logBox, "Enviando petición...");

    status.className = "status-badge running";
    statusText.textContent = "Procesando en servidor...";

    try {

        const response = await fetch("/api/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const initData = await response.json();

        if (initData.error) {

            status.className = "status-badge error";
            statusText.textContent = "Error";

            appendLog(logBox, initData.error, true);

            resetDownloadUI();

            return;
        }

        currentDownloadId = initData.downloadId;

        const eventSource = new EventSource(`/api/progress/${initData.downloadId}`);
        currentEventSource = eventSource;

        eventSource.onmessage = (event) => {

            const sseData = JSON.parse(event.data);

            if (sseData.type === "log") {
                appendLog(logBox, sseData.message);
            }

            if (sseData.type === "status") {

                if (sseData.status === "completed") {

                    status.className = "status-badge success";
                    statusText.textContent = "¡Listo! Descargando archivo...";

                    urlInput.value = "";

                    if (trimToggle.checked) {
                        trimToggle.checked = false;
                    }
                    isPlaylistCheckbox.disabled = false;
                    closeTrimPanel();

                    resetDownloadUI();

                    window.location.href = `/api/get-file/${initData.downloadId}`;

                } else if (sseData.status === "cancelled") {

                    status.className = "status-badge error";
                    statusText.textContent = "Descarga cancelada";

                    resetDownloadUI();

                } else {

                    status.className = "status-badge error";
                    statusText.textContent = "Falló la descarga";

                    resetDownloadUI();

                }

            }

        };

        eventSource.onerror = () => {

            status.className = "status-badge error";
            statusText.textContent = "Se perdió la conexión con el servidor";

            resetDownloadUI();

        };

    } catch {

        status.className = "status-badge error";
        statusText.textContent = "Error de conexión";

        appendLog(logBox, "No se pudo conectar al servidor.", true);

        resetDownloadUI();

    }

});

if (cancelDownloadBtn) {

    cancelDownloadBtn.addEventListener("click", async () => {

        if (!currentDownloadId) {
            resetDownloadUI();
            return;
        }

        cancelDownloadBtn.disabled = true;

        try {

            await fetch("/api/download/cancel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    downloadId: currentDownloadId
                })
            });

            appendLog(logBox, "Cancelando descarga...");

            status.className = "status-badge error";
            statusText.textContent = "Descarga cancelada";

        } catch {

            appendLog(logBox, "No se pudo cancelar la descarga.", true);

        } finally {

            resetDownloadUI();

        }

    });

}