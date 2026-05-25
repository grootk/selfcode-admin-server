const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    coupon_id: {
      type: String,
      require: true,
      unique: true,
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
      unique: true,
    },
    coupon_discount: {
      type: String,
      require: true,
    },
    coupon_status: {
      type: String,
      enums: ["active", "inactive"],
      require: true,
      default: "active",
    },
    is_promotional: {
      type: Boolean,
      require: true,
      default: false,
    },
    category_id: {
      type: [String],
      require: false,
    },
    coupon_start_date: {
      type: Date,
      require: false,
    },
    coupon_end_date: {
      type: Date,
      require: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("coupon", couponSchema);
