const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    diamond: { type: mongoose.Schema.Types.ObjectId, ref: "Diamond", required: true },
    quantity: { type: Number, required: true, default: 1 },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "partial"], default: "pending" },
    deliveryStatus: { type: String, enum: ["pending", "shipped", "delivered"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
