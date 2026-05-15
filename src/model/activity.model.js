const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
    {
        activity_id: {
            type: String,
            require: true,
            unique: true
        },
        instructor_id: {
            type: String,
            require: true,
        },
        course_id: {
            type: String,
            require: false,
        },
        activity_type: {
            type: String,
            enums: ["course_created","course_published", "course_draft", "course_edit", "payment_collected"],
            require: true,
        }

    }, {
    timestamps: true
}
)

module.exports = mongoose.model("activity", activitySchema);