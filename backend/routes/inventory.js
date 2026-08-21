const express = require("express");
const QRCode = require("qrcode");
const ExcelJS = require("exceljs");
const streamifier = require("streamifier");
const Diamond = require("../models/Diamond");
const Activity = require("../models/Activity");
const { protect, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// Helper — upload an image buffer to Cloudinary and return the result
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "diamonds", resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// Public — used by the customer-facing Shop page. No auth, and only
// in-stock diamonds are shown (no need to expose zero-stock listings).
router.get("/public", async (req, res) => {
  try {
    const diamonds = await Diamond.find({ stockQuantity: { $gt: 0 } }).sort({ createdAt: -1 });
    res.json(diamonds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

    await Activity.create({
      type: "diamond_added",
      message: `New diamond added — ${diamond.carat}ct ${diamond.cut} ${diamond.color} (Stock: ${diamond.stockQuantity})`,
    });

    res.status(201).json(diamond);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bulk import diamonds from an Excel file (Admin only)
// Column A (optional): embedded diamond photo
// Other columns: carat, cut, color, clarity, shape, certification, price, stockQuantity
router.post("/bulk-import", protect, adminOnly, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];

    // Expected column headers — must match the header row of the uploaded sheet
    const expectedHeaders = [
      "carat", "cut", "color", "clarity", "shape",
      "certification", "price", "stockQuantity",
    ];

    // Read header row and map column index -> field name
    const headerRow = worksheet.getRow(1);
    const columnMap = {};
    headerRow.eachCell((cell, colNumber) => {
      const header = String(cell.value).trim().toLowerCase();
      const match = expectedHeaders.find((h) => h.toLowerCase() === header);
      if (match) columnMap[colNumber] = match;
    });

    if (Object.keys(columnMap).length === 0) {
      return res.status(400).json({
        message: `No matching columns found. Expected headers: ${expectedHeaders.join(", ")}`,
      });
    }

    // Map row number -> embedded image buffer (if any image was placed in that row)
    const media = workbook.model.media || [];
    const imageMap = {};
    worksheet.getImages().forEach((img) => {
      const rowNumber = Math.round(img.range.tl.row) + 1;
      const mediaItem = media[img.imageId];
      if (mediaItem && mediaItem.buffer) {
        imageMap[rowNumber] = mediaItem;
      }
    });

    const created = [];
    const skipped = [];
    const errors = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (row.cellCount === 0) continue;

      const data = {};
      Object.entries(columnMap).forEach(([colNumber, field]) => {
        const cellValue = row.getCell(Number(colNumber)).value;
        data[field] = cellValue;
      });

      // Skip fully blank rows (no data in any mapped column)
      const hasAnyData = Object.values(data).some((v) => v !== undefined && v !== null && v !== "");
      if (!hasAnyData) continue;

      try {
        const requiredFields = ["carat", "cut", "color", "clarity", "shape", "price"];
        const missing = requiredFields.filter(
          (f) => data[f] === undefined || data[f] === null || data[f] === ""
        );
        if (missing.length > 0) {
          errors.push({ row: rowNumber, message: `Missing: ${missing.join(", ")}` });
          continue;
        }

        const caratNum = Number(data.carat);
        const priceNum = Number(data.price);

        if (Number.isNaN(caratNum) || Number.isNaN(priceNum)) {
          errors.push({ row: rowNumber, message: "carat/price must be numeric" });
          continue;
        }

        const cutVal = String(data.cut).trim();
        const colorVal = String(data.color).trim();
        const clarityVal = String(data.clarity).trim();
        const shapeVal = String(data.shape).trim();

        // Duplicate check — same stone already exists, skip instead of creating a copy
        const duplicate = await Diamond.findOne({
          carat: caratNum,
          cut: cutVal,
          color: colorVal,
          clarity: clarityVal,
          shape: shapeVal,
          price: priceNum,
        });

        if (duplicate) {
          skipped.push({ row: rowNumber, message: "Duplicate — already exists in inventory" });
          continue;
        }

        // Upload the row's embedded image (if any) to Cloudinary
        let images = [];
        const mediaItem = imageMap[rowNumber];
        if (mediaItem) {
          try {
            const uploadResult = await uploadBufferToCloudinary(mediaItem.buffer);
            images = [uploadResult.secure_url];
          } catch (imgErr) {
            // Don't fail the whole row just because the image upload failed
            errors.push({ row: rowNumber, message: `Diamond saved, but image upload failed: ${imgErr.message}` });
          }
        }

        const diamond = await Diamond.create({
          carat: caratNum,
          cut: cutVal,
          color: colorVal,
          clarity: clarityVal,
          shape: shapeVal,
          certification: data.certification ? String(data.certification).trim() : undefined,
          price: priceNum,
          stockQuantity: data.stockQuantity !== undefined ? Number(data.stockQuantity) : 1,
          images,
        });

        created.push(diamond);
      } catch (rowErr) {
        errors.push({ row: rowNumber, message: rowErr.message });
      }
    }

    if (created.length > 0) {
      await Activity.create({
        type: "diamond_added",
        message: `Bulk import — ${created.length} diamond(s) added${
          skipped.length ? `, ${skipped.length} duplicate(s) skipped` : ""
        }${errors.length ? `, ${errors.length} row(s) had issues` : ""}`,
      });
    }

    res.status(201).json({
      importedCount: created.length,
      skippedCount: skipped.length,
      failedCount: errors.length,
      skipped,
      errors,
    });
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

// Get QR code for a diamond
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