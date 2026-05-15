const express = require("express");
const courseController = require("./course.controller");
const courseRoutes = express.Router({mergeParams:true});
const {authMiddleware}=require("../middleware")

courseRoutes.get("/all",authMiddleware, courseController.getAllCourses);
courseRoutes.get("/",authMiddleware, courseController.getCourse);
courseRoutes.get("/detail",authMiddleware, courseController.getCourseDetail);
courseRoutes.post("/",authMiddleware, courseController.addCourse);
courseRoutes.patch("/",authMiddleware, courseController.updateCourse);
courseRoutes.delete("/",authMiddleware, courseController.deleteCourse);


courseRoutes.get("/chapter",authMiddleware, courseController.getChapterAndTopics);
courseRoutes.get("/chapter/all",authMiddleware, courseController.getAllChapter);
courseRoutes.post("/chapter",authMiddleware, courseController.addChapter);
courseRoutes.patch("/chapter",authMiddleware, courseController.updateChapter);
courseRoutes.delete("/chapter",authMiddleware, courseController.deleteChapter);

courseRoutes.get("/topic",authMiddleware, courseController.getTopic);
courseRoutes.post("/topic",authMiddleware, courseController.addTopic);
courseRoutes.patch("/topic",authMiddleware, courseController.updateTopic);
courseRoutes.delete("/topic",authMiddleware, courseController.deleteTopic);

courseRoutes.post("/favourite",authMiddleware, courseController.addFavourite);
courseRoutes.get("/student",authMiddleware, courseController.getStudent);

// courseRoutes.get("/analytics",authMiddleware, courseController.getQuizAnalytics);

module.exports = courseRoutes;