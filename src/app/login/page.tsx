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
} from "lucide-react";
import { signInUnified } from "@/lib/authService";
import UniCareLogo from "@/components/UniCareLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem("unicare_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const result = await signInUnified(email.trim().toLowerCase(), password);

      if (!result.success || !result.session) {
        setError(result.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
        setIsSubmitting(false);
        return;
      }

      const session = result.session;

    if (rememberMe) {
      window.localStorage.setItem(
        "unicare_remember_email",
        email.trim().toLowerCase(),
      );
    } else {
      window.localStorage.removeItem("unicare_remember_email");
    }

    router.replace(
      session.role === "admin"
        ? "/admin/dashboard"
        : "/user/dashboard",
    );
    } catch {
      setError("เกิดข้อผิดพลาดในการตรวจสอบข้อมูลกับ Supabase");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4 sm:p-6 lg:p-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl lg:min-h-[650px] lg:grid-cols-[46%_54%]">
        {/* ==================== ฝั่งซ้าย ==================== */}
        <section className="relative hidden min-h-[650px] overflow-hidden bg-gradient-to-br from-[#098774] via-[#087363] to-[#07584d] p-9 text-white lg:flex lg:flex-col lg:justify-between xl:p-11">
          {/* วงกลมตกแต่ง */}
          <div className="pointer-events-none absolute -left-32 top-36 h-80 w-80 rounded-full bg-emerald-300/10" />
          <div className="pointer-events-none absolute -bottom-56 -right-40 h-[500px] w-[500px] rounded-full bg-emerald-200/10" />

          {/* Logo */}
          <Link
            href="/"
            className="relative z-10 flex w-fit items-center gap-3"
          >
            <UniCareLogo variant="dark" className="w-11 h-11" />

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
              {t("ระบบแจ้งปัญหาเสียงรบกวนและสิ่งแวดล้อม เพื่อช่วยดูแลพื้นที่และคุณภาพชีวิตที่ดีของทุกคน")}
            </p>

            <div className="mt-7 space-y-3">
              <FeatureItem
                icon={<Megaphone className="h-4 w-4" />}
                text={t("แจ้งปัญหาได้อย่างสะดวก รวดเร็ว")}
              />
              <FeatureItem
                icon={<History className="h-4 w-4" />}
                text={t("ติดตามสถานะเรื่องร้องเรียนแบบเรียลไทม์")}
              />
              <FeatureItem
                icon={<Leaf className="h-4 w-4" />}
                text={t("ร่วมสร้างมหาวิทยาลัยน่าอยู่และยั่งยืน")}
              />
            </div>
          </div>

          <p className="relative z-10 text-[9px] font-medium text-emerald-100/70">
            © 2026 Campus EcoWatch · Walailak University
          </p>
        </section>

        {/* ==================== ฝั่งขวา ==================== */}
        <section className="flex min-h-[620px] items-center justify-center px-6 py-8 sm:px-10 lg:min-h-[650px] lg:px-12 relative">
          <div className="w-full max-w-md">
            {/* Language Switcher on Login Page */}
            <div className="flex items-center justify-between mb-4">
              {/* Logo บนมือถือ */}
              <Link
                href="/"
                className="flex items-center gap-3 lg:hidden"
              >
                <UniCareLogo className="w-9 h-9" />
                <div>
                  <p className="font-extrabold text-emerald-800 text-sm">UNICARE</p>
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
                {t("กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งานระบบ UniCare")}
              </p>
            </div>

            {/* Form Login */}
            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              {/* Email or Username */}
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
                    placeholder={t("กรอกอีเมล หรือ ชื่อผู้ใช้งาน")}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
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
                    type={showPassword ? "text" : "password"}
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
                      setShowPassword((current) => !current)
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

              {/* จำการเข้าสู่ระบบ & ลืมรหัสผ่าน */}
              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-500">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                  />
                  {t("จดจำการเข้าสู่ระบบ")}
                </label>

                <button
                  type="button"
                  className="text-[11px] font-semibold text-emerald-700 transition hover:text-emerald-900 hover:underline"
                >
                  {t("ลืมรหัสผ่าน?")}
                </button>
              </div>

              {/* Error Notification */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-600">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />
                {isSubmitting ? t("กำลังเข้าสู่ระบบ...") : t("เข้าสู่ระบบ")}
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