const mongoose = require("mongoose");

const courseModel = new mongoose.Schema(
  {
    course_id: {
      type: String,
      required: true,
      unique: true,
    },
    category_id: {
      type: String,
      required: true,
    },
    sub_category_id: {
      type: String,
      required: false,
    },
    course_title: {
      type: String,
      required: true,
    },
    course_description: {
      type: String,
      required: true,
    },
    course_overview: {
      type: String,
      required: true,
    },
    instructor_id: {
      type: String,
      required: true,
    },
    course_price: {
      type: Number,
      required: true,
    },
    course_price_type: {
      type: String,
      required: true,
    },
    course_discount: {
      type: Number,
      required: true,
    },
    course_tags: {
      type: [String],
      required: true,
    },
    course_level: {
      type: String,
      enum: ["beginner", "intermediate", "advance"],
      default: "beginner",
    },
    course_language: {
      type: String,
      required: false,
    },
    course_thumbnail: {
      type: String,
      required: false,
    },
    course_promovideo: {
      type: String,
      required: false,
    },
    course_status: {
      type: String,
      enum: ["published", "draft", "inreview", "rejected"],
      default: "draft",
    },
    course_review_date: {
      type: Date,
      required: false,
    },
    course_publish_date: {
      type: Date,
      required: false,
    },
    course_rejected_date: {
      type: Date,
      required: false,
    },
    course_reject_reason: {
      type: String,
      required: false,
    },
    skill_gained: {
      type: [String],
      required: false,
    },
    student_enrolled: {
      type: Number,
      required: false,
    },
    course_total_rating: {
      type: Number,
      required: false,
    },
    course_duration: {
      type: Number,
      required: false,
    },
    chapter_count: {
      type: Number,
      required: false,
    },
    quiz_count: {
      type: Number,
      required: false,
    },
    reviewed_by: {
      type: Number,
      required: false,
    },
    course_coupons: {
      type: [String],
      required: false,
    },
    is_promotional: {
      type: Boolean,
      required: false,
      default: false,
    },
    promotional_coupons: {
      type: [String],
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = new mongoose.model("course", courseModel);
