
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");
const Order = require("../../models/Order");

const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Customers can download only their own invoices.
    const order = await Order.findOne({
      _id: orderId,
      userId: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const originalTotal = Number(order.totalAmount || 0);
    const refundAmount = Number(order.refundAmount || 0);
    const netTotal = Math.max(0, originalTotal - refundAmount);

    const formatMoney = (amount) =>
      `Rs. ${Number(amount || 0).toFixed(2)}`;

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
    });

    const filename = `SOLESTYLE-Invoice-${order.orderNumber || order._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(24)
      .fillColor("#b76e79")
      .text("SOLESTYLE");

    doc
      .fontSize(10)
      .fillColor("#555555")
      .text("Order Invoice");

    doc.moveDown();

    doc
      .fontSize(11)
      .fillColor("#222222")
      .text(`Invoice / Order No: ${order.orderNumber || order._id}`);

    doc.text(
      `Order Date: ${
        order.createdAt
          ? new Date(order.createdAt).toLocaleDateString("en-IN")
          : "N/A"
      }`
    );

    doc.text(`Payment Method: ${order.paymentMethod || "N/A"}`);
    doc.text(`Payment Status: ${order.paymentStatus || "N/A"}`);

    doc.moveDown();

    // Shipping details
    doc.fontSize(14).text("Shipping Address");
    doc.moveDown(0.3);

    const address = order.shippingAddress;

    if (address) {
      const addressLines = [
        address.fullName || address.name,
        address.phone,
        address.addressLine1 || address.address,
        address.addressLine2,
        address.city,
        address.state,
        address.pincode || address.postalCode,
        address.country,
      ].filter(Boolean);

      doc.fontSize(10).text(
        addressLines.length
          ? addressLines.join("\n")
          : "Address details unavailable"
      );
    } else {
      doc.fontSize(10).text("Address details unavailable");
    }

    doc.moveDown();

    // Items
    doc.fontSize(14).text("Order Items");
    doc.moveDown(0.5);

    const left = 50;
    const right = 545;

    const drawTableHeader = () => {
      doc
        .fontSize(9)
        .fillColor("#ffffff")
        .rect(left, doc.y, right - left, 22)
        .fill("#b76e79");

      const y = doc.y + 6;

      doc.fillColor("#ffffff");
      doc.text("Product", left + 8, y, { width: 210 });
      doc.text("Qty", left + 220, y, { width: 35 });
      doc.text("Unit Price", left + 265, y, { width: 80 });
      doc.text("Amount", left + 360, y, { width: 125 });

      doc.y += 28;
      doc.fillColor("#222222");
    };

    drawTableHeader();

    for (const item of order.items || []) {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.price || 0);
      const amount = quantity * unitPrice;

      if (doc.y > 720) {
        doc.addPage();
        drawTableHeader();
      }

      const startY = doc.y;

      doc.fontSize(9).fillColor("#222222");

      doc.text(item.productName || "Product", left + 8, startY, {
        width: 200,
      });

      doc.text(String(quantity), left + 220, startY, {
        width: 35,
      });

      doc.text(formatMoney(unitPrice), left + 265, startY, {
        width: 80,
      });

      doc.text(formatMoney(amount), left + 360, startY, {
        width: 125,
      });

      doc.y = Math.max(startY + 18, doc.y + 4);

      doc
        .strokeColor("#eeeeee")
        .moveTo(left, doc.y)
        .lineTo(right, doc.y)
        .stroke();

      doc.moveDown(0.4);
    }

    doc.moveDown();

    // Totals
    const totalsX = 320;
    const totalsWidth = 225;

    doc.fontSize(10).fillColor("#222222");

    doc.text("Subtotal:", totalsX, doc.y, {
      width: 110,
      continued: true,
    });
    doc.text(formatMoney(order.subtotal), {
      width: totalsWidth - 110,
      align: "right",
    });

    doc.text("Discount:", totalsX, doc.y, {
      width: 110,
      continued: true,
    });
    doc.text(`-${formatMoney(order.discount)}`, {
      width: totalsWidth - 110,
      align: "right",
    });

    doc.text("Shipping:", totalsX, doc.y, {
      width: 110,
      continued: true,
    });
    doc.text(formatMoney(order.shippingFee), {
      width: totalsWidth - 110,
      align: "right",
    });

    doc.moveDown(0.5);

    doc
      .fontSize(12)
      .fillColor("#b76e79")
      .text("Original Order Total:", totalsX, doc.y, {
        width: 145,
        continued: true,
      });

    doc.text(formatMoney(originalTotal), {
      width: totalsWidth - 145,
      align: "right",
    });

    if (refundAmount > 0) {
      doc
        .fontSize(10)
        .fillColor("#222222")
        .text("Completed Refunds:", totalsX, doc.y, {
          width: 145,
          continued: true,
        });

      doc.text(`-${formatMoney(refundAmount)}`, {
        width: totalsWidth - 145,
        align: "right",
      });

      doc
        .fontSize(12)
        .fillColor("#b76e79")
        .text("Net Total After Refunds:", totalsX, doc.y, {
          width: 145,
          continued: true,
        });

      doc.text(formatMoney(netTotal), {
        width: totalsWidth - 145,
        align: "right",
      });
    }

    doc.moveDown(2);

    doc
      .fontSize(9)
      .fillColor("#666666")
      .text(
        "This invoice includes the original order amount and any refunds recorded for this order."
      );

    doc.end();
  } catch (error) {
    console.error("Download invoice error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate invoice",
      });
    }

    res.destroy(error);
  }
};

module.exports = { downloadInvoice };
