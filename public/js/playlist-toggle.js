// ---------- Mostrar/ocultar límite según playlist, y exclusión mutua con "Recortar" ----------

import { isPlaylistCheckbox, limitField, trimToggle } from "./dom.js";
import { closeTrimPanel } from "./preview.js";

isPlaylistCheckbox.addEventListener("change", () => {

    limitField.classList.toggle("open", isPlaylistCheckbox.checked);

    // el recorte solo tiene sentido para un único video, no para una playlist
    trimToggle.disabled = isPlaylistCheckbox.checked;

    if (isPlaylistCheckbox.checked && trimToggle.checked) {
        trimToggle.checked = false;
        closeTrimPanel();
    }

});