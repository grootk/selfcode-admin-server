const mongoose = require("mongoose");

const badgesModel = new mongoose.Schema(
  {
    badges_id: {
      type: String,
      required: true,
      unique: true,
    },
    badge_image: {
      type: String,
      required: true,
    },
    badge_type: {
      type: String,
      required: false,
    },
    badge_score: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = new mongoose.model("badges", badgesModel);
