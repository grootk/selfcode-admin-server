const express = require("express");
const adminController = require("./admin.controller");
const adminRoutes = express.Router({mergeParams:true});
const {authMiddleware}=require("../middleware")

adminRoutes.get("/",authMiddleware, adminController.getProfile);
// adminRoutes.post("/",authMiddleware, adminController.addadmin);
// adminRoutes.patch("/",authMiddleware, adminController.updateadmin);
// adminRoutes.delete("/",authMiddleware, adminController.deleteadmin);

module.exports = adminRoutes;