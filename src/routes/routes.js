const express = require("express")
const router = express.Router()
const { indexController } = require("../controllers/index.controller")
const { downloadController } = require("../controllers/download.controller")
const { channelSSEController } = require("../controllers/channelSSE.controller")
const { getFileController } = require("../controllers/getFile.controller")
const { searchSongController } = require("../controllers/searchSong.controller")
const { songPreviewController } = require("../controllers/songPreview.controller")
const { previewStreamController } = require("../controllers/previewStream.controller")
const { youtubeStatusController } = require("../controllers/youtubeStatus.controller")
const { cancelSearchController } = require("../controllers/cancelSearch.controller")
const { cancelDownloadController } = require("../controllers/cancelDownload.controller")
const { searchHistoryController } = require("../controllers/searchHistory.controller")

router.get("/", indexController)
router.post("/api/download", downloadController)
router.post("/api/download/cancel", cancelDownloadController)
router.get("/api/progress/:id", channelSSEController)
router.get("/api/get-file/:id", getFileController)
router.get("/api/youtube-status", youtubeStatusController)

//---- Rutas de historial ----//
router.get("/api/search/history", searchHistoryController)

//---- Rutas de previsualizacion ----//
router.post("/api/preview", songPreviewController)
router.get("/api/preview-stream/:previewId", previewStreamController)

//---- Rutas de busqueda ----//
router.post("/api/search", searchSongController)
router.post("/api/search/cancel", cancelSearchController)

module.exports = router