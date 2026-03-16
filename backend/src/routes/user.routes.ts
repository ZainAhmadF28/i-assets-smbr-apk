import { Router } from "express";
import { getUsers } from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Admin only
router.get("/", authMiddleware, getUsers);

export default router;
