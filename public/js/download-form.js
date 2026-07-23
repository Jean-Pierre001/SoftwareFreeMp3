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

function appendLog(logBox, message, isError = false) {
    const line = document.createElement('div');
    line.className = isError ? 'log-line err' : 'log-line';
    line.textContent = message;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
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

    startBtn.disabled = true;
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

            progressLine.classList.remove("active");
            startBtn.disabled = false;

            return;
        }

        const eventSource = new EventSource(`/api/progress/${initData.downloadId}`);

        eventSource.onmessage = (event) => {

            const sseData = JSON.parse(event.data);

            if (sseData.type === "log") {
                appendLog(logBox, sseData.message);
            }

            if (sseData.type === "status") {

                if (sseData.status === "completed") {

                    status.className = "status-badge success";
                    statusText.textContent = "¡Listo! Descargando archivo...";

                    progressLine.classList.remove("active");
                    startBtn.disabled = false;
                    urlInput.value = "";

                    if (trimToggle.checked) {
                        trimToggle.checked = false;
                    }
                    isPlaylistCheckbox.disabled = false;
                    closeTrimPanel();

                    eventSource.close();

                    window.location.href = `/api/get-file/${initData.downloadId}`;

                } else {

                    status.className = "status-badge error";
                    statusText.textContent = "Falló la descarga";

                    progressLine.classList.remove("active");
                    startBtn.disabled = false;

                    eventSource.close();

                }

            }

        };

        eventSource.onerror = () => {

            status.className = "status-badge error";
            statusText.textContent = "Se perdió la conexión con el servidor";

            progressLine.classList.remove("active");
            startBtn.disabled = false;

            eventSource.close();

        };

    } catch {

        status.className = "status-badge error";
        statusText.textContent = "Error de conexión";

        appendLog(logBox, "No se pudo conectar al servidor.", true);

        progressLine.classList.remove("active");
        startBtn.disabled = false;

    }

});