import express from "express";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import itemRoutes from "./src/routes/item.routes.js";
import warehouseRoutes from "./src/routes/warehouse.route.js";
import shelfRoutes from "./src/routes/shelf.routes.js";
import locationRoutes from "./src/routes/location.routes.js";
import materialRequestRoutes from "./src/routes/materialRequest.routes.js";
import purchaseOrderRoutes from "./src/routes/purchaseOrder.routes.js";
import incomingGoodReceiptRoutes from "./src/routes/incomingGoodReceipt.routes.js";
import deliveryOrderRoutes from "./src/routes/deliveryOrder.routes.js";
import pdfRoutes from "./src/routes/pdf.routes.js";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors({
  origin: "*",
  credentials: true
}));
const prisma = new PrismaClient();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/warehouse", warehouseRoutes);
app.use("/api/shelf", shelfRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/material-request", materialRequestRoutes);
app.use("/api/purchase-order", purchaseOrderRoutes);
app.use("/api/incoming-good-receipt", incomingGoodReceiptRoutes);
app.use("/api/delivery-order", deliveryOrderRoutes);
app.use("/api/download-pdf", pdfRoutes);

// test api
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API aktif dan berjalan dengan baik 🚀",
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
