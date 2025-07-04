import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import { getAllIncomingGoodReceipts, getIncomingGoodReceiptById, deleteIncomingGoodReceipt, updateIGRItemStatus } from "../controllers/incomingGoodReceipt.controller.js";

const router = express.Router();

router.get("/all", authenticate, authorize("admin"), getAllIncomingGoodReceipts);
router.get("/:id", authenticate, authorize("admin"), getIncomingGoodReceiptById);
router.patch("/:id/status", authenticate, authorize("admin"), updateIGRItemStatus);
router.delete("/:id", authenticate, authorize("admin"), deleteIncomingGoodReceipt);


export default router;
