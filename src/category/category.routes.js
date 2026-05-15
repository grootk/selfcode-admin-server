const express = require("express");
const categoryController = require("./category.controller");
const categoryRoutes = express.Router({mergeParams:true});
const {authMiddleware}=require("../middleware")

categoryRoutes.get("/",authMiddleware, categoryController.getCategory);
categoryRoutes.post("/",authMiddleware, categoryController.addCategory);
categoryRoutes.patch("/",authMiddleware, categoryController.updateCategory);
categoryRoutes.delete("/",authMiddleware, categoryController.deleteCategory);

categoryRoutes.get("/subCategory",authMiddleware, categoryController.getSubCategory);
categoryRoutes.post("/subCategory",authMiddleware, categoryController.addSubCategory);
categoryRoutes.patch("/subCategory",authMiddleware, categoryController.updateSubCategory);
categoryRoutes.delete("/subCategory",authMiddleware, categoryController.deleteSubCategory);

module.exports = categoryRoutes;