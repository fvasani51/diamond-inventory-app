const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Diamond = require("../models/Diamond");
const Order = require("../models/Order");
const Activity = require("../models/Activity");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/create-order", async (req, res) => {
  try {
    const { diamondId, quantity } = req.body;
    const qty = Number(quantity) || 1;

    const diamond = await Diamond.findById(diamondId);
    if (!diamond) return res.status(404).json({ message: "Diamond not found" });
    if (diamond.stockQuantity < qty) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    const amountInPaise = Math.round(diamond.price * qty * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `diamond_${diamond._id}_${Date.now()}`,
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      diamondId,
      quantity,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      gstNumber,
    } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const qty = Number(quantity) || 1;
    const diamond = await Diamond.findById(diamondId);
    if (!diamond) return res.status(404).json({ message: "Diamond not found" });
    if (diamond.stockQuantity < qty) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    const totalAmount = diamond.price * qty;

    const order = await Order.create({
      customerName,
      customerEmail,
      customerPhone,
      diamond: diamond._id,
      quantity: qty,
      totalAmount,
      paymentStatus: "paid",
      deliveryStatus: "pending",
      source: "online",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      shippingAddress,
      gstNumber,
    });

    diamond.stockQuantity -= qty;
    await diamond.save();

    await Activity.create({
      type: "order_created",
      message: `Online payment received from ${customerName} — ${diamond.carat}ct ${diamond.cut} (₹${totalAmount.toLocaleString("en-IN")})`,
    });

    res.status(201).json({ message: "Payment verified, order placed", orderId: order._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;