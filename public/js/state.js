// ---------- Estado compartido ----------
// Formato elegido y datos del preview/recorte activo: lo necesitan
// format-selector.js, preview.js y download-form.js a la vez.

export const state = {
    selectedFormat: "MP3",
    trimInfo: null,          // { duration, start, end }
    trimLoadedForUrl: null,
    currentPreviewId: null
};

export const MIN_TRIM_GAP = 1; // segundos mínimos entre inicio y fin del recorte