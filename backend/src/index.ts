import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.routes";
import assetRoutes from "./routes/asset.routes";

const app = express();
const PORT = process.env.PORT ?? 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Static files — foto aset ──────────────────────────────────────────────────
const uploadsDir = path.resolve(process.env.UPLOAD_PATH ?? "./uploads");
app.use("/uploads", express.static(uploadsDir));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "I-Asset SMBR API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan." });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("❌ Unhandled error:", err.message);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
);

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 I-Asset SMBR API berjalan di http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV ?? "development"}`);
  console.log(`📸 Uploads dir: ${uploadsDir}\n`);
});

export default app;
