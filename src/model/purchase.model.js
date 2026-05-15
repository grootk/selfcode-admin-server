const mongoose = require("mongoose");

const purchaseModel = new mongoose.Schema({
    purchase_id: {
        type: String,
        required: true,
        unique: true
    },
    course_id: {
        type: String,
        required: true,
    },
    student_id: {
        type: String,
        required: true,
    },
    transaction_id: {
        type: String,
        required: true
    },
    payment_method: {
        type: String,
        required: true
    },
    course_amount: {
        type: Number,
        required: true
    },
    is_favourite:{
        type: Boolean,
        required: false
    },
    course_status:{
       type: Boolean,
        required: false 
    }
}, { timestamps: true })

module.exports = new mongoose.model("purchase", purchaseModel);