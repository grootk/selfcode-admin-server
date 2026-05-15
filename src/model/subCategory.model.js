const mongoose = require("mongoose");

const sub_categorySchema = new mongoose.Schema(
    {
        sub_category_id: {
            type: String,
            require: true,
            unique: true
        },
        category_id: {
            type: String,
            require: true,
        },
        sub_category_title: {
            type: String,
            require: true,
            unique: true
        },
        sub_category_icon: {
            type: String,
            require: false
        },
        sub_category_status: {
            type: String,
            enum: ["active", "in_active"],
            default: "active"
        },

    }, {
    timestamps: true
}
)

module.exports = mongoose.model("sub_category", sub_categorySchema);