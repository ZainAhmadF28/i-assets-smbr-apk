import { Request, Response } from "express";
import prisma from "../lib/prisma";

// ── GET /api/activity-logs ──────────────────────────────────────────────────
export async function getActivityLogs(req: Request, res: Response): Promise<void> {
  const { page = "1", limit = "20" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      skip,
      take: limitNum,
      orderBy: { createdAt: "desc" },
    }),
    prisma.activityLog.count(),
  ]);

  res.json({ data, total, page: pageNum, limit: limitNum });
}
