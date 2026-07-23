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

const trimToggle = document.getElementById("trimToggle");
const trimPanel = document.getElementById("trimPanel");
const trimLoading = document.getElementById("trimLoading");
const trimError = document.getElementById("trimError");
const trimErrorMsg = document.getElementById("trimErrorMsg");
const trimRetryBtn = document.getElementById("trimRetryBtn");
const trimContent = document.getElementById("trimContent");
const trimThumb = document.getElementById("trimThumb");
const trimTitle = document.getElementById("trimTitle");
const trimUploader = document.getElementById("trimUploader");
const trimStartInput = document.getElementById("trimStart");
const trimEndInput = document.getElementById("trimEnd");
const trimRangeFill = document.getElementById("trimRange");
const trimStartTime = document.getElementById("trimStartTime");
const trimEndTime = document.getElementById("trimEndTime");
const trimSelectionLabel = document.getElementById("trimSelectionLabel");

const trimPlayBtn = document.getElementById("trimPlayBtn");
const trimPlayIcon = document.getElementById("trimPlayIcon");
const trimPlayLabel = document.getElementById("trimPlayLabel");
const trimAudio = document.getElementById("trimAudio");
const trimVideo = document.getElementById("trimVideo");

const searchForm = document.getElementById("searchForm");
const searchQueryInput = document.getElementById("searchQuery");
const searchBtn = document.getElementById("searchBtn");
const searchStatus = document.getElementById("searchStatus");
const searchResults = document.getElementById("searchResults");

let selectedFormat = "MP3";
let trimInfo = null; // { duration, start, end }
let trimLoadedForUrl = null;
let currentPreviewId = null;
let activeMedia = null; // referencia al <audio> o <video> activo

const MIN_TRIM_GAP = 1; // segundos mínimos entre inicio y fin

// ---------- Selector de formato ----------

formatBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        formatBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedFormat = btn.dataset.format;

        // si el panel de preview/recorte está abierto, hay que re-pedir el preview
        // con el nuevo formato (el stream de audio y el de video son distintos)
        if (trimToggle.checked && trimLoadedForUrl) {
            currentPreviewId = null;
            loadPreview();
        }
    });
});

// ---------- Mostrar/ocultar límite según playlist, y exclusión mutua con "Recortar" ----------

isPlaylistCheckbox.addEventListener("change", () => {

    limitField.classList.toggle("open", isPlaylistCheckbox.checked);

    // el recorte solo tiene sentido para un único video, no para una playlist
    trimToggle.disabled = isPlaylistCheckbox.checked;

    if (isPlaylistCheckbox.checked && trimToggle.checked) {
        trimToggle.checked = false;
        closeTrimPanel();
    }

});

// ---------- Panel de previsualización + recorte ----------

trimToggle.addEventListener("change", () => {

    if (trimToggle.checked) {

        isPlaylistCheckbox.checked = false;
        isPlaylistCheckbox.disabled = true;
        limitField.classList.remove("open");

        trimPanel.classList.add("open");
        loadPreview();

    } else {

        isPlaylistCheckbox.disabled = false;
        closeTrimPanel();

    }

});

trimRetryBtn.addEventListener("click", loadPreview);

// si el enlace cambia después de haber cargado la info, invalida la caché
urlInput.addEventListener("input", () => {
    if (urlInput.value.trim() !== trimLoadedForUrl) {
        trimLoadedForUrl = null;
        trimInfo = null;
        currentPreviewId = null;

        if (trimToggle.checked) {
            trimToggle.checked = false;
            trimToggle.dispatchEvent(new Event("change"));
        }
    }
});

function closeTrimPanel() {

    trimPanel.classList.remove("open");

    stopPreviewPlayback();

    trimInfo = null;
    trimLoadedForUrl = null;
    currentPreviewId = null;

    // ocultar todos los estados del card
    trimLoading.classList.remove("active");
    trimError.classList.remove("active");
    trimContent.classList.remove("active");

    // limpiar contenido
    trimThumb.removeAttribute("src");
    trimThumb.alt = "";

    trimTitle.textContent = "";
    trimUploader.textContent = "";

    trimStartInput.value = 0;
    trimEndInput.value = 0;

    trimStartInput.max = 0;
    trimEndInput.max = 0;

    trimStartTime.value = "00:00";
    trimEndTime.value = "00:00";

    trimRangeFill.style.left = "0%";
    trimRangeFill.style.width = "0%";

    trimSelectionLabel.textContent = "0 segundos seleccionados";

    trimAudio.removeAttribute("src");
    trimVideo.removeAttribute("src");
    trimVideo.style.display = "none";
    trimAudio.style.display = "none";
}

function showTrimState(state) {
    [trimLoading, trimError, trimContent].forEach(el => el.classList.remove("active"));
    state.classList.add("active");
}

async function loadPreview() {

    const url = urlInput.value.trim();

    if (!url) {
        showTrimState(trimError);
        trimErrorMsg.textContent = "Pegá un enlace antes de recortar.";
        return;
    }

    // ya la tenemos para este mismo enlace y formato, no hace falta pedirla de nuevo
    if (trimLoadedForUrl === url && trimInfo && currentPreviewId) {
        showTrimState(trimContent);
        return;
    }

    showTrimState(trimLoading);
    stopPreviewPlayback();

    try {

        const response = await fetch("/api/preview", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url, format: selectedFormat.toLowerCase() })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "No se pudo obtener la información del video.");
        }

        const duration = Math.max(1, Math.floor(data.duration || 0));

        trimInfo = { duration, start: 0, end: duration };
        trimLoadedForUrl = url;
        currentPreviewId = data.previewId;

        trimThumb.src = data.thumbnail || "";
        trimThumb.alt = data.title || "Miniatura del video";
        trimTitle.textContent = data.title || "Sin título";
        trimUploader.textContent = data.uploader || "";

        trimStartInput.min = 0;
        trimStartInput.max = duration;
        trimStartInput.value = 0;

        trimEndInput.min = 0;
        trimEndInput.max = duration;
        trimEndInput.value = duration;

        updateTrimSliderUI();
        showTrimState(trimContent);

    } catch (err) {

        showTrimState(trimError);
        trimErrorMsg.textContent = err.message || "No se pudo conectar con el servidor.";

    }

}

let mediaState = "idle"; // idle | loading | playing | buffering

function setPlayButtonState(state) {

    mediaState = state;

    trimPlayBtn.classList.toggle("loading", state === "loading");
    trimPlayBtn.disabled = state === "loading";

    switch (state) {

        case "loading":
            trimPlayLabel.textContent = "Preparando...";
            break;

        case "buffering":
            trimPlayIcon.textContent = "❚❚";
            trimPlayLabel.textContent = "Cargando...";
            break;

        case "playing":
            trimPlayIcon.textContent = "❚❚";
            trimPlayLabel.textContent = "Reproduciendo...";
            break;

        default:
            trimPlayIcon.textContent = "▶";
            trimPlayLabel.textContent = "Escuchar el recorte seleccionado";

    }

}

function getActiveMediaTag() {
    return selectedFormat === "MP4" ? trimVideo : trimAudio;
}

function onPreviewCanPlay() {
    if (mediaState === "loading") setPlayButtonState("playing");
}

function onPreviewWaiting() {
    // se cortó el buffer a mitad de reproducción (el stream sigue transcodeando)
    if (mediaState === "playing") setPlayButtonState("buffering");
}

function onPreviewPlaying() {
    if (mediaState === "loading" || mediaState === "buffering") {
        setPlayButtonState("playing");
    }
}

function onPreviewError() {
    setPlayButtonState("idle");
    trimPlayLabel.textContent = "No se pudo reproducir";
}

function onPreviewEnded() {
    stopPreviewPlayback();
}

function onPreviewTimeUpdate() {
    if (activeMedia && activeMedia.currentTime >= trimInfo.end) {
        stopPreviewPlayback();
    }
}

function detachMediaListeners(media) {
    media.removeEventListener("canplay", onPreviewCanPlay);
    media.removeEventListener("waiting", onPreviewWaiting);
    media.removeEventListener("playing", onPreviewPlaying);
    media.removeEventListener("timeupdate", onPreviewTimeUpdate);
    media.removeEventListener("error", onPreviewError);
    media.removeEventListener("ended", onPreviewEnded);
}

function stopPreviewPlayback() {

    if (activeMedia) {
        activeMedia.pause();
        activeMedia.currentTime = 0;
        detachMediaListeners(activeMedia);
        activeMedia.style.display = "none";
    }

    setPlayButtonState("idle");

}

function startPreviewPlayback() {

    const media = getActiveMediaTag();
    const otherMedia = media === trimVideo ? trimAudio : trimVideo;

    // por si quedó algo cargado del otro formato
    otherMedia.pause();
    detachMediaListeners(otherMedia);
    otherMedia.removeAttribute("src");
    otherMedia.style.display = "none";

    activeMedia = media;
    activeMedia.style.display = selectedFormat === "MP4" ? "block" : "none";

    setPlayButtonState("loading");

    activeMedia.addEventListener("canplay", onPreviewCanPlay);
    activeMedia.addEventListener("waiting", onPreviewWaiting);
    activeMedia.addEventListener("playing", onPreviewPlaying);
    activeMedia.addEventListener("timeupdate", onPreviewTimeUpdate);
    activeMedia.addEventListener("error", onPreviewError);
    activeMedia.addEventListener("ended", onPreviewEnded);

    const params = new URLSearchParams({
        start: trimInfo.start,
        end: trimInfo.end
    });

    activeMedia.src = `/api/preview-stream/${currentPreviewId}?${params}`;
    activeMedia.load();

    activeMedia.play().catch(() => {
        // algunos navegadores rechazan el play() si todavía no hay datos suficientes;
        // los eventos canplay/waiting/error ya reflejan el estado real, así que lo ignoramos
    });

}

trimPlayBtn.addEventListener("click", () => {

    if (!currentPreviewId || !trimInfo) return;

    if (mediaState === "loading") return; // todavía preparando, no reaccionamos a doble click

    if (mediaState === "playing" || mediaState === "buffering") {
        stopPreviewPlayback();
        return;
    }

    startPreviewPlayback();

});

function formatSeconds(totalSeconds) {
    const s = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function parseTimeText(text) {
    const parts = text.trim().split(":").map(p => parseInt(p, 10));
    if (parts.some(Number.isNaN)) return null;
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
}

function updateTrimSliderUI() {

    const max = Number(trimStartInput.max) || 1;
    const start = Number(trimStartInput.value);
    const end = Number(trimEndInput.value);

    const startPct = (start / max) * 100;
    const endPct = (end / max) * 100;

    trimRangeFill.style.left = `${startPct}%`;
    trimRangeFill.style.width = `${Math.max(0, endPct - startPct)}%`;

    trimStartTime.value = formatSeconds(start);
    trimEndTime.value = formatSeconds(end);
    trimSelectionLabel.textContent = `${formatSeconds(end - start)} seleccionados`;

    if (trimInfo) {
        trimInfo.start = start;
        trimInfo.end = end;
    }

    // si cambia el recorte mientras se reproduce, cortamos para que no se pase de rango
    stopPreviewPlayback();

}

trimStartInput.addEventListener("input", () => {
    const maxStart = Number(trimEndInput.value) - MIN_TRIM_GAP;
    if (Number(trimStartInput.value) > maxStart) {
        trimStartInput.value = Math.max(0, maxStart);
    }
    updateTrimSliderUI();
});

trimEndInput.addEventListener("input", () => {
    const minEnd = Number(trimStartInput.value) + MIN_TRIM_GAP;
    if (Number(trimEndInput.value) < minEnd) {
        trimEndInput.value = Math.min(Number(trimEndInput.max), minEnd);
    }
    updateTrimSliderUI();
});

trimStartTime.addEventListener("change", () => {
    const seconds = parseTimeText(trimStartTime.value);
    const max = Number(trimEndInput.value) - MIN_TRIM_GAP;
    if (seconds === null) {
        updateTrimSliderUI();
        return;
    }
    trimStartInput.value = Math.min(Math.max(seconds, 0), Math.max(0, max));
    updateTrimSliderUI();
});

trimEndTime.addEventListener("change", () => {
    const seconds = parseTimeText(trimEndTime.value);
    const min = Number(trimStartInput.value) + MIN_TRIM_GAP;
    const max = Number(trimEndInput.max);
    if (seconds === null) {
        updateTrimSliderUI();
        return;
    }
    trimEndInput.value = Math.max(Math.min(seconds, max), Math.min(min, max));
    updateTrimSliderUI();
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

// ---------- Buscador de música (yt-dlp) ----------

function formatDuration(seconds) {
    if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "";
    const s = Math.max(0, Math.round(seconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
}

function formatViews(views) {
    if (!views && views !== 0) return "";
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M vistas`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K vistas`;
    return `${views} vistas`;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}

function setSearchStatus(text, variant) {
    searchResults.innerHTML = "";
    if (!text) {
        searchStatus.className = "search-status";
        searchStatus.textContent = "";
        return;
    }
    searchStatus.className = `search-status active${variant ? ` ${variant}` : ""}`;
    searchStatus.textContent = text;
}

function renderSearchResults(results) {

    searchStatus.className = "search-status";
    searchStatus.textContent = "";
    searchResults.innerHTML = "";

    results.forEach(item => {

        const card = document.createElement("button");
        card.type = "button";
        card.className = "search-result";

        const metaParts = [
            item.channel || item.uploader || "",
            formatDuration(item.duration),
            formatViews(item.views)
        ].filter(Boolean);

        card.innerHTML = `
            <img class="search-result-thumb" src="${item.thumbnail || ""}" alt="">
            <div class="search-result-text">
                <div class="search-result-title">${escapeHtml(item.title || "Sin título")}</div>
                <div class="search-result-meta">${escapeHtml(metaParts.join(" · "))}</div>
            </div>
        `;

        card.addEventListener("click", () => {

            urlInput.value = item.url || "";
            urlInput.dispatchEvent(new Event("input"));
            urlInput.focus();

            searchResults
                .querySelectorAll(".search-result")
                .forEach(el => el.classList.remove("selected"));

            card.classList.add("selected");

        });

        searchResults.appendChild(card);

    });

}

searchForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const query = searchQueryInput.value.trim();

    if (!query) {
        searchQueryInput.focus();
        return;
    }

    searchBtn.disabled = true;
    setSearchStatus("Buscando...", "loading");

    try {

        const response = await fetch("/api/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || "No se pudo realizar la búsqueda.");
        }

        const results = Array.isArray(data) ? data : (data.results || []);

        if (!results.length) {
            setSearchStatus("No se encontraron resultados.", "empty");
            return;
        }

        renderSearchResults(results);

    } catch (err) {

        setSearchStatus(err.message || "No se pudo conectar con el servidor.", "error");

    } finally {

        searchBtn.disabled = false;

    }

});

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
    const format = selectedFormat;

    const payload = { url, isPlaylist, limit, format };

    if (trimToggle.checked && trimInfo) {
        payload.start = trimInfo.start;
        payload.end = trimInfo.end;
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

function appendLog(logBox, message, isError = false) {
    const line = document.createElement('div');
    line.className = isError ? 'log-line err' : 'log-line';
    line.textContent = message;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
}

const modal = document.getElementById("update-modal")

const progressBar = document.getElementById("progress-bar")

const progressText = document.getElementById("progress-text")

const updateText = document.getElementById("update-text")

const updateButton = document.getElementById("update-button")

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

// ---------- Login YouTube ----------

const youtubeLoginBtn = document.getElementById("youtubeLoginBtn")

if (youtubeLoginBtn) {

    youtubeLoginBtn.addEventListener("click", () => {

        window.electron.openYoutubeLogin()

    })

}

youtubeLoginBtn.addEventListener("click", async () => {

    window.electron.openYoutubeLogin()

    setTimeout(async () => {

        const path = await window.electron.saveYoutubeCookies()

        console.log(
            "Archivo creado:",
            path
        )

    }, 30000)

})