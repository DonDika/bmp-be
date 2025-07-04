import express from "express";
import {
  createWarehouse,
  deleteWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
} from "../controllers/warehouse.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.get("/all", authenticate, authorize("admin"), getAllWarehouses);
router.get("/:id", authenticate, authorize("admin"), getWarehouseById);
router.post('/', authenticate, authorize('admin'), createWarehouse);
router.put('/:id', authenticate, authorize('admin'), updateWarehouse);
router.delete('/:id', authenticate, authorize('admin'), deleteWarehouse);

export default router;
