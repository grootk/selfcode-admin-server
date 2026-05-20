const express = require("express");
const badgesController = require("./badges.controller");
const badgesRoutes = express.Router({mergeParams:true});
const {authMiddleware}=require("../middleware")

badgesRoutes.get("/",authMiddleware, badgesController.getBadges);
badgesRoutes.post("/",authMiddleware, badgesController.addBadges);
badgesRoutes.patch("/",authMiddleware, badgesController.updateBadges);
badgesRoutes.delete("/",authMiddleware, badgesController.deleteBadges);


module.exports = badgesRoutes;