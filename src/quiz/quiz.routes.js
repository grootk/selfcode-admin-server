const express = require("express");
const quizController = require("./quiz.controller");
const quizRoutes = express.Router({mergeParams:true});
const {authMiddleware}=require("../middleware")

quizRoutes.get("/",authMiddleware, quizController.getQuiz);
quizRoutes.post("/",authMiddleware, quizController.addQuiz);
quizRoutes.patch("/",authMiddleware, quizController.updateQuiz);

quizRoutes.delete("/",authMiddleware, quizController.deleteQuiz);

quizRoutes.get("/answer",authMiddleware, quizController.getQuizAnswer);
quizRoutes.patch("/answer",authMiddleware, quizController.updateQuestionScore);

// quizRoutes.post("/submission",authMiddleware, quizController.addSubmission);
quizRoutes.get("/evaluate",authMiddleware, quizController.getQuizScore);  //overview


quizRoutes.get("/analytics",authMiddleware, quizController.getQuizAnalytics);
quizRoutes.get("/top-students",authMiddleware, quizController.getTopStudents);





module.exports = quizRoutes;