"use client";

import { useState } from "react";
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
  X,
} from "lucide-react";
import { signOutDemo } from "@/lib/demoAuth";

const adminNavItems = [
  { label: "หน้าหลัก", href: "/admin/dashboard", icon: Home },
  { label: "จัดการบัญชีผู้ใช้", href: "/admin/users", icon: User },
  { label: "จัดการคำร้อง", href: "/admin/reports", icon: ClipboardList },
  { label: "สถิติและรายงาน", href: "/admin/analytics", icon: BarChart3 },
  { label: "ผลการประเมิน (CSAT)", href: "/admin/feedback", icon: Star },
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  return (
    <>
      <aside
        className="sticky top-0 z-30 hidden h-screen w-64 flex-shrink-0 flex-col justify-between overflow-y-auto border-r border-[#103e31] p-5 text-white shadow-lg md:flex"
        style={{
          background:
            "linear-gradient(180deg, #2b8273 0%, #1c5e52 40%, #15453b 70%, #0f3028 100%)",
        }}
      >
        <div className="space-y-6">
          <Link
            href="/admin/dashboard"
            className="group flex items-center space-x-3 border-b border-white/15 pb-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-xl font-bold transition-transform group-hover:scale-105">
              🌱
            </div>

            <div>
              <h1 className="text-xl font-extrabold uppercase leading-none tracking-wider text-white">
                UniCare
              </h1>
              <p className="mt-1 text-[10px] font-medium text-emerald-100">
                มหาวิทยาลัยวลัยลักษณ์
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
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center space-x-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-left text-xs font-semibold text-rose-100 shadow-sm transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>ออกจากระบบ</span>
            </button>
          </nav>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/15 p-3.5 text-center">
          <p className="text-xs font-medium leading-relaxed text-emerald-100">
            ร่วมสร้างมหาวิทยาลัยน่าอยู่ไปด้วยกัน 🌱
          </p>
        </div>
      </aside>

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
                ยืนยันการออกจากระบบ
              </h2>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                คุณต้องการออกจากระบบ UniCare หรือไม่?
              </p>

              <p className="mt-2 text-xs text-slate-400">
                คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อใช้งานหน้า Admin
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={closeLogoutModal}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={confirmLogout}
                  className="flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? "กำลังออก..." : "ออกจากระบบ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
