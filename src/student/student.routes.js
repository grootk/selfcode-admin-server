const express = require('express');
const  studentController  = require("./student.controller");
const studentRouter = express.Router({mergeParams: true});
const {authMiddleware}=require("../middleware")

studentRouter.patch("/",authMiddleware,studentController.updateProfile);
studentRouter.post('/signup',studentController.signUp );
studentRouter.post('/login', studentController.login);
studentRouter.post("/reset",studentController.forgetPassword);
studentRouter.patch("/",studentController.verifyOtp);
studentRouter.patch("/",studentController.changePassword);


studentRouter.get("/",studentController.getStudentList);
studentRouter.get("/course",studentController.getCourse);
studentRouter.post("/purchase",authMiddleware,studentController.purchaseCourse);
studentRouter.get("/activity",authMiddleware,studentController.studentActivity);
studentRouter.get("/payment",authMiddleware,studentController.studentPurchases);

module.exports = studentRouter;
