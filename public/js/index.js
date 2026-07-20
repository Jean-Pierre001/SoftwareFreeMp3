const form = document.getElementById("downloadForm");
const urlInput = document.getElementById("url");
const startBtn = form.querySelector(".startBtn");
const progressLine = form.querySelector(".progress-line");
const logBox = form.querySelector(".log-container");
const status = form.querySelector(".status-badge");
const statusText = form.querySelector(".status-text");

const formatBtns = form.querySelectorAll(".format-btn");
const isPlaylistCheckbox = document.getElementById("isPlaylist");
const limitField = document.getElementById("limitField");
const limitInput = document.getElementById("limit");

let selectedFormat = "MP3";

// ---------- Selector de formato ----------

formatBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        formatBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedFormat = btn.dataset.format;
    });
});

// ---------- Mostrar/ocultar límite según playlist ----------

isPlaylistCheckbox.addEventListener("change", () => {
    limitField.classList.toggle("open", isPlaylistCheckbox.checked);
});

// ---------- Placeholder rotativo: refuerza "cualquier plataforma" ----------

const placeholderExamples = [
    "https://www.youtube.com/watch?v=...",
    "https://www.tiktok.com/@usuario/video/...",
    "https://vimeo.com/...",
    "https://soundcloud.com/artista/tema",
    "https://twitter.com/usuario/status/...",
    "https://www.instagram.com/reel/..."
];

let placeholderIndex = 0;

function rotatePlaceholder() {
    if (document.activeElement === urlInput || urlInput.value) return;
    urlInput.placeholder = placeholderExamples[placeholderIndex];
    placeholderIndex = (placeholderIndex + 1) % placeholderExamples.length;
}

rotatePlaceholder();
setInterval(rotatePlaceholder, 2600);

// ---------- Envío del formulario ----------

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const url = urlInput.value.trim();

    if (!url) {
        urlInput.focus();
        return;
    }

    const isPlaylist = isPlaylistCheckbox.checked;
    const limit = limitInput.value || 10;
    const format = selectedFormat

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
            body: JSON.stringify({
                url,
                isPlaylist,
                limit,
                format
            })
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

function appendLog(logBox, message, isError = false) {
    const line = document.createElement('div');
    line.className = isError ? 'log-line err' : 'log-line';
    line.textContent = message;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
}