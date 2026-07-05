const express = require("express");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Get all customers (with optional search by name/phone)
router.get("/", protect, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }
    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single customer + their order history
router.get("/:id", protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const orders = await Order.find({ customerPhone: customer.phone })
      .populate("diamond")
      .sort({ createdAt: -1 });

    res.json({ customer, orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add customer
router.post("/", protect, async (req, res) => {
  try {
    const existing = await Customer.findOne({ phone: req.body.phone });
    if (existing) return res.status(400).json({ message: "Customer with this phone already exists" });

    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update customer
router.put("/:id", protect, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete customer (Admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
