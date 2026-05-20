const express = require("express");
const instructorController = require("./instructor.controller");
const instructorRoutes = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

// instructorRoutes.post("/",authMiddleware, instructorController.addInstructor);
// instructorRoutes.get("/profile",instructorController.getInstructorProfile);

instructorRoutes.post('/signup',instructorController.signUp );
instructorRoutes.post('/login', instructorController.login);
instructorRoutes.post("/reset",instructorController.forgetPassword);
instructorRoutes.patch("/verify",instructorController.verifyOtp);
instructorRoutes.patch("/password",instructorController.changePassword);

// instructorRoutes.get("/profile",authMiddleware,instructorController.getProfile);
instructorRoutes.get("/",instructorController.getInstructor);
instructorRoutes.patch("/update",authMiddleware,instructorController.updateStatus);
instructorRoutes.get("/revenue",authMiddleware,instructorController.getRevenue);
instructorRoutes.get("/activity",authMiddleware,instructorController.getActivity);
instructorRoutes.get("/analytics",authMiddleware,instructorController.getMonthlyStats );




module.exports = instructorRoutes;
