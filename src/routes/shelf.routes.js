import express from "express";
import { createShelf, deleteShelf, getAllShelves, getShelvesByWarehouseId, updateShelf } from "../controllers/shelf.controller.js";
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getAllShelves);
router.get("/warehouse/:warehouse_id", authenticate, authorize("admin"), getShelvesByWarehouseId);
router.post("/", authenticate, authorize("admin"), createShelf);
router.put("/:id", authenticate, authorize("admin"), updateShelf);
router.delete("/:id", authenticate, authorize("admin"), deleteShelf);

export default router;