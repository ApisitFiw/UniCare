"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getDemoSession,
  signOutDemo,
  type DemoSession,
} from "@/lib/demoAuth";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    const currentSession = getDemoSession();

    if (!currentSession || currentSession.role !== "admin") {
      router.replace("/login");
      return;
    }

    setSession(currentSession);
  }, [router]);

  function handleLogout() {
    if (!window.confirm("คุณต้องการออกจากระบบหรือไม่?")) return;

    signOutDemo();
    router.replace("/login");
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-emerald-900">
        กำลังตรวจสอบบัญชี...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f8f5] text-slate-800">
      {/* แถบด้านบน */}
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="text-xl font-extrabold text-emerald-900">
            🌱 UniCare
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-600">
              👤 {session.name} · Admin
            </span>
            
          </div>
        </div>
      </header>

      {/* เฉพาะเนื้อหา Dashboard */}
      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        

        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          กำลังใช้บัญชีทดลอง ข้อมูลรายงานและสถิติจริงจะแสดงหลังตั้งค่า Supabase
        </p>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "📋", label: "รายงานทั้งหมด" },
            { icon: "🔍", label: "รอตรวจสอบ" },
            { icon: "⏳", label: "กำลังดำเนินการ" },
            { icon: "✅", label: "เสร็จสิ้น" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">
                {item.icon} {item.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-950">
                0
              </p>
              <p className="mt-1 text-xs text-slate-400">
                ยังไม่มีข้อมูลรายงาน
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/reports"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-400 hover:bg-emerald-50"
          >
            <div className="text-3xl">📋</div>
            <h2 className="mt-3 text-lg font-bold text-emerald-950">
              จัดการรายงาน
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              ตรวจสอบและจัดการปัญหาที่ผู้ใช้แจ้ง
            </p>
          </Link>

          <Link
            href="/admin/analytics"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-400 hover:bg-emerald-50"
          >
            <div className="text-3xl">📊</div>
            <h2 className="mt-3 text-lg font-bold text-emerald-950">
              สถิติและภาพรวม
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              ดูสรุปจำนวนรายงานและประเภทปัญหา
            </p>
          </Link>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-emerald-950">
            รายงานล่าสุด
          </h2>
          <p className="mt-4 rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
            ยังไม่มีข้อมูลรายงาน
          </p>
        </section>
      </main>
    </div>
  );
}