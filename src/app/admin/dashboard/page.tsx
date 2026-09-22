"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getDemoSession,
  signOutDemo,
  type DemoSession,
} from "@/lib/demoAuth";

const demoReports = [
  {
    id: "REC-108",
    icon: "📢",
    title: "เสียงรบกวนห้องเรียน/หอพัก",
    description: "เสียงดังรบกวนการเรียนช่วงกลางคืน",
    location: "หอพักนักศึกษาชาย 3 (ชั้น 4)",
    priority: "High",
    time: "10 นาทีที่แล้ว",
    status: "Pending",
  },
  {
    id: "REC-107",
    icon: "🗑️",
    title: "ขยะล้นถังในพื้นที่ส่วนกลาง",
    description: "ขยะล้นถังจุดทิ้งขยะบริเวณหน้าอาคาร",
    location: "ศูนย์อาหารกลาง (โซนเก่า)",
    priority: "Medium",
    time: "35 นาทีที่แล้ว",
    status: "In_Progress",
  },
  {
    id: "REC-106",
    icon: "💡",
    title: "ไฟฟ้าขัดข้องในห้องสอน",
    description: "หลอดไฟดับ ห้องเรียนรวมชั้น 5",
    location: "อาคารเรียนรวม 5",
    priority: "Medium",
    time: "1 ชั่วโมงที่แล้ว",
    status: "In_Progress",
  },
];

const stats = [
  {
    label: "เรื่องร้องเรียนทั้งหมด",
    value: "128",
    note: "+12 เรื่องใหม่ในอาทิตย์นี้",
    icon: "📢",
    valueColor: "text-slate-900",
    noteColor: "text-emerald-600",
    iconColor: "border-emerald-100 bg-emerald-50",
  },
  {
    label: "รอรับเรื่อง / ตรวจสอบ",
    value: "8",
    note: "• ต้องการการมอบหมาย",
    icon: "⌛",
    valueColor: "text-rose-500",
    noteColor: "text-rose-500",
    iconColor: "border-rose-100 bg-rose-50",
  },
  {
    label: "กำลังดำเนินการ",
    value: "24",
    note: "ดำเนินการตาม SLA",
    icon: "🛠️",
    valueColor: "text-amber-600",
    noteColor: "text-amber-600",
    iconColor: "border-amber-100 bg-amber-50",
  },
  {
    label: "แก้ไขเสร็จสิ้น (Resolved)",
    value: "96",
    note: "ความสำเร็จ 75.0%",
    icon: "✅",
    valueColor: "text-emerald-700",
    noteColor: "text-emerald-600",
    iconColor: "border-emerald-100 bg-emerald-50",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [search, setSearch] = useState("");

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

  const filteredReports = demoReports.filter((report) =>
    `${report.id} ${report.title} ${report.location}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f7f5] text-emerald-900">
        กำลังตรวจสอบบัญชี...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f7f5] text-slate-800">
      {/* แถบด้านบน */}
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div>
            <h1 className="text-sm font-bold text-slate-900 sm:text-base">
              ศูนย์ควบคุมและบริหารจัดการระบบ (Admin Dashboard)
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              UniCare · มหาวิทยาลัยวลัยลักษณ์
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                👤
              </span>
              <span className="text-xs font-semibold">
                {session.name}
              </span>
              <span className="rounded-full bg-emerald-800 px-2 py-0.5 text-[10px] font-bold text-white">
                ADMIN
              </span>
            </div>

            
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-6 lg:px-8 lg:py-8">
        {/* แถบต้อนรับ */}
        <section className="rounded-2xl bg-gradient-to-r from-[#174b3d] to-[#1d624b] px-6 py-7 text-white shadow-sm lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-emerald-50">
                Admin Workspace
              </span>

              <h2 className="mt-3 text-xl font-bold leading-relaxed sm:text-2xl">
                สวัสดีคุณ{session.name}, มีเคสใหม่รอตรวจสอบ 8 รายการ
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-emerald-100/80">
                ตรวจสอบเหตุการณ์เดือดร้อน มอบหมายงานเจ้าหน้าที่
                และติดตามระยะเวลาแก้ไขได้ตาม SLA
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/admin/reports"
                className="rounded-xl bg-white px-4 py-3 text-xs font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                📢 ดูรายการเรื่องร้องเรียนทั้งหมด
              </Link>

              <Link
                href="/admin/analytics"
                className="rounded-xl border border-white/20 px-4 py-3 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                ดูรายงานสรุป
              </Link>
            </div>
          </div>
        </section>

        {/* สถิติ */}
        <section
          aria-label="สถิติรายงาน"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((item) => (
            <article
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white bg-white p-5 shadow-sm"
            >
              <div>
                <h3 className="text-xs font-medium text-slate-500">
                  {item.label}
                </h3>

                <p
                  className={`mt-2 text-3xl font-extrabold ${item.valueColor}`}
                >
                  {item.value}
                </p>

                <p className={`mt-2 text-[11px] font-medium ${item.noteColor}`}>
                  {item.note}
                </p>
              </div>

              <div
                aria-hidden="true"
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-2xl ${item.iconColor}`}
              >
                {item.icon}
              </div>
            </article>
          ))}
        </section>

        {/* ตารางรายงาน */}
        <section className="overflow-hidden rounded-2xl bg-white p-5 shadow-sm lg:p-6">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                รายการแจ้งปัญหาที่รอการตรวจสอบและมอบหมาย
                <span className="ml-1 text-slate-500">
                  (Action Required)
                </span>
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                เรื่องที่ต้องได้รับการพิจารณาและมอบหมายเจ้าหน้าที่เพื่อจัดการต่อไป
              </p>
            </div>

            <div className="w-full sm:w-64 sm:shrink-0">
              <label htmlFor="report-search" className="sr-only">
                ค้นหารหัสเคส ปัญหา หรือสถานที่
              </label>
              <input
                id="report-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ค้นหารหัสเคส, ปัญหา, สถานที่..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {[
                    "รหัสเคส",
                    "หมวดหมู่ / รายละเอียดปัญหา",
                    "สถานที่เกิดเหตุ",
                    "ความเร่งด่วน",
                    "เวลาที่แจ้ง",
                    "สถานะ",
                    "การดำเนินการ",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-3 py-4 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="transition hover:bg-emerald-50/40"
                  >
                    <td className="whitespace-nowrap px-3 py-4 font-bold text-emerald-800">
                      #{report.id}
                    </td>

                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-800">
                        {report.icon} {report.title}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {report.description}
                      </p>
                    </td>

                    <td className="px-3 py-4 text-slate-600">
                      {report.location}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold ${
                          report.priority === "High"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {report.priority}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-slate-400">
                      {report.time}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold ${
                          report.status === "Pending"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-4">
                      <Link
                        href="/admin/reports"
                        className={`inline-flex rounded-lg border px-3 py-2 text-[11px] font-bold transition ${
                          report.status === "Pending"
                            ? "border-emerald-800 bg-emerald-800 text-white hover:bg-emerald-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        ไปจัดการรายงาน
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredReports.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      ไม่พบรายการที่ตรงกับการค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-[11px] text-slate-400">
            ข้อมูลตัวอย่างสำหรับแสดงหน้าตา Dashboard
          </p>
        </section>
      </main>
    </div>
  );
}