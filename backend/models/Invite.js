const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
    email: { type: String, default: null }, // optional: restrict invite to a specific email
    used: { type: Boolean, default: false },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invite", inviteSchema);