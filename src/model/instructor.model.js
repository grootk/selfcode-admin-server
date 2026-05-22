const mongoose = require("mongoose");

const workSchema = {
  company: {
    type: String,
    required: false,
    default: "",
  },
  role: {
    type: String,
    required: false,
    default: "",
  },
  duration: {
    type: String,
    required: false,
    default: "",
  },
};

const instructorSchema = new mongoose.Schema(
  {
    instructor_id: {
      type: String,
      required: true,
      unique: true,
    },
    instructor_first_name: {
      type: String,
      required: true,
    },
    instructor_last_name: {
      type: String,
      required: false,
    },
    instructor_email: {
      type: String,
      required: true,
      unique: true,
    },
    instructor_about: {
      type: String,
      required: false,
    },
    instructor_password: {
      type: String,
      required: false,
    },
    instructor_phone_no: {
      type: String,
      required: true,
      unique: true,
    },
    instructor_avatar: {
      type: String,
      required: false,
    },
    instructor_gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: false,
    },
    instructor_status: {
      type: String,
      enum: ["active", "in_active", "suspended"],
      required: false,
    },
    instructor_role: {
      type: String,
      enum: ["admin", "instructor"],
      required: "instructor",
    },
    instructor_country: {
      type: String,
      require: false,
    },
    instructor_state: {
      type: String,
      require: false,
    },
    is_verified: {
      type: Boolean,
      required: false,
      default: false,
    },
    last_login: {
      type: Date,
      required: true,
      default: new Date(),
    },
    instructor_otp: {
      type: Number,
      required: false,
    },
    course_count: {
      type: Number,
      required: false,
    },
    total_rating: {
      type: Number,
      required: false,
    },
    instructor_auth_token: {
      type: String,
      required: false,
    },
    work_experience: {
      type: [workSchema],
      required: false,
    },
    current_profile: {
      type: [workSchema],
      required: false,
    },
    reviewed_by: {
      type: Number,
      required: false,
    },
    social_media: {
      linkedin: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
      facebook: { type: String, default: "" },
    },
    holder_name: {
      type: String,
      required: false,
    },
    bank_name: {
      type: String,
      required: false,
    },
    account_no: {
      type: String,
      required: false,
    },
    ifsc_code: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("instructor", instructorSchema);
