"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  History,
  Leaf,
  LockKeyhole,
  LogIn,
  Mail,
  Megaphone,
  User,
  KeyRound,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react";
import { signInUnified, verifyEmailExists } from "@/lib/authService";
import { supabase } from "@/lib/supabaseClient";
import UniCareLogo from "@/components/UniCareLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [rememberMe, setRememberMe] =
    useState(false);

  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [isResetting, setIsResetting] =
    useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [modalEmail, setModalEmail] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [isModalResetting, setIsModalResetting] = useState(false);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(
      "unicare_remember_email",
    );

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    // Clean up any stale Supabase auth tokens that cause 401 PGRST301 errors
    try {
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed?.expires_at && parsed.expires_at * 1000 < Date.now()) {
                window.localStorage.removeItem(key);
              }
            } catch {
              window.localStorage.removeItem(key);
            }
          }
        }
      }
    } catch {}
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setResetMessage("");
    setIsSubmitting(true);

    try {
      const normalizedEmail = email
        .trim()
        .toLowerCase();

      const result = await signInUnified(
        normalizedEmail,
        password,
      );

      if (!result.success || !result.session) {
        setError(
          result.error ||
            "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        );
        return;
      }

      if (rememberMe) {
        window.localStorage.setItem(
          "unicare_remember_email",
          normalizedEmail,
        );
      } else {
        window.localStorage.removeItem(
          "unicare_remember_email",
        );
      }

      router.replace(
        result.session.role === "admin"
          ? "/admin/dashboard"
          : "/user/dashboard",
      );
    } catch (err: any) {
      console.error("Login submission error:", err);
      setError(
        err?.message ||
          "เกิดข้อผิดพลาดในการตรวจสอบข้อมูลกับ Supabase กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setResetMessage("");

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      setError(
        "กรุณากรอกอีเมลก่อนกดลืมรหัสผ่าน",
      );
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setError(
        "กรุณากรอกเป็นอีเมล ไม่สามารถใช้ชื่อผู้ใช้งานเพื่อรีเซ็ตรหัสผ่านได้",
      );
      return;
    }

    setIsResetting(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo: `${window.location.origin}/reset-password`,
          },
        );

      if (resetError) {
        setError(
          resetError.message ||
            "ไม่สามารถส่งลิงก์เปลี่ยนรหัสผ่านได้",
        );
        return;
      }

      setResetMessage(
        "ส่งลิงก์เปลี่ยนรหัสผ่านแล้ว กรุณาตรวจสอบกล่องข้อความหรือจดหมายขยะในอีเมลของคุณ",
      );
    } catch {
      setError(
        "ไม่สามารถส่งลิงก์เปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setIsResetting(false);
    }
  }

  function openForgotPasswordModal() {
    setModalEmail(email.includes("@") ? email.trim() : "");
    setModalError("");
    setModalSuccess("");
    setShowForgotModal(true);
  }

  async function handleModalSendReset(event: FormEvent) {
    event.preventDefault();
    setModalError("");
    setModalSuccess("");

    const normalized = modalEmail.trim().toLowerCase();
    if (!normalized) {
      setModalError("กรุณากรอกอีเมลที่ลงทะเบียนไว้");
      return;
    }

    if (!normalized.includes("@")) {
      setModalError("กรุณาระบุรูปแบบอีเมลที่ถูกต้อง");
      return;
    }

    setIsModalResetting(true);
    try {
      // 1. ตรวจสอบว่ามีอีเมลนี้อยู่ในระบบ UniCare หรือไม่
      const exists = await verifyEmailExists(normalized);
      if (!exists) {
        setModalError("ไม่พบบัญชีผู้ใช้ที่ใช้อีเมลนี้ในระบบ UniCare กรุณาตรวจสอบอีเมลอีกครั้ง");
        setIsModalResetting(false);
        return;
      }

      // 2. พยายามส่งอีเมลรีเซ็ตผ่าน Supabase Auth
      try {
        await supabase.auth.resetPasswordForEmail(normalized, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
      } catch (authErr) {
        console.warn("Supabase auth reset warning:", authErr);
      }

      setModalSuccess("ระบบยืนยันพบบัญชีของคุณแล้ว ท่านสามารถกดปุ่มตั้งรหัสผ่านใหม่ด้านล่างเพื่อดำเนินการได้ทันที");
    } catch {
      setModalError("เกิดข้อผิดพลาดในการตรวจสอบบัญชี กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsModalResetting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4 sm:p-6 lg:p-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl lg:min-h-[650px] lg:grid-cols-[46%_54%]">
        {/* ฝั่งซ้าย */}
        <section className="relative hidden min-h-[650px] overflow-hidden bg-gradient-to-br from-[#098774] via-[#087363] to-[#07584d] p-9 text-white lg:flex lg:flex-col lg:justify-between xl:p-11">
          <div className="pointer-events-none absolute -left-32 top-36 h-80 w-80 rounded-full bg-emerald-300/10" />

          <div className="pointer-events-none absolute -bottom-56 -right-40 h-[500px] w-[500px] rounded-full bg-emerald-200/10" />

          {/* Logo */}
          <Link
            href="/"
            className="relative z-10 flex w-fit items-center gap-3"
          >
            <UniCareLogo
              variant="dark"
              className="h-11 w-11"
            />

            <div>
              <h1 className="text-lg font-extrabold tracking-wide">
                UNICARE
              </h1>

              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-emerald-100">
                Walailak University
              </p>
            </div>
          </Link>

          {/* เนื้อหาฝั่งซ้าย */}
          <div className="relative z-10 max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-50">
              <Leaf className="h-3.5 w-3.5 text-lime-200" />
              Campus Care
            </span>

            <h2 className="mt-6 text-3xl font-extrabold leading-tight xl:text-4xl">
              {t("ร่วมกันดูแล")}
              <br />
              {t("มหาวิทยาลัยวลัยลักษณ์")}
            </h2>

            <p className="mt-5 max-w-md text-xs leading-6 text-emerald-50/80">
              {t(
                "ระบบแจ้งปัญหาเสียงรบกวนและสิ่งแวดล้อม เพื่อช่วยดูแลพื้นที่และคุณภาพชีวิตที่ดีของทุกคน",
              )}
            </p>

            <div className="mt-7 space-y-3">
              <FeatureItem
                icon={
                  <Megaphone className="h-4 w-4" />
                }
                text={t(
                  "แจ้งปัญหาได้อย่างสะดวก รวดเร็ว",
                )}
              />

              <FeatureItem
                icon={
                  <History className="h-4 w-4" />
                }
                text={t(
                  "ติดตามสถานะเรื่องร้องเรียนแบบเรียลไทม์",
                )}
              />

              <FeatureItem
                icon={<Leaf className="h-4 w-4" />}
                text={t(
                  "ร่วมสร้างมหาวิทยาลัยน่าอยู่และยั่งยืน",
                )}
              />
            </div>
          </div>

          <p className="relative z-10 text-[9px] font-medium text-emerald-100/70">
            © 2026 Campus EcoWatch · Walailak
            University
          </p>
        </section>

        {/* ฝั่งขวา */}
        <section className="relative flex min-h-[620px] items-center justify-center px-6 py-8 sm:px-10 lg:min-h-[650px] lg:px-12">
          <div className="w-full max-w-md">
            {/* Language Switcher */}
            <div className="mb-4 flex items-center justify-between">
              {/* Logo บนมือถือ */}
              <Link
                href="/"
                className="flex items-center gap-3 lg:hidden"
              >
                <UniCareLogo className="h-9 w-9" />

                <div>
                  <p className="text-sm font-extrabold text-emerald-800">
                    UNICARE
                  </p>

                  <p className="text-[9px] uppercase tracking-wider text-slate-400">
                    Walailak University
                  </p>
                </div>
              </Link>

              <div className="ml-auto">
                <LanguageSwitcher />
              </div>
            </div>

            {/* หัวข้อ */}
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <User className="h-5 w-5" />
              </span>

              <h1 className="mt-4 text-2xl font-extrabold text-slate-800">
                {t("เข้าสู่ระบบ")}
              </h1>

              <p className="mt-1.5 text-xs text-slate-400">
                {t(
                  "กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งานระบบ UniCare",
                )}
              </p>
            </div>

            {/* Form Login */}
            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              {/* Email */}
              <label className="block">
                <span className="text-xs font-bold text-slate-700">
                  {t("อีเมล หรือ ชื่อผู้ใช้งาน")}
                </span>

                <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />

                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder={t(
                      "กรอกอีเมล หรือ ชื่อผู้ใช้งาน",
                    )}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      setResetMessage("");
                    }}
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-700 outline-none placeholder:text-slate-300"
                  />
                </div>
              </label>

              {/* Password */}
              <label className="block">
                <span className="text-xs font-bold text-slate-700">
                  {t("รหัสผ่าน")}
                </span>

                <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    required
                    autoComplete="current-password"
                    placeholder={t("กรอกรหัสผ่าน")}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-700 outline-none placeholder:text-slate-300"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "ซ่อนรหัสผ่าน"
                        : "แสดงรหัสผ่าน"
                    }
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    className="text-slate-400 transition hover:text-emerald-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              {/* จำการเข้าสู่ระบบ / ลืมรหัสผ่าน */}
              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-500">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(
                        event.target.checked,
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                  />

                  {t("จดจำการเข้าสู่ระบบ")}
                </label>

                <button
                  type="button"
                  onClick={openForgotPasswordModal}
                  className="text-[11px] font-semibold text-emerald-700 transition hover:text-emerald-900 hover:underline cursor-pointer"
                >
                  {t("ลืมรหัสผ่าน?")}
                </button>
              </div>

              {/* Reset success */}
              {resetMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs leading-5 text-emerald-700">
                  {resetMessage}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs leading-5 text-rose-600">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  isSubmitting || isResetting
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />

                {isSubmitting
                  ? t("กำลังเข้าสู่ระบบ...")
                  : t("เข้าสู่ระบบ")}
              </button>
            </form>

            {/* สมัครสมาชิก */}
            <p className="mt-5 text-center text-xs text-slate-400">
              {t("ยังไม่มีบัญชีผู้ใช้งาน?")}{" "}

              <Link
                href="/register"
                className="font-bold text-emerald-700 transition hover:text-emerald-900 hover:underline"
              >
                {t("ลงทะเบียนบัญชีใหม่")}
              </Link>
            </p>
          </div>
        </section>
      </div>

      {/* ================= Modal ลืมรหัสผ่าน ================= */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-700" />

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <KeyRound className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {t("รีเซ็ตรหัสผ่าน")}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    UniCare · Walailak University
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleModalSendReset} className="p-6 space-y-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-800">
                  {t("ลืมรหัสผ่านใช่หรือไม่?")}
                </h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {t("กรอกอีเมลที่ลงทะเบียนไว้กับระบบ เพื่อรับลิงก์สำหรับกำหนดรหัสผ่านใหม่")}
                </p>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-slate-700">
                  {t("อีเมลที่ใช้ลงทะเบียน")}
                </span>
                <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="example@wu.ac.th"
                    value={modalEmail}
                    onChange={(e) => {
                      setModalEmail(e.target.value);
                      setModalError("");
                      setModalSuccess("");
                    }}
                    className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-300 font-medium"
                  />
                </div>
              </label>

              {modalSuccess && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs leading-5 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{t(modalSuccess)}</p>
                      <p className="mt-1 text-[11px] text-emerald-700 leading-relaxed">
                        {t("(หากไม่ได้รับอีเมลเนื่องจากข้อจำกัดของระบบส่งเมลภายนอก ท่านสามารถกดปุ่มสีเขียวด้านล่างเพื่อเปลี่ยนรหัสผ่านได้ทันที)")}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/reset-password?email=${encodeURIComponent(modalEmail.trim().toLowerCase())}`}
                    onClick={() => setShowForgotModal(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
                  >
                    <span>{t("ตั้งรหัสผ่านใหม่ทันที (ไม่ต้องรออีเมล)")}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              {modalError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs leading-5 text-rose-600">
                  {t(modalError)}
                </div>
              )}

              {!modalSuccess && (
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isModalResetting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    {isModalResetting ? t("กำลังตรวจสอบบัญชี...") : t("ส่งคำขอรีเซ็ตรหัสผ่าน")}
                  </button>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <Link
                      href={`/reset-password${modalEmail.trim() ? `?email=${encodeURIComponent(modalEmail.trim())}` : ""}`}
                      onClick={() => setShowForgotModal(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                    >
                      <span>{t("ไปยังหน้าตั้งรหัสผ่านใหม่โดยตรง")}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                    >
                      {t("ยกเลิก")}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function FeatureItem({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-xs text-emerald-50">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-lime-200">
        {icon}
      </span>

      <span>{text}</span>
    </div>
  );
}