"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getDemoSession,
  signOutDemo,
  type DemoSession,
} from "@/lib/demoAuth";

const categories = [
  "เสียงรบกวน",
  "ขยะ / ของเสีย",
  "น้ำ / น้ำเสีย",
  "อากาศ / มลพิษ",
  "แสงสว่าง",
  "ต้นไม้ / พื้นที่เขียว",
  "อื่น ๆ",
];

const news = [
  {
    icon: "📢",
    title: "มาตรการลดเสียงรบกวนในช่วงสอบปลายภาค",
    description: "ขอความร่วมมืองดกิจกรรมที่ใช้เสียงดังหลังเวลา 21.00 น.",
  },
  {
    icon: "🌱",
    title: "กิจกรรม Big Cleaning Day",
    description: "ร่วมกันทำความสะอาดและคัดแยกขยะภายในมหาวิทยาลัย",
  },
];

export default function UserDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    const currentSession = getDemoSession();

    if (!currentSession || currentSession.role !== "user") {
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
              👤 {session.name} · User
            </span>
            
          </div>
        </div>
      </header>

      {/* เฉพาะเนื้อหา Dashboard */}
      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        

        <section className="rounded-2xl bg-gradient-to-r from-emerald-900 to-emerald-600 p-7 text-white shadow-md">
          <h2 className="text-2xl font-bold">
            ร่วมกันดูแลมหาวิทยาลัยของเรา
          </h2>
          <p className="mt-2 text-sm text-emerald-100">
            แจ้งปัญหาและติดตามการดำเนินงานได้จากระบบ UniCare
          </p>
          <Link
            href="/report"
            className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
          >
            📢 แจ้งปัญหาใหม่
          </Link>
        </section>

        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          กำลังใช้บัญชีทดลอง การแจ้งปัญหาและตัวเลขสถิติจะใช้งานจริงได้หลังตั้งค่า Supabase
        </p>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">📋 รายงานของฉัน</p>
            <p className="mt-2 text-3xl font-bold text-emerald-950">0</p>
            <p className="mt-1 text-xs text-slate-400">ยังไม่มีข้อมูลรายงาน</p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">⏳ กำลังดำเนินการ</p>
            <p className="mt-2 text-3xl font-bold text-emerald-950">0</p>
            <p className="mt-1 text-xs text-slate-400">ยังไม่มีข้อมูลรายงาน</p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">✅ ดำเนินการแล้ว</p>
            <p className="mt-2 text-3xl font-bold text-emerald-950">0</p>
            <p className="mt-1 text-xs text-slate-400">ยังไม่มีข้อมูลรายงาน</p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-emerald-950">
            ประเภทปัญหาที่แจ้งได้
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/report?category=${encodeURIComponent(category)}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm hover:border-emerald-400 hover:bg-emerald-50"
              >
                🏷️ {category}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-emerald-950">
            ข่าวสารและประกาศ
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {news.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <h3 className="font-semibold">
                  {item.icon} {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}