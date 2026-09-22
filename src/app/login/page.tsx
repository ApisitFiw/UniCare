"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInDemo, type DemoRole } from "@/lib/demoAuth";

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState<DemoRole>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const session = signInDemo(email, password, role);

    if (!session) {
      setError("อีเมล รหัสผ่าน หรือประเภทบัญชีไม่ถูกต้อง");
      return;
    }

    router.replace(
      session.role === "admin" ? "/admin/dashboard" : "/user/dashboard",
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <Link href="/" className="text-sm text-emerald-700">
          ← กลับหน้าหลัก
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-emerald-900">
          เข้าสู่ระบบ UniCare
        </h1>

        <div className="mt-6 flex rounded-xl bg-emerald-50 p-1">
          {(["user", "admin"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setRole(value);
                setEmail("");
                setPassword("");
                setError("");
              }}
              className={`w-1/2 rounded-lg p-2 font-semibold ${
                role === value
                  ? "bg-white text-emerald-900 shadow"
                  : "text-slate-500"
              }`}
            >
              {value === "user" ? "User" : "Admin"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            อีเมล
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            />
          </label>

          <label className="block text-sm font-medium">
            รหัสผ่าน
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-800 p-3 font-semibold text-white"
          >
            เข้าสู่ระบบ {role === "user" ? "User" : "Admin"}
          </button>
        </form>

        <div className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          {role === "user" ? (
            <>
              <p>อีเมล: user@unicare.local</p>
              <p>รหัสผ่าน: User1234!</p>
            </>
          ) : (
            <>
              <p>อีเมล: admin@unicare.local</p>
              <p>รหัสผ่าน: Admin1234!</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}