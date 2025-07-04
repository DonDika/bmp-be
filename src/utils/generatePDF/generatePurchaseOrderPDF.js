import PDFDocument from "pdfkit";

export const generatePurchaseOrderPDF = (data, stream) => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(stream);

  const fieldHeight = 30;
  const halfWidth = 260;
  const fullWidth = 520;

  let currentY = 50;

  // ======= TITLE =======
  doc.fontSize(16).font("Helvetica-Bold");
  doc.text("PURCHASE ORDER", { align: "center" });

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

  drawField(50, currentY, halfWidth, fieldHeight, "PO No", data.no_po);
  drawField(
    310,
    currentY,
    halfWidth,
    fieldHeight,
    "Location MPR",
    data.material_requests?.[0]?.location?.name || "-"
  );

  currentY += fieldHeight;

  drawField(
    50,
    currentY,
    halfWidth,
    fieldHeight,
    "MPR No",
    data.material_requests?.[0]?.no_mr || ""
  );
  drawField(
    310,
    currentY,
    halfWidth,
    fieldHeight,
    "Date",
    new Date(data.created_at).toLocaleDateString("id-ID")
  );
  currentY += fieldHeight;

  drawField(
    50,
    currentY,
    fullWidth,
    fieldHeight,
    "User Created",
    data.user?.email || ""
  );
  currentY += fieldHeight + 20;

  // ======= TABLE HEADER =======
  const colWidths = {
    no: 40,
    item: 100,
    part_no: 100,
    supplier: 100,
    qty: 50,
    price: 60,
    total: 70,
  };

  const tableX = 50;
  const headerHeight = 25;
  const rowHeight = 25;

  const drawRow = (y, values, isHeader = false) => {
    let x = tableX;
    Object.keys(colWidths).forEach((key) => {
      const width = colWidths[key];
      doc.rect(x, y, width, rowHeight).stroke();
      doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(9);
      const text = values[key] || "-";
      doc.text(text, x + 5, y + 7, { width: width - 10 });
      x += width;
    });
  };

  // Header row
  drawRow(
    currentY,
    {
      no: "No",
      item: "Item",
      part_no: "Part no",
      supplier: "Supplier",
      qty: "Qty",
      price: "Price",
      total: "Total",
    },
    true
  );

  currentY += headerHeight;

  // Rows
  let grandTotal = 0;
  data.items?.forEach((item, index) => {
    const total = (item.quantity || 0) * (item.price || 0);
    grandTotal += total;

    drawRow(currentY, {
      no: String(index + 1),
      item: item.item?.name || "-",
      part_no: item.item?.code || "-",
      supplier: item.supplier || "-",
      qty: String(item.quantity || 0),
      price: `Rp ${item.price?.toLocaleString("id-ID") || "0"}`,
      total: `Rp ${total.toLocaleString("id-ID")}`,
    });

    currentY += rowHeight;
  });

  // Grand Total row
  doc
    .rect(
      tableX,
      currentY,
      Object.values(colWidths).reduce((a, b) => a + b),
      rowHeight
    )
    .stroke();
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Grand total :", tableX + 5, currentY + 7, { continued: true });
  doc.text(
    `Rp ${grandTotal.toLocaleString("id-ID")}`,
    tableX + 400,
    currentY + 7
  );

  currentY += rowHeight + 30;

  // ======= APPROVALS SECTION =======
  const approvalWidth = (fullWidth - 30) / 4; // spacing 10 between each
  const approvalStartX = tableX;

  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Approvals:", approvalStartX, currentY);
  currentY += 20;

  for (let i = 0; i < 4; i++) {
    const approval = data.approvals?.[i];
    const x = approvalStartX + i * (approvalWidth + 10);
    doc.rect(x, currentY, approvalWidth, 60).stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(`Approval ${i + 1}`, x + 5, currentY + 5);

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(approval?.email || "(kosong)", x + 5, currentY + 20);
  }

  doc.end();
};
