import { Request, Response } from "express";
import prisma from "../lib/prisma";

// ── GET /api/users ────────────────────────────────────────────────────────────
export async function getUsers(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      // password sengaja tidak dikembalikan
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: users, total: users.length });
}
