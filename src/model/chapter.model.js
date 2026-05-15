const mongoose = require("mongoose");

const chapterModel = new mongoose.Schema({
    chapter_id: {
        type: String,
        required: true,
        unique: true
    },
    course_id: {
        type: String,
        required: true,
    },
    chapter_title: {
        type: String,
        required: true
    },
    chapter_description: {
        type: String,
        required: false
    },
    chapter_rank: {
        type: Number,
        required: true
    },
    chapter_duration:{
        type: Number,
        required: false
    },
}, { timestamps: true })

module.exports = new mongoose.model("chapter", chapterModel);