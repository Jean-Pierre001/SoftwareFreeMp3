// ---------- Historial de búsquedas ----------

const historyList = document.getElementById("historyList");
const historyStatus = document.getElementById("historyStatus");

const SONGS_PREVIEW_COUNT = 3;

function formatDuration(seconds) {
    if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "";
    const s = Math.max(0, Math.round(seconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
}

function formatRelativeTime(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "ahora";
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    return `hace ${diffD} d`;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}

function setHistoryStatus(text, variant) {

    if (!text) {
        historyStatus.className = "history-status";
        historyStatus.textContent = "";
        return;
    }

    historyStatus.className = `history-status active${variant ? ` ${variant}` : ""}`;
    historyStatus.textContent = text;

}

// Cada búsqueda anterior se muestra con: thumbnail del primer resultado,
// el término buscado, cuándo se hizo, cuántos resultados trajo, y una
// pequeña vista previa (con duración) de las primeras canciones encontradas.
function renderHistory(items) {

    historyList.innerHTML = "";

    if (!items.length) {
        setHistoryStatus("Todavía no hay búsquedas.", "empty");
        return;
    }

    setHistoryStatus("", null);

    items.forEach(item => {

        const results = item.results || [];
        const resultCount = results.length;
        const firstThumb = results[0]?.thumbnail || "";

        const preview = results.slice(0, SONGS_PREVIEW_COUNT);
        const remaining = resultCount - preview.length;

        const songsHtml = preview
            .map(song => `
                <div class="history-item-song">
                    <span class="song-title">${escapeHtml(song.title || "Sin título")}</span>
                    <span class="song-duration">${formatDuration(song.duration)}</span>
                </div>
            `)
            .join("");

        const entry = document.createElement("button");
        entry.type = "button";
        entry.className = "history-item";

        entry.innerHTML = `
            <div class="history-item-top">
                <img class="history-item-thumb" src="${firstThumb}" alt="">
                <div class="history-item-head">
                    <div class="history-item-query">${escapeHtml(item.query)}</div>
                    <div class="history-item-meta">${resultCount} resultado${resultCount === 1 ? "" : "s"} · ${formatRelativeTime(item.createdAt)}</div>
                </div>
            </div>
            ${preview.length ? `<div class="history-item-songs">${songsHtml}</div>` : ""}
            ${remaining > 0 ? `<div class="history-item-more">+${remaining} más</div>` : ""}
        `;

        entry.addEventListener("click", () => {

            const searchQueryInput = document.getElementById("searchQuery");

            if (searchQueryInput) {
                searchQueryInput.value = item.query;
            }

            window.dispatchEvent(new CustomEvent("history:selected", { detail: item }));

        });

        historyList.appendChild(entry);

    });

}

export async function refreshHistory() {

    setHistoryStatus("Cargando historial...", "loading");

    try {

        const response = await fetch("/api/search/history");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "No se pudo cargar el historial.");
        }

        renderHistory(data.history);

    } catch (err) {

        setHistoryStatus(err.message || "No se pudo cargar el historial.", "error");

    }

}

// Se refresca cada vez que termina una búsqueda nueva
window.addEventListener("search:completed", refreshHistory);

// Carga inicial al abrir la página
refreshHistory();