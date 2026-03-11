import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: string; username: string; role: string };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token tidak ditemukan. Silakan login." });
    return;
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ message: "Konfigurasi server error." });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      id: string;
      username: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Token tidak valid atau sudah kadaluarsa." });
  }
}
