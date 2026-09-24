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
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  History,
  Leaf,
  LockKeyhole,
  LogIn,
  Mail,
  Megaphone,
  ShieldCheck,
  Sprout,
  User,
} from "lucide-react";
import {
  ADMIN_ACCOUNTS,
  USER_ACCOUNTS,
  getActiveUserAccounts,
  signInDemoExtended,
  type DemoRole,
  type UserAccountConfig,
} from "@/lib/demoAuth";

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState<DemoRole>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userList, setUserList] = useState<UserAccountConfig[]>(USER_ACCOUNTS);

  useEffect(() => {
    setUserList(getActiveUserAccounts());
  }, []);

  function changeRole(value: DemoRole) {
    setRole(value);
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    const result = signInDemoExtended(
      email.trim().toLowerCase(),
      password,
      role,
    );

    if (!result.success || !result.session) {
      setError(result.error || "อีเมล รหัสผ่าน หรือประเภทบัญชีไม่ถูกต้อง");
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
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/15 text-lime-200">
              <Sprout className="h-5 w-5" />
            </span>

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
              ร่วมกันดูแล
              <br />
              มหาวิทยาลัยวลัยลักษณ์
            </h2>

            <p className="mt-5 max-w-md text-xs leading-6 text-emerald-50/80">
              ระบบแจ้งปัญหาเสียงรบกวนและสิ่งแวดล้อม
              เพื่อช่วยดูแลพื้นที่และคุณภาพชีวิตที่ดีของทุกคน
            </p>

            <div className="mt-7 space-y-3">
              <FeatureItem
                icon={<Megaphone className="h-4 w-4" />}
                text="แจ้งปัญหาได้อย่างสะดวก"
              />

              <FeatureItem
                icon={<History className="h-4 w-4" />}
                text="ติดตามสถานะเรื่องร้องเรียน"
              />

              <FeatureItem
                icon={<Leaf className="h-4 w-4" />}
                text="ร่วมสร้างมหาวิทยาลัยน่าอยู่"
              />
            </div>
          </div>

          <p className="relative z-10 text-[9px] font-medium text-emerald-100/70">
            © 2026 Campus EcoWatch · Walailak University
          </p>
        </section>

        {/* ==================== ฝั่งขวา ==================== */}
        <section className="flex min-h-[620px] items-center justify-center px-6 py-8 sm:px-10 lg:min-h-[650px] lg:px-12">
          <div className="w-full max-w-md">
            {/* Logo บนมือถือ */}
            <Link
              href="/"
              className="mb-8 flex items-center gap-3 lg:hidden"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Sprout className="h-5 w-5" />
              </span>

              <div>
                <p className="font-extrabold text-emerald-800">
                  UNICARE
                </p>

                <p className="text-[9px] uppercase tracking-wider text-slate-400">
                  Walailak University
                </p>
              </div>
            </Link>

            {/* หัวข้อ */}
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <User className="h-5 w-5" />
              </span>

              <h1 className="mt-4 text-2xl font-extrabold text-slate-800">
                เข้าสู่ระบบ
              </h1>

              <p className="mt-1.5 text-xs text-slate-400">
                เลือกประเภทบัญชีและกรอกข้อมูลเพื่อเข้าใช้งาน
              </p>
            </div>

            {/* เลือก User หรือ Admin */}
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-[#eef5f2] p-1.5">
              <RoleButton
                active={role === "user"}
                icon={<User className="h-4 w-4" />}
                title="ผู้ใช้งานทั่วไป"
                subtitle="นักศึกษา / บุคลากร"
                onClick={() => changeRole("user")}
              />

              <RoleButton
                active={role === "admin"}
                icon={<ShieldCheck className="h-4 w-4" />}
                title="ผู้ดูแลระบบ"
                subtitle="เจ้าหน้าที่ / Admin"
                onClick={() => changeRole("admin")}
              />
            </div>

            {/* Form Login */}
            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              {/* Email */}
              <label className="block">
                <span className="text-xs font-bold text-slate-700">
                  Email
                </span>

                <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />

                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={
                      role === "admin"
                        ? "เช่น Natthakon030948@gmail.com"
                        : "เช่น kittipoom@example.com หรือ user@unicare.local"
                    }
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-700 outline-none placeholder:text-slate-300"
                  />
                </div>
              </label>

              {/* Password */}
              <label className="block">
                <span className="text-xs font-bold text-slate-700">
                  รหัสผ่าน
                </span>

                <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="กรอกรหัสผ่าน (12345)"
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

              {/* จำการเข้าสู่ระบบ */}
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

                  จดจำการเข้าสู่ระบบ
                </label>

                <button
                  type="button"
                  className="text-[11px] font-semibold text-emerald-700 transition hover:text-emerald-900 hover:underline"
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-600">
                  {error}
                </div>
              )}

              {/* ปุ่ม Login */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />

                {isSubmitting
                  ? "กำลังเข้าสู่ระบบ..."
                  : `เข้าสู่ระบบ ${
                      role === "user" ? "User" : "Admin"
                    }`}
              </button>
            </form>

            {/* บัญชีทดลอง */}
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3.5 text-[11px] leading-5 text-amber-800">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-800">บัญชีสำหรับทดลอง</p>
                <span className="rounded bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                  Demo
                </span>
              </div>

              {role === "user" ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">
                      รหัสผ่าน User: <strong className="text-emerald-700">12345</strong>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (คลิกชื่อเพื่อกรอก)
                    </span>
                  </div>

                  <div className="grid max-h-44 grid-cols-1 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-2">
                    {userList.map((acc) => {
                      const isSelected =
                        email.toLowerCase() === acc.email.toLowerCase();
                      const isSuspended = acc.status === "suspended";
                      const isDeleted = acc.status === "deleted";
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            setEmail(acc.email);
                            setPassword("12345");
                          }}
                          className={`flex items-center justify-between rounded-lg border px-2 py-1.5 text-left text-[10px] transition ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold"
                              : isDeleted
                              ? "border-slate-300 bg-slate-100/90 text-slate-500 hover:bg-slate-200/80"
                              : isSuspended
                              ? "border-rose-200 bg-rose-50/80 text-slate-700 hover:bg-rose-100/70"
                              : "border-amber-200/70 bg-white/80 text-slate-700 hover:bg-amber-100/70"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className={`truncate ${isDeleted ? "line-through text-slate-400" : ""}`}>{acc.name}</span>
                              {isDeleted ? (
                                <span className="rounded bg-slate-200 px-1 py-0.5 text-[8px] font-semibold text-slate-600">
                                  ลบแล้ว
                                </span>
                              ) : isSuspended ? (
                                <span className="rounded bg-rose-200 px-1 py-0.5 text-[8px] font-semibold text-rose-700">
                                  ระงับ
                                </span>
                              ) : null}
                            </div>
                            <span className="block truncate text-[9px] text-slate-400">
                              {acc.email}
                            </span>
                          </div>
                          <span className="ml-1 shrink-0 text-[9px] text-slate-400">
                            เลือก
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">
                      รหัสผ่าน Admin: <strong className="text-emerald-700">12345</strong>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (คลิกชื่อเพื่อกรอก)
                    </span>
                  </div>

                  <div className="grid max-h-44 grid-cols-1 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-2">
                    {ADMIN_ACCOUNTS.map((acc) => {
                      const isSelected =
                        email.toLowerCase() === acc.email.toLowerCase();
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            setEmail(acc.email);
                            setPassword("12345");
                          }}
                          className={`flex items-center justify-between rounded-lg border px-2 py-1.5 text-left text-[10px] transition ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold"
                              : "border-amber-200/70 bg-white/80 text-slate-700 hover:bg-amber-100/70"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block truncate">{acc.name}</span>
                            <span className="block truncate text-[9px] text-slate-400">
                              {acc.email}
                            </span>
                          </div>
                          <span className="ml-1 shrink-0 text-[9px] text-slate-400">
                            เลือก
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* สมัครสมาชิก */}
            <p className="mt-4 text-center text-[11px] text-slate-400">
              ยังไม่มีบัญชี?{" "}
              <Link
                href="/register"
                className="font-bold text-emerald-700 transition hover:text-emerald-900 hover:underline"
              >
                ลงทะเบียนผู้ใช้งานใหม่
              </Link>
            </p>

            {/* ปุ่มติดต่อ Admin */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  // ยังไม่ต้องให้กดเเล้วเข้าได้ ให้ยังกดเเล้วไม่ไปไหน
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-[11px] font-medium transition cursor-pointer shadow-2xs"
                title="ติดต่อผู้ดูแลระบบ"
              >
                <Headphones className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>ติดต่อ Admin</span>
              </button>
            </div>
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

function RoleButton({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-14 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${
        active
          ? "bg-emerald-600 text-white shadow-md"
          : "bg-transparent text-slate-600 hover:bg-white/70"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          active
            ? "bg-white/15 text-white"
            : "bg-white text-emerald-700 shadow-sm"
        }`}
      >
        {icon}
      </span>

      <span className="min-w-0">
        <span className="block text-[11px] font-bold">
          {title}
        </span>

        <span
          className={`mt-0.5 block text-[9px] ${
            active
              ? "text-emerald-50"
              : "text-slate-400"
          }`}
        >
          {subtitle}
        </span>
      </span>

      {active && (
        <CheckCircle2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-white" />
      )}
    </button>
  );
}