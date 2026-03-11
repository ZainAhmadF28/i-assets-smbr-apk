import { Request, Response } from "express";
import QRCode from "qrcode";
import prisma from "../lib/prisma";

type Kategori = "BANGUNAN" | "KENDARAAN_DINAS" | "PERLENGKAPAN" | "TANAH";
type Kondisi = "BAIK" | "RUSAK" | "RUSAK_BERAT";

// ── GET /api/assets ─────────────────────────────────────────────────────────
export async function getAssets(req: Request, res: Response): Promise<void> {
  const { search, kategori, kondisi, page = "1", limit = "20" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const whereFilter: {
    OR?: { namaAset?: { contains: string; mode: "insensitive" }; nomorAset?: { contains: string; mode: "insensitive" } }[];
    kategori?: Kategori;
    kondisi?: Kondisi;
  } = {};

  if (search) {
    whereFilter.OR = [
      { namaAset: { contains: search, mode: "insensitive" } },
      { nomorAset: { contains: search, mode: "insensitive" } },
    ];
  }

  if (kategori && ["BANGUNAN", "KENDARAAN_DINAS", "PERLENGKAPAN", "TANAH"].includes(kategori)) {
    whereFilter.kategori = kategori as Kategori;
  }

  if (kondisi && ["BAIK", "RUSAK", "RUSAK_BERAT"].includes(kondisi)) {
    whereFilter.kondisi = kondisi as Kondisi;
  }

  const [data, total] = await Promise.all([
    prisma.asset.findMany({ where: whereFilter, skip, take: limitNum, orderBy: { updatedAt: "desc" } }),
    prisma.asset.count({ where: whereFilter }),
  ]);

  res.json({ data, total, page: pageNum, limit: limitNum });
}

// ── GET /api/assets/:id ──────────────────────────────────────────────────────
export async function getAssetById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const asset = await prisma.asset.findUnique({ where: { id } });

  if (!asset) {
    res.status(404).json({ message: "Aset tidak ditemukan." });
    return;
  }

  res.json(asset);
}

// ── POST /api/assets ─────────────────────────────────────────────────────────
export async function createAsset(req: Request, res: Response): Promise<void> {
  const {
    nomorAset, namaAset, kategori, quantity, satuanUnit,
    latitude, longitude, kondisi, report,
  } = req.body as Record<string, string | number | null>;

  if (!nomorAset || !namaAset || !kategori) {
    res.status(400).json({ message: "nomorAset, namaAset, dan kategori wajib diisi." });
    return;
  }

  const existing = await prisma.asset.findUnique({ where: { nomorAset: String(nomorAset) } });
  if (existing) {
    res.status(409).json({ message: "Nomor aset sudah digunakan." });
    return;
  }

  const asset = await prisma.asset.create({
    data: {
      nomorAset: String(nomorAset),
      namaAset: String(namaAset),
      kategori: kategori as "BANGUNAN" | "KENDARAAN_DINAS" | "PERLENGKAPAN" | "TANAH",
      quantity: quantity ? Number(quantity) : 1,
      satuanUnit: satuanUnit ? String(satuanUnit) : "Unit",
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      kondisi: (kondisi as "BAIK" | "RUSAK" | "RUSAK_BERAT") ?? "BAIK",
      report: report ? String(report) : null,
    },
  });

  res.status(201).json(asset);
}

// ── PUT /api/assets/:id ───────────────────────────────────────────────────────
export async function updateAsset(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const {
    nomorAset, namaAset, kategori, quantity, satuanUnit,
    latitude, longitude, kondisi, report,
  } = req.body as Record<string, string | number | null | undefined>;

  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Aset tidak ditemukan." });
    return;
  }

  // Cek duplikat nomorAset jika diubah
  if (nomorAset && nomorAset !== existing.nomorAset) {
    const conflict = await prisma.asset.findUnique({ where: { nomorAset: String(nomorAset) } });
    if (conflict) {
      res.status(409).json({ message: "Nomor aset sudah digunakan oleh aset lain." });
      return;
    }
  }

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      ...(nomorAset != null && { nomorAset: String(nomorAset) }),
      ...(namaAset != null && { namaAset: String(namaAset) }),
      ...(kategori != null && { kategori: kategori as "BANGUNAN" | "KENDARAAN_DINAS" | "PERLENGKAPAN" | "TANAH" }),
      ...(quantity != null && { quantity: Number(quantity) }),
      ...(satuanUnit != null && { satuanUnit: String(satuanUnit) }),
      latitude: latitude !== undefined ? (latitude != null ? Number(latitude) : null) : undefined,
      longitude: longitude !== undefined ? (longitude != null ? Number(longitude) : null) : undefined,
      ...(kondisi != null && { kondisi: kondisi as "BAIK" | "RUSAK" | "RUSAK_BERAT" }),
      report: report !== undefined ? (report != null ? String(report) : null) : undefined,
    },
  });

  res.json(asset);
}

// ── DELETE /api/assets/:id ────────────────────────────────────────────────────
export async function deleteAsset(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Aset tidak ditemukan." });
    return;
  }

  await prisma.asset.delete({ where: { id } });
  res.status(204).send();
}

// ── POST /api/assets/:id/photo ────────────────────────────────────────────────
export async function uploadPhoto(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Aset tidak ditemukan." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: "File foto wajib disertakan." });
    return;
  }

  // Path yang disimpan di DB — relatif dari server (di-serve sebagai static)
  const gambar = `/uploads/${req.file.filename}`;

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      gambar,
      fotoTimestamp: new Date(),
    },
  });

  res.json(asset);
}

// ── GET /api/assets/:id/qrcode ────────────────────────────────────────────────
export async function getQrCode(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.asset.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    res.status(404).json({ message: "Aset tidak ditemukan." });
    return;
  }

  // QR Code berisi plain asset ID
  const qrDataUrl = await QRCode.toDataURL(String(id), {
    width: 400,
    margin: 2,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });

  // Kirim sebagai PNG image
  const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  res.set("Content-Type", "image/png");
  res.set("Cache-Control", "public, max-age=86400"); // cache 1 hari
  res.send(buffer);
}
