import express from "express";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  getUserClaim,
  updateUser,
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.get("/claim", authenticate, getUserClaim);
router.get("/all", authenticate, authorize("admin"), getAllUsers);
router.get("/:id", authenticate, authorize("admin"), getUserById);
router.post("/", authenticate, authorize("admin"), createUser);
router.put("/:id", authenticate, authorize("admin"), updateUser);
router.delete("/:id", authenticate, authorize("admin"), deleteUser);

export default router;
