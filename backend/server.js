require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const inventoryRoutes = require("./routes/inventory");
const orderRoutes = require("./routes/orders");
const reportRoutes = require("./routes/reports");
const customerRoutes = require("./routes/customers");
const inquiryRoutes = require("./routes/inquiry");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Diamond Inventory API is running"));

app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/inquiry", inquiryRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));