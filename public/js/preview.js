// ---------- Panel de previsualización + recorte ----------
// Todo lo relacionado a "vista previa" vive acá junto: abrir/cerrar el panel,
// pedir los datos al servidor, manejar el slider de recorte y reproducir el preview.

import {
    urlInput,
    isPlaylistCheckbox,
    trimToggle,
    trimPanel,
    trimLoading,
    trimError,
    trimErrorMsg,
    trimRetryBtn,
    trimContent,
    trimThumb,
    trimTitle,
    trimUploader,
    trimStartInput,
    trimEndInput,
    trimRangeFill,
    trimStartTime,
    trimEndTime,
    trimSelectionLabel,
    trimPlayBtn,
    trimPlayIcon,
    trimPlayLabel,
    trimAudio,
    trimVideo
} from "./dom.js";

import { state, MIN_TRIM_GAP } from "./state.js";

let activeMedia = null; // referencia al <audio> o <video> activo
let mediaState = "idle"; // idle | loading | playing | buffering

// ---------- Abrir / cerrar el panel ----------

trimToggle.addEventListener("change", () => {

    if (trimToggle.checked) {

        isPlaylistCheckbox.checked = false;
        isPlaylistCheckbox.disabled = true;
        document.getElementById("limitField").classList.remove("open");

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
    if (urlInput.value.trim() !== state.trimLoadedForUrl) {
        state.trimLoadedForUrl = null;
        state.trimInfo = null;
        state.currentPreviewId = null;

        if (trimToggle.checked) {
            trimToggle.checked = false;
            trimToggle.dispatchEvent(new Event("change"));
        }
    }
});

export function closeTrimPanel() {

    trimPanel.classList.remove("open");

    stopPreviewPlayback();

    state.trimInfo = null;
    state.trimLoadedForUrl = null;
    state.currentPreviewId = null;

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

function showTrimState(panelState) {
    [trimLoading, trimError, trimContent].forEach(el => el.classList.remove("active"));
    panelState.classList.add("active");
}

// ---------- Cargar los datos del video para el panel ----------

export async function loadPreview() {

    const url = urlInput.value.trim();

    if (!url) {
        showTrimState(trimError);
        trimErrorMsg.textContent = "Pegá un enlace antes de recortar.";
        return;
    }

    // ya la tenemos para este mismo enlace y formato, no hace falta pedirla de nuevo
    if (state.trimLoadedForUrl === url && state.trimInfo && state.currentPreviewId) {
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
            body: JSON.stringify({ url, format: state.selectedFormat.toLowerCase() })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "No se pudo obtener la información del video.");
        }

        const duration = Math.max(1, Math.floor(data.duration || 0));

        state.trimInfo = { duration, start: 0, end: duration };
        state.trimLoadedForUrl = url;
        state.currentPreviewId = data.previewId;

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

// ---------- Reproducción del preview ----------

function setPlayButtonState(newState) {

    mediaState = newState;

    trimPlayBtn.classList.toggle("loading", newState === "loading");
    trimPlayBtn.disabled = newState === "loading";

    switch (newState) {

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
    return state.selectedFormat === "MP4" ? trimVideo : trimAudio;
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
    if (activeMedia && state.trimInfo && activeMedia.currentTime >= state.trimInfo.end) {
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
    activeMedia.style.display = state.selectedFormat === "MP4" ? "block" : "none";

    setPlayButtonState("loading");

    activeMedia.addEventListener("canplay", onPreviewCanPlay);
    activeMedia.addEventListener("waiting", onPreviewWaiting);
    activeMedia.addEventListener("playing", onPreviewPlaying);
    activeMedia.addEventListener("timeupdate", onPreviewTimeUpdate);
    activeMedia.addEventListener("error", onPreviewError);
    activeMedia.addEventListener("ended", onPreviewEnded);

    const params = new URLSearchParams({
        start: state.trimInfo.start,
        end: state.trimInfo.end
    });

    activeMedia.src = `/api/preview-stream/${state.currentPreviewId}?${params}`;
    activeMedia.load();

    activeMedia.play().catch(() => {
        // algunos navegadores rechazan el play() si todavía no hay datos suficientes;
        // los eventos canplay/waiting/error ya reflejan el estado real, así que lo ignoramos
    });

}

trimPlayBtn.addEventListener("click", () => {

    if (!state.currentPreviewId || !state.trimInfo) return;

    if (mediaState === "loading") return; // todavía preparando, no reaccionamos a doble click

    if (mediaState === "playing" || mediaState === "buffering") {
        stopPreviewPlayback();
        return;
    }

    startPreviewPlayback();

});

// ---------- Slider de recorte (inicio/fin) ----------

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

    if (state.trimInfo) {
        state.trimInfo.start = start;
        state.trimInfo.end = end;
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