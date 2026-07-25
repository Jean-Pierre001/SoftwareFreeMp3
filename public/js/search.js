// ---------- Buscador de música (yt-dlp) ----------

import { urlInput, searchForm, searchQueryInput, searchBtn, searchStatus, searchResults, cancelSearchBtn } from "./dom.js";

let currentSearchId = null;
let currentSearchController = null;

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

    // Cancelar el fetch anterior
    if (currentSearchController) {
        currentSearchController.abort();
    }

    // Cancelar la búsqueda anterior en el backend
    if (currentSearchId) {

        try {

            await fetch("/api/search/cancel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    searchId: currentSearchId
                })
            });

        } catch {}

        currentSearchId = null;

    }

    currentSearchController = new AbortController();

    searchBtn.hidden = true;
    cancelSearchBtn.hidden = false
    setSearchStatus("Buscando...", "loading");

    try {

        const response = await fetch("/api/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query }),
            signal: currentSearchController.signal
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "No se pudo realizar la búsqueda.");
        }

        currentSearchId = data.searchId;

        if (!data.results.length) {
            setSearchStatus("No se encontraron resultados.", "empty");
            return;
        }

        renderSearchResults(data.results);

    } catch (err) {

        if (err.name === "AbortError") {
            return;
        }

        setSearchStatus(err.message || "No se pudo conectar con el servidor.", "error");

    } finally {

        currentSearchController = null;
        currentSearchId = null;
        searchBtn.hidden = false;
        cancelSearchBtn.hidden = true
    }

});

cancelSearchBtn.addEventListener("click", async () => {

    if (currentSearchController) {
        currentSearchController.abort()
    }

    if (currentSearchId) {

        try {

            await fetch("/api/search/cancel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    searchId: currentSearchId
                })
            })

        } catch {}

    }

    currentSearchController = null
    currentSearchId = null

    searchBtn.hidden = false
    cancelSearchBtn.hidden = true

    setSearchStatus("Búsqueda cancelada.", "empty")

})