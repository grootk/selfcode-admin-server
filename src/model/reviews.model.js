const mongoose = require("mongoose");

const reviewModel = new mongoose.Schema({
    review_id: {
        type: String,
        required: true,
        unique: true
    },
    student_id: {
        type: String,
        required: true,
    },
    course_id: {
        type: String,
        required: false,
    },
    instructor_id: {
        type: String,
        required: false
    },
    review_feedback: {
        type: String,
        required: false
    },
    instructor_rating: {
        type: Number,
        required: false,
        default: false,
    },
    course_rating: {
        type: Number,
        required: false,
        default: false,
    },
    is_testimonial: {
        type: Boolean,
        required: false,
        default:false,
        
    }
}, { timestamps: true })

module.exports = new mongoose.model("review", reviewModel);