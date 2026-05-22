const express = require("express");
const { studentRoutes } = require("./student");
const { categoryRoutes } = require("./category");
const { courseRoutes } = require("./course");
const { instructorRoutes } = require("./instructor");
const { reviewRoutes } = require("./review");
const { questionRoutes } = require("./question");
const { quizRoutes } = require("./quiz");
const { couponRoutes } = require("./coupon");
const { badgesRoutes } = require("./badges");

const apiRoutes = express.Router({ mergeParams: true });

apiRoutes.use("/v1/student", studentRoutes);
apiRoutes.use("/v1/category", categoryRoutes);
apiRoutes.use("/v1/course", courseRoutes);
apiRoutes.use("/v1/instructor", instructorRoutes);
apiRoutes.use("/v1/review", reviewRoutes);
apiRoutes.use("/v1/question", questionRoutes);
apiRoutes.use("/v1/quiz", quizRoutes);
apiRoutes.use("/v1/coupon", couponRoutes);
apiRoutes.use("/v1/badges", badgesRoutes);

module.exports = apiRoutes;
