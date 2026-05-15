const mongoose = require("mongoose");

const completionModel = new mongoose.Schema({
    completion_id: {
        type: String,
        required: true,
        unique: true
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
    topic_id: {
        type: String,
        required: false,
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
    topic_status: {
        type: String,
        enums: ["completed", "inprogress", null, "new"],
        default: null,
    },
    completion_timestamp: {
        type: String,
        required: false,
    },
    current_chapter_rank: {
        type: Number,
        required: false,
    },
    current_topic_rank: {
        type: Number,
        required: false,
    }
}, { timestamps: true })

module.exports = new mongoose.model("course_completion", completionModel);