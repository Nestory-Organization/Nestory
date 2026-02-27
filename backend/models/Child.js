const mongoose = require("mongoose");

const childSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide child name"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    age: {
      type: Number,
      required: [true, "Please provide child age"],
      min: [1, "Age must be at least 1"],
      max: [17, "Age must be under 18"],
    },
    avatar: {
      type: String,
      default: "",
    },
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Child", childSchema);
