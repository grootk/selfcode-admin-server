const mongoose = require("mongoose");

const detailSchema = {
  student: {
    college_name: {
      type: String,
      require: false,
    },
    city: {
      type: String,
      require: false,
    },
  },
  professional: {
    company_name: {
      type: String,
      require: false,
    },
    city: {
      type: String,
      require: false,
    },
  },
  teacher: {
    institution_name: {
      type: String,
      require: false,
    },
    city: {
      type: String,
      require: false,
    },
  },
  other: {
    description: {
      type: String,
      require: false,
    },
  },
};

const studentSchema = new mongoose.Schema(
  {
    student_id: {
      type: String,
      require: true,
      unique: true,
    },
    student_first_name: {
      type: String,
      require: true,
    },
    student_last_name: {
      type: String,
      require: false,
    },
    student_email: {
      type: String,
      require: true,
      unique: true,
    },
    student_password: {
      type: String,
      require: false,
    },
    student_phone_no: {
      type: String,
      require: false,
    },
    student_gender: {
      type: String,
      enums: ["male", "female"],
      default: "male",
    },
    student_avatar: {
      type: String,
      require: false,
    },
    student_country:{
      type: String,
      require: false,
    },
    student_state:{
      type: String,
      require: false,
    },
    student_about: {
      type: detailSchema,
      require: false,
    },
    student_status: {
      type: String,
      enum: ["active", "in_active", "suspendend"],
      require: false,
    },
    is_premium: {
      type: Boolean,
      require: false,
      default: false,
    },
    last_login: {
      type: Date,
      require: true,
      default: new Date(),
    },
    student_otp: {
      type: Number,
      require: false,
    },
    course_purchased: {
      type: [String],
      require: false,
    },
    course_count: {
      type: Number,
      require: false,
    },
    avg_score: {
      type: Number,
      require: false,
    },
    certificate_earned: {
      type: Number,
      require: false,
    },
    badge_count: {
      type: Number,
      require: false,
    },
    student_auth_token: {
      type: String,
      require: false,
    },
    student_type:{
      type: String,
      require: false,
      default:"student"
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("student", studentSchema);
