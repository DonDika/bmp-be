import PDFDocument from "pdfkit";

export const generateDeliveryOrderPDF = (data, stream) => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  doc.pipe(stream);
  doc.lineWidth(0.5);
  doc.strokeColor("#000");

  // ======= HEADER =======
  let currentY = 80;
  doc.fontSize(16).font("Helvetica-Bold");
  doc.text("DELIVERY ORDER", 50, currentY, {
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
};
