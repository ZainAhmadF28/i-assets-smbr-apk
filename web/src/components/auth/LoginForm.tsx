"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const GREEN = "#135d3a";

export default function LoginForm() {
  const { login, isLoggedIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/");
    }
  }, [isLoggedIn, router]);

  function validate(): boolean {
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = "Email wajib diisi";
    if (!password) nextErrors.password = "Password wajib diisi";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Email atau password salah";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-white px-5 py-8">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-emerald-950/5"
      >
        <div className="mb-5 text-center">
          <Image
            src="/assets/icon.png"
            alt="I-Asset SMBR"
            width={240}
            height={240}
            className="mx-auto"
            priority
          />
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Login
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Masuk untuk menggunakan aplikasi
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
        <div
          className="mb-2 flex h-12 items-center rounded-xl border bg-slate-50 px-3"
          style={{ borderColor: errors.email ? "#ef4444" : "#e5e7eb" }}
        >
          <Mail className="mr-2 h-4 w-4" color={GREEN} />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="email@example.com"
            className="h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-300"
          />
        </div>
        {errors.email && <p className="mb-3 text-xs text-red-500">{errors.email}</p>}

        <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
        <div
          className="mb-2 flex h-12 items-center rounded-xl border bg-slate-50 px-3"
          style={{ borderColor: errors.password ? "#ef4444" : "#e5e7eb" }}
        >
          <Lock className="mr-2 h-4 w-4" color={GREEN} />
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="••••••••"
            className="h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-300"
          />
          <button
            type="button"
            onClick={() => setShowPw((prev) => !prev)}
            className="text-slate-400"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mb-3 text-xs text-red-500">{errors.password}</p>
        )}

        <div className="mb-5 text-right">
          <span className="cursor-default text-xs font-semibold" style={{ color: GREEN }}>
            Lupa Password?
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          style={{ backgroundColor: GREEN }}
        >
          <LogIn className="h-4 w-4" />
          {loading ? "Memuat..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
