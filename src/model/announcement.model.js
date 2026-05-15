const mongoose = require("mongoose");

const announcementModel = new mongoose.Schema({
    announcement_id: {
        type: String,
        required: true,
        unique: true
    },
    course_id:{
         type: String,
        required: true,
    },
    instructor_id:{
         type: String,
        required: true,
    },
    announcement_subject: {
        type: String,
        required: true,
    },
    announcement_message: {
        type: String,
        required: true,
    },
    student_ids: {
        type: [String],
        required: false,
    },
    announcement_status: {
        type:String,
        enums:["active","inactive"],
        required: false,
    },
}, { timestamps: true })

module.exports = new mongoose.model("announcement", announcementModel);