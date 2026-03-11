import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_PATH = process.env.UPLOAD_PATH ?? "./uploads";

// Pastikan folder uploads ada
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `asset-${uniqueSuffix}${ext}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file gambar (JPG, PNG, WEBP) yang diizinkan."));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5 MB
});
