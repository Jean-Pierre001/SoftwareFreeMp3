// ---------- Buscador de música (yt-dlp) ----------

import { urlInput, searchForm, searchQueryInput, searchBtn, searchStatus, searchResults } from "./dom.js";

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