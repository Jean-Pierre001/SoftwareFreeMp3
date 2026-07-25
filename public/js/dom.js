// ---------- Referencias al DOM ----------
// Centralizadas acá para que ningún módulo repita un mismo getElementById/querySelector.

export const form = document.getElementById("downloadForm");
export const urlInput = document.getElementById("url");
export const startBtn = form.querySelector(".startBtn");
export const progressLine = form.querySelector(".progress-line");
export const logBox = form.querySelector(".log-container");
export const status = form.querySelector(".status-badge");
export const statusText = form.querySelector(".status-text");

export const formatBtns = form.querySelectorAll(".format-btn");
export const isPlaylistCheckbox = document.getElementById("isPlaylist");
export const limitField = document.getElementById("limitField");
export const limitInput = document.getElementById("limit");

export const cancelDownloadBtn = document.getElementById("cancelDownloadBtn");

// ---------- Panel de recorte ----------

export const trimToggle = document.getElementById("trimToggle");
export const trimPanel = document.getElementById("trimPanel");
export const trimLoading = document.getElementById("trimLoading");
export const trimError = document.getElementById("trimError");
export const trimErrorMsg = document.getElementById("trimErrorMsg");
export const trimRetryBtn = document.getElementById("trimRetryBtn");
export const trimContent = document.getElementById("trimContent");
export const trimThumb = document.getElementById("trimThumb");
export const trimTitle = document.getElementById("trimTitle");
export const trimUploader = document.getElementById("trimUploader");

// Slider de recorte (inicio/fin) + playhead
export const trimStartInput = document.getElementById("trimStart");
export const trimEndInput = document.getElementById("trimEnd");
export const trimRangeFill = document.getElementById("trimRange");
export const trimPlayhead = document.getElementById("trimPlayhead");
export const trimStartTime = document.getElementById("trimStartTime");
export const trimEndTime = document.getElementById("trimEndTime");
export const trimSelectionLabel = document.getElementById("trimSelectionLabel");

// Acciones rápidas de marcado
export const trimMarkStartBtn = document.getElementById("trimMarkStartBtn");
export const trimMarkEndBtn = document.getElementById("trimMarkEndBtn");

// Reproductor completo
export const trimPlayer = document.getElementById("trimPlayer");
export const trimPlayerStage = document.getElementById("trimPlayerStage");
export const trimPlayerPoster = document.getElementById("trimPlayerPoster");
export const trimPosterImg = document.getElementById("trimPosterImg");
export const trimBufferBadge = document.getElementById("trimBufferBadge");

export const trimBigPlayBtn = document.getElementById("trimBigPlayBtn");
export const trimBigPlayIcon = document.getElementById("trimBigPlayIcon");

export const trimPlayBtn = document.getElementById("trimPlayBtn");
export const trimPlayIcon = document.getElementById("trimPlayIcon");

export const trimCurrentTimeLabel = document.getElementById("trimCurrentTimeLabel");
export const trimDurationLabel = document.getElementById("trimDurationLabel");

export const trimSeekInput = document.getElementById("trimSeekInput");
export const trimSeekProgress = document.getElementById("trimSeekProgress");
export const trimSeekHandle = document.getElementById("trimSeekHandle");

export const trimMuteBtn = document.getElementById("trimMuteBtn");
export const trimVolumeIcon = document.getElementById("trimVolumeIcon");
export const trimVolumeInput = document.getElementById("trimVolumeInput");

export const trimSpeedSelect = document.getElementById("trimSpeedSelect");
export const trimFullscreenBtn = document.getElementById("trimFullscreenBtn");

export const trimAudio = document.getElementById("trimAudio");
export const trimVideo = document.getElementById("trimVideo");

// ---------- Búsqueda ----------

export const searchForm = document.getElementById("searchForm");
export const searchQueryInput = document.getElementById("searchQuery");
export const searchBtn = document.getElementById("searchBtn");
export const searchStatus = document.getElementById("searchStatus");
export const searchResults = document.getElementById("searchResults");
export const cancelSearchBtn = document.getElementById("cancelSearchBtn");

// ---------- Modal de actualización ----------

export const modal = document.getElementById("update-modal");
export const progressBar = document.getElementById("progress-bar");
export const progressText = document.getElementById("progress-text");
export const updateText = document.getElementById("update-text");
export const updateButton = document.getElementById("update-button");

// ---------- YouTube ----------

export const youtubeStatus = document.getElementById("youtubeStatus");
export const youtubeLoginBtn = document.getElementById("youtubeLoginBtn");