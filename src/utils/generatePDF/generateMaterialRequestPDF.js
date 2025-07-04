import PDFDocument from "pdfkit";

export const generateMaterialRequestPDF = (data, stream) => {
  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
  });

  doc.pipe(stream);
  doc.lineWidth(0.5);
  doc.strokeColor("#000");

  // ======= HEADER =======
  let currentY = 80;
  doc.fontSize(16).font("Helvetica-Bold");
  doc.text("MATERIALS PURCHASE REQUISITION", 50, currentY, {
    align: "center",
    width: 495,
  });

  currentY += 60;
  const fieldHeight = 35;
  const halfWidth = 260;

  // ======= HEADER FORM =======
  const drawField = (label, value, x, y, width) => {
    doc.rect(x, y, width, fieldHeight).stroke();
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(label, x + 5, y + 5);
    doc
      .fontSize(9)
      .font("Helvetica")
      .text(value, x + 5, y + 20);
  };

  drawField("MPR No :", data.no_mr || "", 40, currentY, halfWidth);
  drawField(
    "Location :",
    data.location?.name || "",
    40 + halfWidth,
    currentY,
    halfWidth
  );
  currentY += fieldHeight;
  drawField("User Created :", data.user?.email || "", 40, currentY, halfWidth);
  drawField(
    "Date :",
    new Date(data.created_at).toLocaleDateString("id-ID"),
    40 + halfWidth,
    currentY,
    halfWidth
  );
  currentY += fieldHeight + 30;

  // ======= TABLE HEADER =======
  const tableWidth = 520;
  const headerHeight = 35;
  const rowHeight = 30;

  const colWidths = {
    no: 40,
    item: 145,
    partNo: 145,
    day: 60,
    qty: 60,
    unit: 60,
  };

  doc.rect(40, currentY, tableWidth, headerHeight).stroke();

  let x = 50;
  Object.values(colWidths).forEach((width, i) => {
    if (i < Object.values(colWidths).length - 1) {
      x += width;
      doc
        .moveTo(x, currentY)
        .lineTo(x, currentY + headerHeight)
        .stroke();
    }
  });

  doc.fontSize(10).font("Helvetica-Bold");
  x = 50;
  doc.text("No", x + 15, currentY + 10);
  x += colWidths.no;
  doc.text("Item", x + 45, currentY + 10);
  x += colWidths.item;
  doc.text("Part no", x + 25, currentY + 10);
  x += colWidths.partNo;
  doc.text("Day", x + 20, currentY + 10);
  x += colWidths.day;
  doc.text("Qty", x + 20, currentY + 10);
  x += colWidths.qty;
  doc.text("Unit", x + 18, currentY + 10);

  currentY += headerHeight;

  // ======= TABLE DATA ROWS =======
  const items = data.items || [];

  items.forEach((itemData, index) => {
    const { item, duration, quantity, unit } = itemData;

    doc.rect(40, currentY, tableWidth, rowHeight).stroke();
    x = 50;
    Object.values(colWidths).forEach((width, i) => {
      if (i < Object.values(colWidths).length - 1) {
        x += width;
        doc
          .moveTo(x, currentY)
          .lineTo(x, currentY + rowHeight)
          .stroke();
      }
    });

    x = 50;
    doc.fontSize(9).font("Helvetica");
    doc.text(String(index + 1), x + 15, currentY + 10);
    x += colWidths.no;
    doc.text(item?.name || "", x + 5, currentY + 10);
    x += colWidths.item;
    doc.text(item?.code || "", x + 5, currentY + 10);
    x += colWidths.partNo;
    doc.text(duration?.toString() || "", x + 15, currentY + 10);
    x += colWidths.day;
    doc.text(quantity?.toString() || "", x + 15, currentY + 10);
    x += colWidths.qty;
    doc.text(unit || "", x + 15, currentY + 10);

    currentY += rowHeight;
  });

  currentY += 30;

  // ======= BOTTOM SECTION =======
  drawField(
    "Request Status:",
    "URGENT / REGULAR / EMERGENCY",
    40,
    currentY,
    halfWidth
  );
  drawField(
    "Ultimate Destination :",
    data.location?.name || "",
    40 + halfWidth,
    currentY,
    halfWidth
  );
  currentY += fieldHeight;
  drawField(
    "Delivery Point :",
    data.location?.name || "",
    40,
    currentY,
    halfWidth
  );
  drawField(
    "Mark to the attentionof (name) :",
    data.user?.email || "",
    40 + halfWidth,
    currentY,
    halfWidth
  );
  currentY += fieldHeight;

  // ======= REMARKS =======
  const remarksHeight = 80;
  doc.rect(40, currentY, 520, remarksHeight).stroke();
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("General Remarks / Purpose:", 45, currentY + 10);
  doc
    .fontSize(9)
    .font("Helvetica")
    .text(data.remarks || "", 45, currentY + 30, {
      width: 490,
      height: 40,
    });

  doc.end();
};
