import { Router } from "express";
import {
  getAssets,
  getAssetById,
  getAssetStats,
  createAsset,
  updateAsset,
  deleteAsset,
  uploadPhoto,
  getQrCode,
} from "../controllers/assetController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/uploadMiddleware";

const router = Router();

// Publik (Guest & Admin)
router.get("/", getAssets);
router.get("/stats", getAssetStats); // harus sebelum /:id
router.get("/:id", getAssetById);
router.get("/:id/qrcode", getQrCode);

// Admin only
router.post("/", authMiddleware, createAsset);
router.put("/:id", authMiddleware, updateAsset);
router.delete("/:id", authMiddleware, deleteAsset);
router.post("/:id/photo", authMiddleware, upload.single("photo"), uploadPhoto);

export default router;
