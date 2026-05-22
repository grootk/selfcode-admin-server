const mongoose = require("mongoose");

const certificateModel = new mongoose.Schema(
  {
    certificate_id: {
      type: String,
      required: true,
      unique: true,
    },
    student_id: {
      type: String,
      required: false,
    },
    course_id: {
      type: String,
      required: false,
    },
    certificate_url: {
      type: String,
      required: true,
    },
    certicate_type: {
      type: String,
      required: false,
    },
    quiz_badge_id: {
      type: String,
      required: false,
    },
    course_badge_id: {
      type: String,
      required: false,
    },
    issued_date: {
      type: Date,
      required: true,
    },
    is_free: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = new mongoose.model("certificate", certificateModel);
