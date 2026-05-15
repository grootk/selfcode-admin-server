const express = require("express");
const reviewController = require("./review.controller");
const reviewRoutes = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

reviewRoutes.get("/", authMiddleware, reviewController.getReview);
// reviewRoutes.post("/",authMiddleware, reviewController.addReview);
reviewRoutes.patch("/",authMiddleware, reviewController.pinReview);

reviewRoutes.get("/announce", authMiddleware, reviewController.getAnnouncement);
reviewRoutes.get("/announce/detail", authMiddleware, reviewController.getAnnouncementDetail);
reviewRoutes.post("/announce", authMiddleware, reviewController.addAnnouncement);
reviewRoutes.patch("/announce", authMiddleware, reviewController.updateAnnouncement);
reviewRoutes.delete("/announce", authMiddleware, reviewController.deleteAnnouncement);

module.exports = reviewRoutes;
