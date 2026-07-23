// ---------- Selector de formato ----------

import { formatBtns, trimToggle } from "./dom.js";
import { state } from "./state.js";
import { loadPreview } from "./preview.js";

formatBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        formatBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.selectedFormat = btn.dataset.format;

        // si el panel de preview/recorte está abierto, hay que re-pedir el preview
        // con el nuevo formato (el stream de audio y el de video son distintos)
        if (trimToggle.checked && state.trimLoadedForUrl) {
            state.currentPreviewId = null;
            loadPreview();
        }
    });
});