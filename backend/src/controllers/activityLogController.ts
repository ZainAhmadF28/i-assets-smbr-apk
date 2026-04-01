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
    assetName: log.asset?.namaAset ?? log.namaAset ?? "Aset Dihapus",
    assetNomor: log.asset?.nomorAset ?? log.nomorAset ?? "-",
    details: log.catatan,
    createdAt: log.createdAt,
  }));

  res.json({ data, total, page: pageNum, limit: limitNum });
}

// ── GET /api/activity-logs/new?since=ISO_DATE ───────────────────────────────
export async function getNewLogsCount(req: Request, res: Response): Promise<void> {
  const { since } = req.query as Record<string, string>;

  if (!since) {
    res.status(400).json({ error: "Missing 'since' query parameter" });
    return;
  }

  const sinceDate = new Date(since);

  const [count, latest] = await Promise.all([
    prisma.assetLog.count({
      where: { createdAt: { gt: sinceDate } },
    }),
    prisma.assetLog.findMany({
      where: { createdAt: { gt: sinceDate } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        asset: {
          select: { namaAset: true, nomorAset: true },
        },
      },
    }),
  ]);

  const data = latest.map((log) => ({
    id: log.id,
    action: log.action,
    assetName: log.asset?.namaAset ?? log.namaAset ?? "Aset Dihapus",
    assetNomor: log.asset?.nomorAset ?? log.nomorAset ?? "-",
    details: log.catatan,
    createdAt: log.createdAt,
  }));

  res.json({ count, latest: data });
}
