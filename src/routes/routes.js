const express = require("express")
const router = express.Router()
const { indexController } = require("../controllers/index.controller")
const { downloadController } = require("../controllers/download.controller")
const { channelSSEController } = require("../controllers/channelSSE.controller")
const { getFileController } = require("../controllers/getFile.controller")
const { searchSongController } = require("../controllers/searchSong.controller")
const { songPreviewController } = require("../controllers/songPreview.controller")
const { previewStreamController } = require("../controllers/previewStream.controller")

router.get("/", indexController)
router.post("/api/download", downloadController)
router.post("/api/preview", songPreviewController)
router.get("/api/preview-stream/:previewId", previewStreamController)
router.post("/api/search", searchSongController)
router.get("/api/progress/:id", channelSSEController)
router.get("/api/get-file/:id", getFileController)

module.exports = router