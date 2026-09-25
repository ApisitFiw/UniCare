"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BarChart3,
  ClipboardList,
  FolderKanban,
  Star,
  LogOut,
  User,
  Users,
  X,
  Newspaper,
  Sprout,
  Leaf,
} from "lucide-react";
import { signOutDemo, getDemoSession } from "@/lib/authService";
import UniCareLogo from "@/components/UniCareLogo";
import { useLanguage } from "@/context/LanguageContext";

const adminNavItems = [
  { label: "หน้าหลัก", href: "/admin/dashboard", icon: Home },
  { label: "จัดการบัญชีผู้ใช้", href: "/admin/users", icon: Users },
  { label: "จัดการคำร้อง", href: "/admin/reports", icon: ClipboardList },
  { label: "ประกาศข่าวสาร", href: "/admin/announcements", icon: Newspaper },
  { label: "สถิติและรายงาน", href: "/admin/analytics", icon: BarChart3 },
  { label: "ผลการประเมิน (CSAT)", href: "/admin/evaluation", icon: Star },
  {
    label: "ติดตามและจัดการสถานะ",
    href: "/admin/issues",
    icon: ClipboardList,
  },
  {
    label: "หมวดหมู่และพื้นที่เสี่ยง",
    href: "/admin/categories",
    icon: FolderKanban,
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    const handleClose = () => setMobileOpen(false);

    window.addEventListener("unicare-toggle-sidebar", handleToggle);
    window.addEventListener("resize", handleClose);

    return () => {
      window.removeEventListener("unicare-toggle-sidebar", handleToggle);
      window.removeEventListener("resize", handleClose);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    setShowLogoutModal(true);
  }

  function closeLogoutModal() {
    if (!isLoggingOut) setShowLogoutModal(false);
  }

  async function confirmLogout() {
    setIsLoggingOut(true);

    try {
      signOutDemo();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  }

  const renderNavContent = () => (
    <>
      <div className="space-y-6">
        <Link
          href="/admin/dashboard"
          className="group flex items-center space-x-3 border-b border-white/15 pb-4"
        >
          <UniCareLogo variant="dark" className="w-10 h-10 transition-transform group-hover:scale-105" />

          <div>
            <h1 className="text-xl font-extrabold uppercase leading-none tracking-wider text-white">
              UniCare
            </h1>
            <p className="mt-1 text-[10px] font-medium text-emerald-100">
              {t("มหาวิทยาลัยวลัยลักษณ์")}
            </p>
          </div>
        </Link>

        <nav className="space-y-1.5 text-xs font-medium">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center space-x-3 rounded-xl px-3.5 py-2.5 transition ${
                  active
                    ? "bg-[#c5e8d5] font-bold text-[#0d3b2e] shadow-sm"
                    : "text-emerald-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{t(item.label)}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex w-full items-center space-x-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-left text-xs font-semibold text-rose-100 shadow-sm transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{t("ออกจากระบบ")}</span>
          </button>
        </nav>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/15 p-3.5 text-center mt-6">
        <p className="flex items-center justify-center gap-1.5 text-xs font-medium leading-relaxed text-emerald-100">
          <span>{t("ร่วมสร้างมหาวิทยาลัยน่าอยู่ไปด้วยกัน")}</span>
          <Leaf className="h-3.5 w-3.5 text-emerald-300" />
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="sticky top-0 z-30 hidden h-screen w-64 flex-shrink-0 flex-col justify-between overflow-y-auto border-r border-[#103e31] p-5 text-white shadow-lg md:flex"
        style={{
          background:
            "linear-gradient(180deg, #2b8273 0%, #1c5e52 40%, #15453b 70%, #0f3028 100%)",
        }}
      >
        {renderNavContent()}
      </aside>

      {/* Mobile Slide Bar Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col justify-between overflow-y-auto p-5 text-white shadow-2xl transition-transform duration-300"
            style={{
              background:
                "linear-gradient(180deg, #2b8273 0%, #1c5e52 40%, #15453b 70%, #0f3028 100%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end pb-2">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20 transition"
                aria-label="ปิดเมนู"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavContent()}
          </aside>
        </div>
      )}

      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[3px]"
          onClick={closeLogoutModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-700" />

            <button
              type="button"
              aria-label="ปิดหน้าต่าง"
              disabled={isLoggingOut}
              onClick={closeLogoutModal}
              className="absolute right-4 top-5 rounded-full bg-slate-100 p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="px-7 pb-7 pt-8 text-center">
              <span className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-8 ring-rose-50/50">
                <LogOut className="h-8 w-8" />
              </span>

              <h2
                id="logout-modal-title"
                className="mt-6 text-xl font-extrabold text-slate-800"
              >
                {t("ยืนยันการออกจากระบบ")}
              </h2>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                {t("คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ UniCare?")}
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={closeLogoutModal}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  {t("ยกเลิก")}
                </button>

                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={confirmLogout}
                  className="flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? t("กำลังออก...") : t("ออกจากระบบ")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
