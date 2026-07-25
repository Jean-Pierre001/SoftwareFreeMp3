// ---------- Panel de previsualización + recorte ----------
// Todo lo relacionado a "vista previa" vive acá junto: abrir/cerrar el panel,
// pedir los datos al servidor, manejar el slider de recorte, el playhead
// y el reproductor completo (play/pausa, seek, volumen, velocidad, fullscreen).

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
    trimPlayhead,
    trimStartTime,
    trimEndTime,
    trimSelectionLabel,
    trimPlayer,
    trimPlayerStage,
    trimPlayerPoster,
    trimPosterImg,
    trimBufferBadge,
    trimBigPlayBtn,
    trimBigPlayIcon,
    trimPlayBtn,
    trimPlayIcon,
    trimCurrentTimeLabel,
    trimDurationLabel,
    trimSeekInput,
    trimSeekProgress,
    trimSeekHandle,
    trimMuteBtn,
    trimVolumeIcon,
    trimVolumeInput,
    trimSpeedSelect,
    trimFullscreenBtn,
    trimMarkStartBtn,
    trimMarkEndBtn,
    trimAudio,
    trimVideo
} from "./dom.js";

import { state, MIN_TRIM_GAP } from "./state.js";

let activeMedia = null; // referencia al <audio> o <video> activo
let mediaState = "idle"; // idle | loading | buffering | playing | paused
let isDraggingSeek = false;
let lastVolume = 1;
let currentSeekOffset = 0; // Posición de inicio relativa al stream devuelto por FFmpeg

// ---------- Abrir / cerrar el panel ----------

trimToggle.addEventListener("change", () => {
    if (trimToggle.checked) {
        isPlaylistCheckbox.checked = false;
        isPlaylistCheckbox.disabled = true;
        document.getElementById("limitField")?.classList.remove("open");

        trimPanel.classList.add("open");
        loadPreview();
    } else {
        isPlaylistCheckbox.disabled = false;
        closeTrimPanel();
    }
});

trimRetryBtn.addEventListener("click", loadPreview);

// Si el enlace cambia después de haber cargado la info, invalida la caché
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

    // Ocultar todos los estados del card
    trimLoading.classList.remove("active");
    trimError.classList.remove("active");
    trimContent.classList.remove("active");

    // Limpiar contenido
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

    trimPlayhead.classList.remove("active");

    trimSelectionLabel.textContent = "0 segundos seleccionados";

    trimAudio.removeAttribute("src");
    trimVideo.removeAttribute("src");

    trimMarkStartBtn.disabled = true;
    trimMarkEndBtn.disabled = true;

    trimPosterImg.removeAttribute("src");
    trimPlayerPoster.style.backgroundImage = "";
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

    // Ya la tenemos para este mismo enlace y formato, no hace falta pedirla de nuevo
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

        if (data.thumbnail) {
            trimPosterImg.src = data.thumbnail;
            trimPlayerPoster.style.backgroundImage = `url("${data.thumbnail}")`;
        }

        trimStartInput.min = 0;
        trimStartInput.max = duration;
        trimStartInput.value = 0;

        trimEndInput.min = 0;
        trimEndInput.max = duration;
        trimEndInput.value = duration;

        applyPlayerFormatMode();
        updateTrimSliderUI();
        showTrimState(trimContent);

    } catch (err) {
        showTrimState(trimError);
        trimErrorMsg.textContent = err.message || "No se pudo conectar con el servidor.";
    }
}

// Ajusta el escenario del reproductor y los controles según el formato elegido
function applyPlayerFormatMode() {
    const isVideo = state.selectedFormat === "MP4";

    trimPlayerStage.classList.toggle("audio-mode", !isVideo);
    trimPlayer.classList.toggle("audio-format", !isVideo);
    trimFullscreenBtn.style.display = isVideo ? "flex" : "none";

    trimVideo.style.display = isVideo ? "block" : "none";
    trimAudio.style.display = "none";
}

// ---------- Reproducción del preview ----------

function setPlayButtonState(newState) {
    mediaState = newState;

    const isLoading = newState === "loading";
    const isBuffering = newState === "buffering";
    const isActive = newState === "playing" || newState === "buffering";

    trimPlayBtn.classList.toggle("loading", isLoading);
    trimPlayBtn.disabled = isLoading;

    trimBigPlayBtn.classList.toggle("loading", isLoading);
    trimBigPlayBtn.disabled = isLoading;

    trimPlayerStage.classList.toggle("is-active", isActive);
    trimPlayerStage.classList.toggle("is-buffering", isBuffering);

    trimPlayIcon.textContent = isActive ? "❚❚" : "▶";
    trimBigPlayIcon.textContent = "▶";

    trimMarkStartBtn.disabled = !isActive;
    trimMarkEndBtn.disabled = !isActive;
}

function getActiveMediaTag() {
    return state.selectedFormat === "MP4" ? trimVideo : trimAudio;
}

function getClipDuration() {
    return state.trimInfo ? Math.max(0, state.trimInfo.end - state.trimInfo.start) : 0;
}

function onPreviewCanPlay() {
    if (mediaState === "loading") setPlayButtonState("playing");
}

function onPreviewWaiting() {
    if (mediaState === "playing") setPlayButtonState("buffering");
}

function onPreviewPlaying() {
    if (mediaState === "loading" || mediaState === "buffering") {
        setPlayButtonState("playing");
    }
}

function onPreviewError() {
    setPlayButtonState("idle");
}

function onPreviewEnded() {
    stopPreviewPlayback();
}

function onPreviewTimeUpdate() {
    if (!activeMedia || !state.trimInfo) return;

    // Tiempo real en el clip = tiempo transcurrido en el elemento + offset del seek inicial
    const realClipTime = currentSeekOffset + activeMedia.currentTime;

    // Se pasó del final del recorte
    if (realClipTime >= getClipDuration()) {
        stopPreviewPlayback();
        return;
    }

    if (!isDraggingSeek) {
        trimSeekInput.value = Math.round(realClipTime * 10);
        updateSeekVisuals();
    }

    trimCurrentTimeLabel.textContent = formatSeconds(realClipTime);
    updatePlayhead(realClipTime);
}

function attachMediaListeners(media) {
    detachMediaListeners(media); // Previene acumulación duplicada de listeners
    media.addEventListener("canplay", onPreviewCanPlay);
    media.addEventListener("waiting", onPreviewWaiting);
    media.addEventListener("playing", onPreviewPlaying);
    media.addEventListener("timeupdate", onPreviewTimeUpdate);
    media.addEventListener("error", onPreviewError);
    media.addEventListener("ended", onPreviewEnded);
}

function detachMediaListeners(media) {
    if (!media) return;
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
        detachMediaListeners(activeMedia);
        activeMedia.removeAttribute("src");
        activeMedia.load();
        activeMedia = null;
    }

    currentSeekOffset = 0;
    setPlayButtonState("idle");

    trimSeekInput.value = 0;
    updateSeekVisuals();
    trimCurrentTimeLabel.textContent = "00:00";
    trimPlayhead.classList.remove("active");
    trimSpeedSelect.value = 1;
}

function startPreviewPlayback(seekOffset = 0) {
    const media = getActiveMediaTag();
    const otherMedia = media === trimVideo ? trimAudio : trimVideo;

    // Limpiar el otro reproductor
    otherMedia.pause();
    detachMediaListeners(otherMedia);
    otherMedia.removeAttribute("src");

    activeMedia = media;
    currentSeekOffset = seekOffset;

    activeMedia.volume = lastVolume;
    activeMedia.muted = lastVolume === 0;
    activeMedia.playbackRate = Number(trimSpeedSelect.value) || 1;

    const clipDuration = getClipDuration();
    trimSeekInput.max = Math.max(1, Math.round(clipDuration * 10));
    trimSeekInput.value = Math.round(seekOffset * 10);
    trimDurationLabel.textContent = formatSeconds(clipDuration);
    updateSeekVisuals();

    setPlayButtonState("loading");
    attachMediaListeners(activeMedia);

    const params = new URLSearchParams({
        start: state.trimInfo.start,
        end: state.trimInfo.end
    });

    if (seekOffset > 0) {
        params.set("seek", seekOffset);
    }

    activeMedia.src = `/api/preview-stream/${state.currentPreviewId}?${params}`;
    activeMedia.load();

    activeMedia.play().catch(() => {
        // Ignoramos interrupciones deliberadas al cambiar rápidamente el src
    });
}

function togglePlayback() {
    if (!state.currentPreviewId || !state.trimInfo) return;
    if (mediaState === "loading") return;

    if (mediaState === "playing" || mediaState === "buffering") {
        if (activeMedia) activeMedia.pause();
        setPlayButtonState("paused");
        trimPlayIcon.textContent = "▶";
        return;
    }

    if (mediaState === "paused" && activeMedia) {
        activeMedia.play().catch(() => {});
        setPlayButtonState("playing");
        return;
    }

    startPreviewPlayback();
}

trimPlayBtn.addEventListener("click", togglePlayback);
trimBigPlayBtn.addEventListener("click", togglePlayback);

// ---------- Barra de progreso (seek) ----------

function updateSeekVisuals() {
    const max = Number(trimSeekInput.max) || 1;
    const pct = (Number(trimSeekInput.value) / max) * 100;
    trimSeekProgress.style.width = `${pct}%`;
    trimSeekHandle.style.left = `${pct}%`;
}

trimSeekInput.addEventListener("input", () => {
    isDraggingSeek = true;
    updateSeekVisuals();
    trimCurrentTimeLabel.textContent = formatSeconds(Number(trimSeekInput.value) / 10);
});

const seekInStream = () => {
    if (!isDraggingSeek || !state.trimInfo) return;
    
    isDraggingSeek = false;
    const seekOffset = Number(trimSeekInput.value) / 10;

    startPreviewPlayback(seekOffset);
};

trimSeekInput.addEventListener("change", seekInStream);

// ---------- Volumen ----------

function updateVolumeIcon(volume, muted) {
    if (muted || volume === 0) {
        trimVolumeIcon.textContent = "🔇";
    } else if (volume < 0.5) {
        trimVolumeIcon.textContent = "🔉";
    } else {
        trimVolumeIcon.textContent = "🔊";
    }
}

trimVolumeInput.addEventListener("input", () => {
    const volume = Number(trimVolumeInput.value);
    lastVolume = volume;
    if (activeMedia) {
        activeMedia.volume = volume;
        activeMedia.muted = volume === 0;
    }
    updateVolumeIcon(volume, volume === 0);
});

trimMuteBtn.addEventListener("click", () => {
    if (!activeMedia) return;
    const willMute = !activeMedia.muted;
    activeMedia.muted = willMute;
    trimVolumeInput.value = willMute ? 0 : lastVolume || 1;
    updateVolumeIcon(activeMedia.volume, willMute);
});

// ---------- Velocidad ----------

trimSpeedSelect.addEventListener("change", () => {
    if (activeMedia) {
        activeMedia.playbackRate = Number(trimSpeedSelect.value) || 1;
    }
});

// ---------- Pantalla completa (sólo video) ----------

trimFullscreenBtn.addEventListener("click", () => {
    if (state.selectedFormat !== "MP4") return;

    if (document.fullscreenElement) {
        document.exitFullscreen();
        return;
    }

    if (trimVideo.requestFullscreen) {
        trimVideo.requestFullscreen();
    } else if (trimVideo.webkitEnterFullscreen) {
        trimVideo.webkitEnterFullscreen();
    }
});

// ---------- Slider de recorte (inicio/fin) + playhead ----------

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

function updatePlayhead(clipCurrentTime) {
    if (!state.trimInfo || mediaState === "idle") {
        trimPlayhead.classList.remove("active");
        return;
    }

    const max = Number(trimStartInput.max) || 1;
    const absoluteTime = state.trimInfo.start + clipCurrentTime;
    const pct = Math.min(100, Math.max(0, (absoluteTime / max) * 100));

    trimPlayhead.style.left = `${pct}%`;
    trimPlayhead.classList.add("active");
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

    // Comprobamos la posición real contra el nuevo clip máximo
    if (activeMedia) {
        const realClipTime = currentSeekOffset + activeMedia.currentTime;
        if (realClipTime > getClipDuration()) {
            stopPreviewPlayback();
        }
    }
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

// ---------- Acciones rápidas: marcar inicio/fin ----------

trimMarkStartBtn.addEventListener("click", () => {
    if (!activeMedia || !state.trimInfo) return;
    const realClipTime = currentSeekOffset + activeMedia.currentTime;
    const absoluteTime = Math.floor(state.trimInfo.start + realClipTime);
    const maxStart = Number(trimEndInput.value) - MIN_TRIM_GAP;
    trimStartInput.value = Math.min(Math.max(absoluteTime, 0), Math.max(0, maxStart));
    updateTrimSliderUI();
    stopPreviewPlayback();
});

trimMarkEndBtn.addEventListener("click", () => {
    if (!activeMedia || !state.trimInfo) return;
    const realClipTime = currentSeekOffset + activeMedia.currentTime;
    const absoluteTime = Math.ceil(state.trimInfo.start + realClipTime);
    const minEnd = Number(trimStartInput.value) + MIN_TRIM_GAP;
    const max = Number(trimEndInput.max);
    trimEndInput.value = Math.max(Math.min(absoluteTime, max), Math.min(minEnd, max));
    updateTrimSliderUI();
    stopPreviewPlayback();
});