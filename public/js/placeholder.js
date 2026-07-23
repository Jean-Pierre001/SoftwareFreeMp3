// ---------- Placeholder rotativo: refuerza "cualquier plataforma" ----------

import { urlInput } from "./dom.js";

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