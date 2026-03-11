import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    res.status(400).json({ message: "Username dan password wajib diisi." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    res.status(401).json({ message: "Username atau password salah." });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    res.status(401).json({ message: "Username atau password salah." });
    return;
  }

  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    secret,
    { expiresIn } as jwt.SignOptions
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
}
