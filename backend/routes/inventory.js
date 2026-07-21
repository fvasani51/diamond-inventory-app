const express = require("express");
const QRCode = require("qrcode");
const Diamond = require("../models/Diamond");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Get all diamonds (with optional search)
router.get("/", protect, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { cut: { $regex: search, $options: "i" } },
          { color: { $regex: search, $options: "i" } },
          { shape: { $regex: search, $options: "i" } },
          { clarity: { $regex: search, $options: "i" } },
        ],
      };
    }
    const diamonds = await Diamond.find(query).sort({ createdAt: -1 });
    res.json(diamonds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get low-stock diamonds (default threshold = 3)
// Place this BEFORE "/:id" routes so "low-stock" isn't mistaken for an id.
router.get("/low-stock", protect, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 3;
    const lowStockItems = await Diamond.find({
      stockQuantity: { $lte: threshold },
    }).sort({ stockQuantity: 1 });

    res.json({
      count: lowStockItems.length,
      threshold,
      items: lowStockItems,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add diamond
router.post("/", protect, async (req, res) => {
  try {
    const diamond = await Diamond.create(req.body);
    res.status(201).json(diamond);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update diamond
router.put("/:id", protect, async (req, res) => {
  try {
    const diamond = await Diamond.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!diamond) return res.status(404).json({ message: "Diamond not found" });
    res.json(diamond);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete diamond (Admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const diamond = await Diamond.findByIdAndDelete(req.params.id);
    if (!diamond) return res.status(404).json({ message: "Diamond not found" });
    res.json({ message: "Diamond deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get QR code for a diamond (returns base64 PNG data URL)
// The QR encodes the diamond's key details as JSON so staff can scan
// and instantly see carat/cut/color/clarity/price without opening the app.
router.get("/:id/qrcode", protect, async (req, res) => {
  try {
    const diamond = await Diamond.findById(req.params.id);
    if (!diamond) return res.status(404).json({ message: "Diamond not found" });

    const payload = JSON.stringify({
      id: diamond._id,
      carat: diamond.carat,
      cut: diamond.cut,
      color: diamond.color,
      clarity: diamond.clarity,
      shape: diamond.shape,
      certification: diamond.certification || "",
      price: diamond.price,
    });

    const qrDataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 1 });
    res.json({ qrDataUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;