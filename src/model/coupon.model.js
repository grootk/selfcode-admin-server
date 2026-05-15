const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        coupon_id: {
            type: String,
            require: true,
            unique: true
        },
        instructor_id: {
            type: String,
            require: true,
        },
        coupon_title: {
            type: String,
            require: true,
        },
        coupon_type: {
            type: String,
            enums: ["flat", "percentage"],
            require: false,
        },
        coupon_code: {
            type: String,
            require: true,
            unique: true
        },
        coupon_discount: {
            type: String,
            require: true,
        },
        coupon_status: {
            type: String,
            enums:["active","inactive"],
            require: true,
            default:"active"
        }

    }, {
    timestamps: true
}
)

module.exports = mongoose.model("coupon", couponSchema);