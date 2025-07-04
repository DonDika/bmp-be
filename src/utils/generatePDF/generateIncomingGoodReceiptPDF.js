import PDFDocument from "pdfkit";

export const generateIncomingGoodReceiptPDF = (data, stream) => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(stream);

  const fieldHeight = 30;
  const halfWidth = 260;
  const fullWidth = 520;

  let currentY = 50;

  // ======= TITLE =======
  doc.fontSize(16).font("Helvetica-Bold");
  doc.text("INCOMING GOOD RECEIPT", { align: "center" });

  currentY += 40;

  // ======= HEADER FIELDS =======
  const drawField = (x, y, w, h, label, value) => {
    doc.rect(x, y, w, h).stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`${label} :`, x + 5, y + 5);
    doc
      .font("Helvetica")
      .fontSize(9)
      .text(value || "-", x + 5, y + 18);
  };

  drawField(50, currentY, halfWidth, fieldHeight, "IGR No", data.no_igr);
  drawField(310, currentY, halfWidth, fieldHeight, "Location", data.location);

  currentY += fieldHeight;
  drawField(50, currentY, halfWidth, fieldHeight, "PO No", data.no_po);
  drawField(310, currentY, halfWidth, fieldHeight, "Date", data.date);

  currentY += fieldHeight;
  drawField(
    50,
    currentY,
    fullWidth,
    fieldHeight,
    "User Created",
    data.user_created
  );

  currentY += fieldHeight + 20;

  // ======= TABLE HEADER =======
  const colWidths = {
    no: 30,
    item: 100,
    part_no: 100,
    supplier: 90,
    qty: 40,
    location: 80,
    position: 80,
  };

  const tableX = 50;
  const rowHeight = 25;

  const drawRow = (y, values, isHeader = false) => {
    let x = tableX;
    Object.keys(colWidths).forEach((key) => {
      const width = colWidths[key];
      doc.rect(x, y, width, rowHeight).stroke();
      doc
        .font(isHeader ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .text(values[key] || "-", x + 5, y + 7, { width: width - 10 });
      x += width;
    });
  };

  // Draw header row
  drawRow(
    currentY,
    {
      no: "No",
      item: "Item",
      part_no: "Part no",
      supplier: "Supplier",
      qty: "Qty",
      location: "Location",
      position: "Position",
    },
    true
  );

  currentY += rowHeight;

  // Draw item rows
  data.items?.forEach((item) => {
    drawRow(currentY, {
      no: String(item.no),
      item: item.item,
      part_no: item.code,
      supplier: item.supplier,
      qty: String(item.quantity),
      location: item.location,
      position: item.position,
    });
    currentY += rowHeight;
  });

  doc.end();
};
