import express from "express";
import {
  createPurchaseOrder,
  deletePurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  getPurchaseOrdersByUser,
  updatePurchaseOrder,
  approvePurchaseOrder,
  getPurchaseOrderApprovals
} from "../controllers/purchaseOrder.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.get("/all", authenticate, authorize("admin"), getAllPurchaseOrders);
router.get("/:id", authenticate, authorize("admin"), getPurchaseOrderById);
router.get("/:user_id", authenticate, authorize("admin"), getPurchaseOrdersByUser);
router.post("/", authenticate, authorize("admin"), createPurchaseOrder);
router.put("/:id", authenticate, authorize("admin"), updatePurchaseOrder);
router.delete("/:id", authenticate, authorize("admin"), deletePurchaseOrder);

// approval
router.post("/:id/approve", authenticate, authorize("admin"), approvePurchaseOrder );
router.get('/:id/approval/list', authenticate, authorize("admin"), getPurchaseOrderApprovals);
export default router;
