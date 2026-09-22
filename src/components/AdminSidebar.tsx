"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BarChart3,
  ClipboardList,
  FolderKanban,
  Star,
  MapPin,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";
import { signOutDemo } from "@/lib/demoAuth";

const adminNavItems = [
  { label: "หน้าหลัก", href: "/admin/dashboard", icon: Home },
  { label: "จัดการบัญชีผู้ใช้", href: "/admin/users", icon: User },
  { label: "จัดการคำร้อง", href: "/admin/reports", icon: ClipboardList },
  { label: "แผนที่จุดเสี่ยง", href: "/admin/map", icon: MapPin },
  { label: "สถิติและรายงาน", href: "/admin/analytics", icon: BarChart3 },
  { label: "ผลการประเมิน (CSAT)", href: "/admin/feedback", icon: Star },
  {
    label: "ติดตามและจัดการสถานะ",
    href: "/admin/issues",
    icon: ClipboardList,
  },
  {
    label: "จัดการหมวดหมู่และพื้นที่เสี่ยง",
    href: "/admin/categories",
    icon: FolderKanban,
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    if (!window.confirm("คุณต้องการออกจากระบบหรือไม่?")) return;

    signOutDemo();
    router.replace("/login");
  }

  return (
    <aside
      className="sticky top-0 z-30 hidden h-screen w-64 flex-shrink-0 flex-col justify-between overflow-y-auto border-r border-[#103e31] p-5 text-white shadow-lg md:flex"
      style={{
        background:
          "linear-gradient(180deg, #2b8273 0%, #1c5e52 40%, #15453b 70%, #0f3028 100%)",
      }}
    >
      <div className="space-y-6">
        {/* โลโก้ */}
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

        {/* เมนู Admin */}
        <nav className="space-y-1.5 text-xs font-medium">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

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

      {/* ข้อความด้านล่าง */}
      <div className="rounded-2xl border border-white/10 bg-black/15 p-3.5 text-center">
        <p className="text-xs font-medium leading-relaxed text-emerald-100">
          ร่วมสร้างมหาวิทยาลัยน่าอยู่ไปด้วยกัน 🌱
        </p>
      </div>
    </aside>
  );
}