const express = require("express")
const router = express.Router()
const controller = require("../controllers/index.controller.js")

router.get("/", controller.index)
router.post("/api/download", controller.download)
router.get("/api/progress/:id", controller.chanelSSE)
router.get("/api/get-file/:id", controller.getFile)

module.exports = router