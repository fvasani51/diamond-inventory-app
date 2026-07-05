const mongoose = require("mongoose");

const diamondSchema = new mongoose.Schema(
  {
    carat: { type: Number, required: true },
    cut: { type: String, required: true },
    color: { type: String, required: true },
    clarity: { type: String, required: true },
    shape: { type: String, required: true },
    certification: { type: String },
    price: { type: Number, required: true },
    stockQuantity: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Diamond", diamondSchema);
