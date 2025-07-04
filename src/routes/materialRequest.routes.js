import express from "express";
import {
  createMaterialRequest,
  deleteMaterialRequest,
  getAllMaterialRequests,
  getMaterialRequestById,
  updateMaterialRequest,
} from "../controllers/materialRequest.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.get("/all", authenticate, authorize("admin"), getAllMaterialRequests);
router.get("/:id", authenticate, authorize("admin"), getMaterialRequestById);
router.post(
  "/",
  authenticate,
  authorize("admin", "user"),
  createMaterialRequest
);
router.put(
  "/:id",
  authenticate,
  authorize("admin", "user"),
  updateMaterialRequest
);
router.delete("/:id", authenticate, authorize("admin"), deleteMaterialRequest);

export default router;
