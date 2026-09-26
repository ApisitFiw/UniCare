"use client";

import {
  Suspense,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { resetPasswordUnified } from "@/lib/authService";
import UniCareLogo from "@/components/UniCareLogo";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);
  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Check query param for email
    const queryEmail = searchParams.get("email");
    if (queryEmail) {
      setEmail(queryEmail);
    }

    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        if (session?.user?.email) {
          setEmail(session.user.email);
        }
        setIsReady(true);
      }
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "PASSWORD_RECOVERY" ||
          (event === "SIGNED_IN" && session)
        ) {
          if (session?.user?.email) {
            setEmail(session.user.email);
          }
          setIsReady(true);
          setError("");
        }
      },
    );

    const timeout = window.setTimeout(() => {
      if (mounted) {
        setIsReady(true);
      }
    }, 800);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [searchParams]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("กรุณากรอกอีเมลของบัญชีผู้ใช้");
      return;
    }

    if (password.length < 8) {
      setError(
        "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await resetPasswordUnified(cleanEmail, password);

      if (!res.success) {
        setError(res.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาตรวจสอบอีเมล");
        return;
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        router.replace("/login");
      }, 2500);
    } catch {
      setError(
        "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />

          <p className="mt-4 text-sm font-medium text-emerald-800">
            กำลังตรวจสอบลิงก์เปลี่ยนรหัสผ่าน...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-7 shadow-xl sm:p-9">
        <Link
          href="/"
          className="flex w-fit items-center gap-3"
        >
          <UniCareLogo className="h-10 w-10" />

          <div>
            <p className="font-extrabold text-emerald-900">
              UNICARE
            </p>

            <p className="text-[9px] uppercase tracking-wider text-slate-400">
              Walailak University
            </p>
          </div>
        </Link>

        {success ? (
          <div className="py-8 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </span>

            <h1 className="mt-5 text-xl font-extrabold text-slate-800">
              เปลี่ยนรหัสผ่านสำเร็จ
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              ระบบกำลังนำคุณกลับไปยังหน้าเข้าสู่ระบบ
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <KeyRound className="h-6 w-6" />
              </span>

              <h1 className="mt-4 text-2xl font-extrabold text-slate-800">
                ตั้งรหัสผ่านใหม่
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                กรุณากำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-4"
            >
              <label className="block">
                <span className="text-xs font-bold text-slate-700">
                  อีเมลบัญชีผู้ใช้
                </span>

                <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />

                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="example@wu.ac.th"
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-700">
                  รหัสผ่านใหม่
                </span>

                <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    className="text-slate-400 hover:text-emerald-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-700">
                  ยืนยันรหัสผ่านใหม่
                </span>

                <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" />

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) => !current,
                      )
                    }
                    className="text-slate-400 hover:text-emerald-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <KeyRound className="h-4 w-4" />

                {isSubmitting
                  ? "กำลังบันทึก..."
                  : "บันทึกรหัสผ่านใหม่"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-400">
              <Link
                href="/login"
                className="font-bold text-emerald-700 hover:underline"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-4">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
            <p className="mt-4 text-sm font-medium text-emerald-800">
              กำลังโหลด...
            </p>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}