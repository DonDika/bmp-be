import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import { approveDeliveryOrder, createDeliveryOrder, getAllDeliveryOrder, getDeliveryOrderApprovals, getDeliveryOrderById } from "../controllers/deliveryOrder.controller.js";

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getAllDeliveryOrder);
router.get("/:id", authenticate, authorize("admin"), getDeliveryOrderById);
router.post("/", authenticate, authorize("admin"), createDeliveryOrder);

router.post("/:id/approve", authenticate, authorize("admin"), approveDeliveryOrder);
router.get("/:id/approval/list", authenticate, authorize("admin"), getDeliveryOrderApprovals);

export default router;