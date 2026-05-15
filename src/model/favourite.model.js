const mongoose = require("mongoose");

const favouriteModel = new mongoose.Schema({
    favourite_id: {
        type: String,
        required: true,
        unique: true
    },
    student_id: {
        type: String,
        required: false,
    },
    instructor_id: {
        type: String,
        required: false,
    },
    course_id: {
        type: String,
        required: false,
    },
    question_id: {
        type: String,
        required: false,
    },
    favourite: {
        type: Boolean,
        required: true,
        default:true
    },
}, { timestamps: true })

module.exports = new mongoose.model("favourite", favouriteModel);