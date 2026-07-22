const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["order_created", "payment_updated", "delivery_updated", "diamond_added", "order_deleted"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);