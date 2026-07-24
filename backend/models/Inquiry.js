const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    companyName: { type: String, required: true },
    phone: { type: String, required: true },
    shapes: [{ type: String }],
    pieces: { type: Number },
    orderType: { type: String, enum: ["Certified", "Loose"], default: "Certified" },
    caratFrom: { type: Number },
    caratTo: { type: Number },
    colors: [{ type: String }],
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inquiry", inquirySchema);