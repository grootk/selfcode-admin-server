const mongoose = require("mongoose");

const completionModel = new mongoose.Schema(
  {
    completion_id: {
      type: String,
      required: true,
      unique: true,
    },
    course_id: {
      type: String,
      required: false,
    },
    chapter_id: {
      type: String,
      required: false,
    },
    student_id: {
      type: String,
      required: true,
    },
    course_status: {
      type: String,
      enums: ["completed", "inprogress", null, "new"],
      default: "inprogress",
    },
    chapter_status: {
      type: String,
      enums: ["completed", "inprogress", null, "new"],
      default: null,
    },
    topic_array: [
      {
        topic_id: {
          type: String,
          required: false,
        },
        topic_status: {
          type: String,
          enum: ["completed", "new"],
          default: null,
        },
      },
    ],
    completion_timestamp: {
      type: String,
      required: false,
    },
    current_chapter_id: {
      type: String,
      required: false,
    },
    chapter_rank: {
      type: Number,
      required: false,
    },
    current_topic_id: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = new mongoose.model("course_completion", completionModel);
