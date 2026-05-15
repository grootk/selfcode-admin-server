const mongoose = require("mongoose");

const questionModel = new mongoose.Schema({
    question_id: {
        type: String,
        required: true,
        unique: true
    },
    student_id: {
        type: String,
        required: false,
    },
    // chapter_id: {
    //     type: String,
    //     required: false,
    // },
    instructor_id: {
        type: String,
        required: false,
    },
    course_id: {
        type: String,
        required: true,
    },
    question: {
        type: String,
        required: false,
    },
}, { timestamps: true })

module.exports = new mongoose.model("question", questionModel);