const express = require("express");
const questionController = require("./question.controller");
const questionRoutes = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

questionRoutes.get("/",authMiddleware, questionController.getQuestion);
questionRoutes.post("/",authMiddleware, questionController.addQuestion);
questionRoutes.delete("/",authMiddleware, questionController.deleteQuestion);
questionRoutes.post("/answer",authMiddleware, questionController.addAnswer);
questionRoutes.delete("/answer",authMiddleware, questionController.deleteAnswer);


module.exports = questionRoutes;
