"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Megaphone,
  ClipboardList,
  Newspaper,
  CircleHelp,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { signOutDemo } from "@/lib/demoAuth";

const menu = [
  { label: "หน้าหลัก", href: "/user/dashboard", icon: Home },
  { label: "แจ้งปัญหา", href: "/user/report", icon: Megaphone },
  { label: "รายการของฉัน", href: "/my-reports", icon: ClipboardList },
  { label: "ข่าวสาร / ประกาศ", href: "/user/dashboard?tab=news", icon: Newspaper },
  { label: "คำถามที่พบบ่อย", href: "/user/dashboard?tab=faq", icon: CircleHelp },
  { label: "ติดต่อเรา", href: "/user/dashboard?tab=contact", icon: MessageCircle },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    if (!window.confirm("คุณต้องการออกจากระบบหรือไม่?")) return;
    signOutDemo();
    router.replace("/login");
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-white/10 bg-gradient-to-b from-[#15796c] via-[#11695e] to-[#0b4b43] p-4 text-white md:flex">
      <div>
        <Link
          href="/user/dashboard"
          className="flex items-center gap-3 border-b border-white/10 px-1 pb-5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl">
            🌱
          </span>
          <span className="text-lg font-extrabold tracking-wide">UNICARE</span>
        </Link>

        <nav className="mt-5 space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/user/dashboard"
                ? pathname === "/user/dashboard"
                : pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition hover:bg-white/10 ${
                  active ? "bg-white/10" : ""
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm font-semibold text-rose-100 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-black/15 px-3 py-4 text-center text-xs text-emerald-100">
        ร่วมสร้างมหาวิทยาลัยน่าอยู่ไปด้วยกัน 🌱
      </div>
    </aside>
  );
}