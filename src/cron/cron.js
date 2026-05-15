const cron = require("node-cron");
const { logger } = require("../../packages/manager");
const instructorModel = require("../model/instructor.model");

const userCron = async () => {
cron.schedule("0 0 1 * *", async () => {
  try {
    logger.info(" Monthly revenue cron started");

    const now = new Date();
    const month = now.toLocaleString("default", { month: "long" }).toLowerCase();
    const year = now.getFullYear();

    
    const instructors = await instructorModel.find({}, { instructor_id: 1 });

    if (!instructors.length) {
      console.log("No instructors found");
      return;
    }

  
    const revenueDocs = instructors.map((inst) => ({
      revenue_id: generateRevenueId(),
      instructor_id: inst.instructor_id,
      admin_id: "",
      transaction_id: "",
      payment_method: "",
      total_amount: 0,
      total_sales: 0,
      platform_fee: 0,
      revenue_taxes: 0,
      revenue_month: month,
      revenue_year: year,
      revenue_status: "unpaid",
      createdAt: now,
      updatedAt: now,
    }));


    await revenueModel.insertMany(revenueDocs);

    logger.info("Revenue created for all instructors");

  } catch (error) {
    logger.error("Cron error:", error.message);
  }
}, {
  timezone: "Asia/Kolkata" // 🇮🇳 important for correct midnight
});
};

module.exports = {
  userCron,
};
