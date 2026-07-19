const express = require("express");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const Diamond = require("../models/Diamond");
const Order = require("../models/Order");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", protect, async (req, res) => {
  try {
    const diamonds = await Diamond.find();
    const orders = await Order.find();

    const totalStockValue = diamonds.reduce((sum, d) => sum + d.price * d.stockQuantity, 0);
    const totalDiamonds = diamonds.reduce((sum, d) => sum + d.stockQuantity, 0);
    const pendingOrders = orders.filter((o) => o.deliveryStatus !== "delivered").length;
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const paidAmount = orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      totalStockValue,
      totalDiamonds,
      totalOrders: orders.length,
      pendingOrders,
      totalSales,
      paidAmount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- AI Business Insights (Google Gemini) ----------
// Simple in-memory cache so we don't call the AI API on every dashboard
// load. Resets when the serverless function cold-starts, which is fine
// for a "refresh every few minutes" feel.
let insightsCache = { text: null, generatedAt: null };
const INSIGHTS_CACHE_MS = 10 * 60 * 1000; // 10 minutes

router.get("/ai-insights", protect, async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const cacheAge = insightsCache.generatedAt ? Date.now() - insightsCache.generatedAt : Infinity;

    if (!forceRefresh && insightsCache.text && cacheAge < INSIGHTS_CACHE_MS) {
      return res.json({ insight: insightsCache.text, generatedAt: insightsCache.generatedAt, cached: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "AI insights are not configured (missing GEMINI_API_KEY)." });
    }

    const diamonds = await Diamond.find();
    const orders = await Order.find();

    const totalStockValue = diamonds.reduce((sum, d) => sum + d.price * d.stockQuantity, 0);
    const totalDiamonds = diamonds.reduce((sum, d) => sum + d.stockQuantity, 0);
    const lowStock = diamonds.filter((d) => d.stockQuantity <= 2);
    const pendingOrders = orders.filter((o) => o.deliveryStatus !== "delivered");
    const unpaidOrders = orders.filter((o) => o.paymentStatus !== "paid");
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    const dataSummary = `
Business: Paladiya Brothers, diamond manufacturer & B2B supplier.

Current snapshot:
- Total stock value: ₹${totalStockValue.toLocaleString()}
- Total diamonds in stock: ${totalDiamonds} (across ${diamonds.length} distinct listings)
- Low-stock listings (2 or fewer units): ${lowStock.length}${lowStock.length ? " — " + lowStock.map((d) => `${d.carat}ct ${d.cut} ${d.color}`).slice(0, 5).join(", ") : ""}
- Total orders: ${orders.length}
- Pending (not yet delivered) orders: ${pendingOrders.length}
- Unpaid orders: ${unpaidOrders.length}
- Total sales value: ₹${totalSales.toLocaleString()}
`.trim();

    const prompt = `You are a business analyst for a diamond trading company. Based on the data below, write a short, plain-language business insight for the owner — 2 to 3 sentences, friendly but direct. Point out one positive and one thing that needs attention if relevant. Do not use markdown formatting, headers, or bullet points — plain sentences only.

${dataSummary}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return res.status(502).json({ message: "AI insight generation failed." });
    }

    const data = await response.json();
    const insight =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "No insight could be generated right now.";

    insightsCache = { text: insight, generatedAt: Date.now() };
    res.json({ insight, generatedAt: insightsCache.generatedAt, cached: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Export inventory + business summary as a PDF report (Admin only)
router.get("/export/pdf", protect, adminOnly, async (req, res) => {
  try {
    const diamonds = await Diamond.find();
    const orders = await Order.find();
    const totalStockValue = diamonds.reduce((sum, d) => sum + d.price * d.stockQuantity, 0);
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=diamond-business-report.pdf");

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text("Paladiya Brothers — Business Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).fillColor("gray").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1.5);

    doc.fillColor("black").fontSize(13).text("Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Total Stock Value: Rs. ${totalStockValue}`);
    doc.text(`Total Diamonds in Stock: ${diamonds.reduce((s, d) => s + d.stockQuantity, 0)}`);
    doc.text(`Total Orders: ${orders.length}`);
    doc.text(`Total Sales: Rs. ${totalSales}`);
    doc.moveDown(1);

    doc.fontSize(13).text("Inventory", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(9);
    diamonds.forEach((d) => {
      doc.text(
        `${d.carat}ct | ${d.cut} | ${d.color} | ${d.clarity} | ${d.shape} | Rs.${d.price} | Stock: ${d.stockQuantity}`
      );
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Export inventory as an Excel spreadsheet (Admin only)
router.get("/export/excel", protect, adminOnly, async (req, res) => {
  try {
    const diamonds = await Diamond.find();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Inventory");

    sheet.columns = [
      { header: "Carat", key: "carat", width: 10 },
      { header: "Cut", key: "cut", width: 15 },
      { header: "Color", key: "color", width: 10 },
      { header: "Clarity", key: "clarity", width: 12 },
      { header: "Shape", key: "shape", width: 15 },
      { header: "Certification", key: "certification", width: 15 },
      { header: "Price (₹)", key: "price", width: 12 },
      { header: "Stock Qty", key: "stockQuantity", width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };

    diamonds.forEach((d) => sheet.addRow(d));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=diamond-inventory.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;