const express = require("express")
const router = express.Router()
const { indexController } = require("../controllers/index.controller")
const { downloadController } = require("../controllers/download.controller")
const { channelSSEController } = require("../controllers/channelSSE.controller")
const { getFileController } = require("../controllers/getFile.controller")

router.get("/", indexController)
router.post("/api/download", downloadController)
router.get("/api/progress/:id", channelSSEController)
router.get("/api/get-file/:id", getFileController)

module.exports = router