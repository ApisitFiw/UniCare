"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getDemoSession,
  signOutDemo,
  type DemoSession,
} from "@/lib/demoAuth";
import { getAllCurrentIssues, getDisabledCategoryNames } from "@/lib/issuesData";
import AccountBar from "@/components/AccountBar";

const categories = [
  "เสียงรบกวน",
  "ขยะ / ของเสีย",
  "น้ำ / น้ำเสีย",
  "อากาศ / มลพิษ",
  "แสงสว่าง",
  "ต้นไม้ / พื้นที่สีเขียว",
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
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, resolved: 0 });

  useEffect(() => {
    const updateSession = () => {
      const currentSession = getDemoSession();
      if (!currentSession || currentSession.role !== "user") {
        router.replace("/login");
        return;
      }
      setSession(currentSession);
    };

    updateSession();

    window.addEventListener("unicare-profile-updated", updateSession);
    window.addEventListener("storage", updateSession);

    return () => {
      window.removeEventListener("unicare-profile-updated", updateSession);
      window.removeEventListener("storage", updateSession);
    };
  }, [router]);

  useEffect(() => {
    const syncData = () => {
      setDisabledCategories(getDisabledCategoryNames());

      const currentSession = getDemoSession();
      if (!currentSession) return;

      const issues = getAllCurrentIssues();
      const currentName = (currentSession.name || "").trim().toLowerCase();
      const currentEmail = (currentSession.email || "").trim().toLowerCase();

      const myIssues = issues.filter((i) => {
        const rName = (i.reporterName || "").trim().toLowerCase();
        const rEmail = (i.reporterEmail || "").trim().toLowerCase();
        if (currentEmail && rEmail && currentEmail === rEmail) return true;
        if (currentEmail === "user@unicare.local" && (rEmail === "kittipoom@example.com" || rName.includes("กิตติภูมิ"))) return true;
        if (currentName && rName && currentName === rName) return true;
        return false;
      });

      const total = myIssues.length;
      const inProgress = myIssues.filter(
        (i) => i.status === "in_progress" || i.status === "pending",
      ).length;
      const resolved = myIssues.filter((i) => i.status === "resolved").length;

      setStats({ total, inProgress, resolved });
    };

    syncData();

    window.addEventListener("storage", syncData);
    window.addEventListener("unicare-demo-reports-updated", syncData);
    window.addEventListener("unicare-category-metadata-updated", syncData);
    window.addEventListener("unicare-profile-updated", syncData);
    window.addEventListener("focus", syncData);

    return () => {
      window.removeEventListener("storage", syncData);
      window.removeEventListener("unicare-demo-reports-updated", syncData);
      window.removeEventListener("unicare-category-metadata-updated", syncData);
      window.removeEventListener("unicare-profile-updated", syncData);
      window.removeEventListener("focus", syncData);
    };
  }, []);

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
      <header className="bg-white border-b border-slate-200/80 px-6 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <Link href="/user/dashboard" className="flex items-center gap-2 text-base font-extrabold text-emerald-900">
          <span className="text-xl">🌱</span>
          <span>UniCare</span>
          <span className="hidden sm:inline-block text-xs font-normal text-slate-400 ml-1">
            · มหาวิทยาลัยวลัยลักษณ์
          </span>
        </Link>

        <AccountBar role="USER" userName={session.name} />
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
            href="/user/report"
            className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50 transition"
          >
            📢 แจ้งปัญหาใหม่
          </Link>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-semibold text-slate-600">📋 รายงานของฉัน</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-950">{stats.total}</p>
            <p className="mt-1 text-xs text-slate-400">
              {stats.total > 0 ? "เรื่องร้องเรียนทั้งหมดที่คุณแจ้งไว้" : "ยังไม่มีข้อมูลรายงาน"}
            </p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-semibold text-slate-600">⏳ กำลังดำเนินการ / รอรับเรื่อง</p>
            <p className="mt-2 text-3xl font-extrabold text-amber-600">{stats.inProgress}</p>
            <p className="mt-1 text-xs text-slate-400">
              {stats.inProgress > 0 ? "เจ้าหน้าที่กำลังเร่งดำเนินการแก้ไข" : "ไม่มีเคสค้าง"}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-semibold text-slate-600">✅ ดำเนินการแล้ว</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600">{stats.resolved}</p>
            <p className="mt-1 text-xs text-slate-400">
              {stats.resolved > 0 ? "แก้ไขและดำเนินการสำเร็จแล้ว" : "ยังไม่มีเคสที่เสร็จสิ้น"}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-emerald-950">
              ประเภทปัญหาที่แจ้งได้
            </h2>
            {disabledCategories.length > 0 && (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                ⚠️ มี {disabledCategories.length} หมวดหมู่ปิดรับแจ้งชั่วคราว
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => {
              const isDisabled = disabledCategories.includes(category);
              if (isDisabled) {
                return (
                  <div
                    key={category}
                    title="หมวดหมู่นี้ปิดรับแจ้งชั่วคราว"
                    className="cursor-not-allowed rounded-xl border border-dashed border-slate-300 bg-slate-100 p-4 text-center text-sm text-slate-400 select-none opacity-80"
                  >
                    <span className="line-through">🏷️ {category}</span>
                    <span className="mt-1 block text-xs font-semibold text-rose-500">
                      (ปิดรับแจ้งชั่วคราว)
                    </span>
                  </div>
                );
              }
              return (
                <Link
                  key={category}
                  href={`/user/report?category=${encodeURIComponent(category)}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-medium hover:border-emerald-400 hover:bg-emerald-50 transition"
                >
                  🏷️ {category}
                </Link>
              );
            })}
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