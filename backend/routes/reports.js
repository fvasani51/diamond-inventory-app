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
