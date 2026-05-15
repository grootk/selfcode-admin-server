const express = require("express");
const couponController = require("./coupon.controller");
const couponRoutes = express.Router({mergeParams:true});
const {authMiddleware}=require("../middleware")

couponRoutes.get("/",authMiddleware, couponController.getcoupon);
couponRoutes.post("/",authMiddleware, couponController.addcoupon);
couponRoutes.patch("/",authMiddleware, couponController.updatecoupon);
couponRoutes.delete("/",authMiddleware, couponController.deletecoupon);

module.exports = couponRoutes;