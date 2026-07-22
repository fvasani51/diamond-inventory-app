const express = require("express");
const Order = require("../models/Order");
const Diamond = require("../models/Diamond");
const Customer = require("../models/Customer");
const Activity = require("../models/Activity");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Get all orders
router.get("/", protect, async (req, res) => {
  try {
    const orders = await Order.find().populate("diamond").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create order
router.post("/", protect, async (req, res) => {
  try {
    const { diamond, quantity } = req.body;
    const diamondDoc = await Diamond.findById(diamond);
    if (!diamondDoc) return res.status(404).json({ message: "Diamond not found" });
    if (diamondDoc.stockQuantity < quantity) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    const order = await Order.create(req.body);

    diamondDoc.stockQuantity -= quantity;
    await diamondDoc.save();

    // Auto-save/link customer record (upsert by phone)
    if (req.body.customerName && req.body.customerPhone) {
      const existingCustomer = await Customer.findOne({ phone: req.body.customerPhone });
      if (!existingCustomer) {
        await Customer.create({ name: req.body.customerName, phone: req.body.customerPhone });
      }
    }

    await Activity.create({
      type: "order_created",
      message: `New order from ${order.customerName} — ${diamondDoc.carat}ct ${diamondDoc.cut} (₹${order.totalAmount.toLocaleString("en-IN")})`,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order status
router.put("/:id", protect, async (req, res) => {
  try {
    const previous = await Order.findById(req.params.id);
    if (!previous) return res.status(404).json({ message: "Order not found" });

    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (req.body.paymentStatus && req.body.paymentStatus !== previous.paymentStatus) {
      await Activity.create({
        type: "payment_updated",
        message: `Payment for ${order.customerName}'s order marked as ${req.body.paymentStatus}`,
      });
    }
    if (req.body.deliveryStatus && req.body.deliveryStatus !== previous.deliveryStatus) {
      await Activity.create({
        type: "delivery_updated",
        message: `Delivery for ${order.customerName}'s order marked as ${req.body.deliveryStatus}`,
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete order (Admin only) - restores diamond stock since the order is being reversed
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const diamondDoc = await Diamond.findById(order.diamond);
    if (diamondDoc) {
      diamondDoc.stockQuantity += order.quantity;
      await diamondDoc.save();
    }

    await Order.findByIdAndDelete(req.params.id);

    await Activity.create({
      type: "order_deleted",
      message: `Order from ${order.customerName} was deleted and stock restored`,
    });

    res.json({ message: "Order deleted and stock restored" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;