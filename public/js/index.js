// ---------- Punto de entrada ----------
// Cada import ejecuta el código de ese módulo (registra sus listeners, etc).
// preview.js va primero porque format-selector.js y playlist-toggle.js
// dependen de las funciones que exporta (loadPreview, closeTrimPanel).

import "./preview.js";
import "./format-selector.js";
import "./playlist-toggle.js";
import "./placeholder.js";
import "./search.js";
import "./download-form.js";
import "./updater.js";
import "./youtube-auth.js";