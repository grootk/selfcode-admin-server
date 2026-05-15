const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        category_id: {
            type: String,
            require: true,
            unique: true
        },
        category_title: {
            type: String,
            require: true,
            unique:true
        },
        category_icon: {
            type: String,
            require: false
        },
        category_status: {
            type: String,
            enum:["active","in_active"],
            default:"active"
        },
        
    }, {
    timestamps: true
}
)

module.exports = mongoose.model("category", categorySchema);