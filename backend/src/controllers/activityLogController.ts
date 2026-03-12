import { Request, Response } from "express";
import prisma from "../lib/prisma";

// ── GET /api/activity-logs ──────────────────────────────────────────────────
export async function getActivityLogs(req: Request, res: Response): Promise<void> {
  const { page = "1", limit = "20" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [raw, total] = await Promise.all([
    prisma.assetLog.findMany({
      skip,
      take: limitNum,
      orderBy: { createdAt: "desc" },
      include: {
        asset: {
          select: { namaAset: true, nomorAset: true },
        },
      },
    }),
    prisma.assetLog.count(),
  ]);

  // Map to the shape the mobile app expects
  const data = raw.map((log) => ({
    id: log.id,
    action: log.action,
    assetId: log.assetId,
    assetName: log.asset?.namaAset ?? "Aset Dihapus",
    assetNomor: log.asset?.nomorAset ?? "-",
    details: log.catatan,
    createdAt: log.createdAt,
  }));

  res.json({ data, total, page: pageNum, limit: limitNum });
}
