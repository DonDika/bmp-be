// routes/pdfRoutes.js
import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  downloadIncomingGoodReceiptPDF,
  downloadMaterialRequestPDF,
  downloadPurchaseOrderPDF,
} from "../controllers/pdfController.js";

const router = express.Router();

router.get(
  "/material-request/:id",
  authenticate,
  authorize("admin"),
  downloadMaterialRequestPDF
);
router.get(
  "/purchase-order/:id",
  authenticate,
  authorize("admin"),
  downloadPurchaseOrderPDF
);
router.get(
  "/incoming-good-receipt/:id",
  authenticate,
  authorize("admin"),
  downloadIncomingGoodReceiptPDF
);

export default router;
