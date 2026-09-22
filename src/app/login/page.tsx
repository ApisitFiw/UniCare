"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type LoginRole = "user" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (signInError || !data.user) {
      setError(signInError?.message ?? "เข้าสู่ระบบไม่สำเร็จ");
      setLoading(false);
      return;
    }

    const isAdmin = data.user.app_metadata?.role === "admin";

    if (role === "admin" && !isAdmin) {
      await supabase.auth.signOut();
      setError("บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ");
      setLoading(false);
      return;
    }

    const redirect = new URLSearchParams(
      window.location.search
    ).get("redirect");

    const destination = isAdmin
      ? "/admin/dashboard"
      : redirect === "report"
        ? "/report"
        : "/user/dashboard";

    router.replace(destination);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e3f3ea] to-[#f4faf6] px-4 py-8 text-[#0f3028]">
      <div className="w-full max-w-md rounded-3xl border border-[#d4e6dc] bg-white p-7 shadow-lg sm:p-9">
        <Link
          href="/"
          className="text-sm font-medium text-emerald-800 hover:underline"
        >
          ← กลับหน้าหลัก
        </Link>

        <div className="mt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e2f5e8] text-3xl">
            🌿
          </div>
          <h1 className="mt-3 text-2xl font-bold">
            เข้าสู่ระบบ UniCare
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            ระบบแจ้งปัญหาภายในมหาวิทยาลัย
          </p>
        </div>

        <div
          className="mt-7 flex rounded-xl bg-[#edf6f0] p-1"
          aria-label="ประเภทบัญชี"
        >
          {(["user", "admin"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={role === value}
              onClick={() => {
                setRole(value);
                setError("");
              }}
              className={`w-1/2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                role === value
                  ? "bg-white text-emerald-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {value === "user" ? "User" : "Admin"}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          <label className="block text-sm font-medium">
            อีเมล
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
            />
          </label>

          <label className="block text-sm font-medium">
            รหัสผ่าน
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#155a49] px-4 py-3 font-semibold text-white hover:bg-[#0f4437] disabled:opacity-50"
          >
            {loading
              ? "กำลังเข้าสู่ระบบ..."
              : `เข้าสู่ระบบ ${role === "user" ? "User" : "Admin"}`}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/register"
            className="font-semibold text-emerald-800 hover:underline"
          >
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </main>
  );
}