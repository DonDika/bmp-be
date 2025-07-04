import express from "express";
import {
  createLocation,
  deleteLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
} from "../controllers/location.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.get("/all", authenticate, authorize("admin"), getAllLocations);
router.get("/:id", authenticate, authorize("admin"), getLocationById);
router.post("/", authenticate, authorize("admin"), createLocation);
router.put("/:id", authenticate, authorize("admin"), updateLocation);
router.delete("/:id", authenticate, authorize("admin"), deleteLocation);

export default router;
