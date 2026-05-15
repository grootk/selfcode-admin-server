const mongoose = require("mongoose");

const topicModel = new mongoose.Schema({
    topic_id: {
        type: String,
        required: true,
        unique: true
    },
    course_id: {
        type: String,
        required: true,
    },
    chapter_id: {
        type: String,
        required: false,
    },
    topic_title: {
        type: String,
        required: true
    },
    topic_description: {
        type: String,
        required: false
    },
    is_free_preview: {
        type: Boolean,
        required: true,
        default: false,
    },
    topic_rank: {
        type: Number,
        required: true
    },
    video_url: {
        type: String,
        required: false
    },
    topic_duration: {
        type: Number,
        required: false
    },
    topic_type: {
        type: String,
        enum: ["video", "quiz", "assignment"],
        required: true
    },
    total_submission:{
        type: Number,
        required: false
    },
    quiz_id:{
        type: String,
        required: false
    }
},
{ timestamps: true }
)

module.exports = new mongoose.model("topic", topicModel);