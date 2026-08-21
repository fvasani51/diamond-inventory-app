const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Invite = require("../models/Invite");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Register — now requires a valid, unused invite code. Role comes from the invite, not the client.
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ message: "An invite code is required to register" });
    }

    const invite = await Invite.findOne({ code: inviteCode.trim() });
    if (!invite) {
      return res.status(400).json({ message: "Invalid invite code" });
    }
    if (invite.used) {
      return res.status(400).json({ message: "This invite code has already been used" });
    }
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ message: "This invite code has expired" });
    }
    if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({ message: "This invite code is not valid for this email address" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: invite.role });

    invite.used = true;
    invite.usedBy = user._id;
    await invite.save();

    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate an invite code — ADMIN ONLY. Call this from the logged-in admin dashboard.
router.post("/invite", protect, adminOnly, async (req, res) => {
  try {
    const { role, email, expiresInDays } = req.body;
    const code = crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. "A1B2C3D4"
    const days = Number(expiresInDays) || 7;

    const invite = await Invite.create({
      code,
      role: role === "admin" ? "admin" : "staff",
      email: email || null,
      createdBy: req.user.id,
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({ code: invite.code, role: invite.role, expiresAt: invite.expiresAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;