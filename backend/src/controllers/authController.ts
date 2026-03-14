import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ message: "Email dan password wajib diisi." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(401).json({ message: "Email atau password salah." });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    res.status(401).json({ message: "Email atau password salah." });
    return;
  }

  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn } as jwt.SignOptions
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
}