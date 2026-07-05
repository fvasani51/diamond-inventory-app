const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    address: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
