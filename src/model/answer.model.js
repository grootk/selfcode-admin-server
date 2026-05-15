const mongoose = require("mongoose");

const answerModel = new mongoose.Schema({
    answer_id: {
        type: String,
        required: true,
        unique: true
    },
    question_id: {
        type: String,
        required: true,
    },
    student_id: {
        type: String,
        required: false,
    },
    instructor_id: {
        type: String,
        required: false,
    },
    // chapter_id: {
    //     type: String,
    //     required: true,
    // },
    course_id: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
}, { timestamps: true })

module.exports = new mongoose.model("answer", answerModel);