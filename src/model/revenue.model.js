const mongoose = require("mongoose");

const revenueModel = new mongoose.Schema({
    revenue_id: {
        type: String,
        required: true,
        unique: true
    },
    instructor_id: {
        type: String,
        required: true,
    },
    total_sales: {
        type: Number,
        required: true,
    },
    admin_id: {
        type: String,
        required: false,
    },
    total_amount: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        required: true
    },
    revenue_taxes: {
        type: Number,
        required: false
    },
    platform_fee: {
        type: Number,
        required: false
    },
    revenue_status: {
        type: String,
        enums: ["paid", "unpaid"],
        required: false
    },
    revenue_month:{
        type: String,
        required: true
    },
    transaction_id:{
        type: String,
        required: false
    }

}, { timestamps: true })

module.exports = new mongoose.model("revenue", revenueModel);