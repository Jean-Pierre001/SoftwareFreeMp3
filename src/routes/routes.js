const express = require("express")
const router = express.Router()
const { indexController } = require("../controllers/index.controller")
const { downloadController } = require("../controllers/download.controller")
const { channelSSEController } = require("../controllers/channelSSE.controller")
const { getFileController } = require("../controllers/getFile.controller")
const { downloadInformationController } = require("../controllers/downloadInformation.controller")

router.get("/", indexController)
router.post("/api/download", downloadController)
router.post("/api/download-information", downloadInformationController)
router.get("/api/progress/:id", channelSSEController)
router.get("/api/get-file/:id", getFileController)

module.exports = router