"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getDemoSession,
  type DemoSession,
} from "@/lib/authService";
import Header from "@/components/Header";
import {
  getAllCurrentIssues,
  type IssueItem,
} from "@/lib/issuesData";
import {
  Search,
  MapPin,
  ArrowRight,
  Clock,
  CheckCircle2,
  RotateCw,
  AlertTriangle,
  FolderOpen,
  Volume2,
  Trash2,
  Droplets,
  Wind,
  Lightbulb,
  Trees,
  ShieldCheck,
  Tag,
  ClipboardList,
  BarChart3,
} from "lucide-react";

function getCategoryIcon(category: string): ReactNode {
  if (category.includes("เสียง")) return <Volume2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  if (category.includes("ขยะ")) return <Trash2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  if (category.includes("น้ำ")) return <Droplets className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  if (category.includes("อากาศ") || category.includes("กลิ่น") || category.includes("ควัน")) return <Wind className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  if (category.includes("แสง") || category.includes("ไฟ")) return <Lightbulb className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  if (category.includes("ต้นไม้") || category.includes("กิ่งไม้") || category.includes("เขียว")) return <Trees className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  if (category.includes("ปลอดภัย") || category.includes("จราจร")) return <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  return <Tag className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
}

function parseIssueDateTime(rawDate: string): { date: string; time: string } {
  if (!rawDate) return { date: "-", time: "-" };

  // 1. ISO string with T (e.g. 2026-09-25T14:20:00.000Z)
  if (rawDate.includes("T")) {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      const d = parsed.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const t =
        parsed.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " น.";
      return { date: d, time: t };
    }
  }

  // 2. Text containing time pattern HH:mm or HH:mm น.
  const timeMatch = rawDate.match(/(\d{1,2}:\d{2}(?:\s*น\.)?)/);
  if (timeMatch) {
    const matchedTime = timeMatch[1].trim();
    const formattedTime = matchedTime.endsWith("น.")
      ? matchedTime
      : `${matchedTime} น.`;
    const datePart = rawDate
      .replace(timeMatch[0], "")
      .replace(/[\-–,]/g, "")
      .replace(/เวลา/g, "")
      .trim();
    return {
      date: datePart || "วันนี้",
      time: formattedTime,
    };
  }

  return { date: rawDate, time: "-" };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "resolved">("all");

  useEffect(() => {
    const updateSession = () => {
      const currentSession = getDemoSession();
      if (!currentSession || currentSession.role !== "admin") {
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
    const loadIssues = () => {
      setIssues(getAllCurrentIssues());
    };

    loadIssues();

    window.addEventListener("storage", loadIssues);
    window.addEventListener("unicare-demo-reports-updated", loadIssues);
    window.addEventListener("focus", loadIssues);

    return () => {
      window.removeEventListener("storage", loadIssues);
      window.removeEventListener("unicare-demo-reports-updated", loadIssues);
      window.removeEventListener("focus", loadIssues);
    };
  }, []);

  const totalCount = issues.length;
  const pendingCount = issues.filter((i) => i.status === "pending").length;
  const inProgressCount = issues.filter((i) => i.status === "in_progress").length;
  const resolvedCount = issues.filter((i) => i.status === "resolved").length;
  const resolvedRate = totalCount > 0 ? ((resolvedCount / totalCount) * 100).toFixed(1) : "0.0";

  const stats = [
    {
      label: "เรื่องร้องเรียนทั้งหมด",
      value: totalCount.toString(),
      note: "อัปเดตเรียลไทม์จากระบบติดตามสถานะ",
      icon: <ClipboardList className="h-6 w-6 text-emerald-700" />,
      valueColor: "text-slate-900",
      noteColor: "text-emerald-700",
      iconColor: "border-emerald-100 bg-emerald-50",
    },
    {
      label: "รอดำเนินการ / รอรับเรื่อง",
      value: pendingCount.toString(),
      note: pendingCount > 0 ? "• ต้องการการตรวจสอบและมอบหมาย" : "ไม่มีเคสค้าง",
      icon: <Clock className="h-6 w-6 text-rose-600" />,
      valueColor: "text-rose-600",
      noteColor: "text-rose-600",
      iconColor: "border-rose-100 bg-rose-50",
    },
    {
      label: "กำลังดำเนินการ (In Progress)",
      value: inProgressCount.toString(),
      note: "อยู่ระหว่างการปฏิบัติงานของเจ้าหน้าที่",
      icon: <RotateCw className="h-6 w-6 text-amber-600" />,
      valueColor: "text-amber-600",
      noteColor: "text-amber-600",
      iconColor: "border-amber-100 bg-amber-50",
    },
    {
      label: "แก้ไขเสร็จสิ้น (Resolved)",
      value: resolvedCount.toString(),
      note: `คิดเป็นความสำเร็จ ${resolvedRate}%`,
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
      valueColor: "text-emerald-700",
      noteColor: "text-emerald-700",
      iconColor: "border-emerald-100 bg-emerald-50",
    },
  ];

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchSearch =
        `${issue.id} ${issue.category} ${issue.area} ${issue.description} ${issue.adminName}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());
      const matchStatus = statusFilter === "all" || issue.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [issues, search, statusFilter]);

  const displayedIssues = useMemo(() => {
    return filteredIssues.slice(0, 10);
  }, [filteredIssues]);

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
      <Header
        title="ศูนย์ควบคุมและบริหารจัดการระบบ (Admin Dashboard)"
        subtitle="UniCare · มหาวิทยาลัยวลัยลักษณ์"
        role="ADMIN"
        userName={session.name}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-6 lg:px-8 lg:py-8">
        {/* แถบต้อนรับ */}
        <section className="rounded-2xl bg-gradient-to-r from-[#174b3d] to-[#1d624b] px-6 py-7 text-white shadow-sm lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-emerald-50">
                Admin Workspace
              </span>

              <h2 className="mt-3 text-xl font-bold leading-relaxed sm:text-2xl">
                สวัสดีคุณ{session.name}, มีเคสรอดำเนินการ {pendingCount} รายการ
              </h2>

              <p className="mt-2 text-xs sm:text-sm font-normal leading-relaxed text-emerald-100/90">
                ข้อมูลอิงจากระบบติดตามและจัดการสถานะ (ทั้งหมด {totalCount} เรื่อง · กำลังดำเนินการ {inProgressCount} เรื่อง · แก้ไขสำเร็จ {resolvedCount} เรื่อง)
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/admin/issues"
                className="rounded-xl bg-white px-4 py-3 text-xs font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-50 flex items-center gap-1.5"
              >
                <ClipboardList className="w-3.5 h-3.5 text-emerald-900 shrink-0" />
                <span>ไปที่ระบบติดตามและจัดการสถานะ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/admin/analytics"
                className="rounded-xl border border-white/20 px-4 py-3 text-xs font-semibold text-white transition hover:bg-white/10 flex items-center gap-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5 text-white shrink-0" />
                <span>ดูสถิติรายงานภาพรวม</span>
              </Link>
            </div>
          </div>
        </section>

        {/* สถิติ 4 ใบ */}
        <section
          aria-label="สถิติรายงาน"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((item) => (
            <article
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div>
                <h3 className="text-xs font-semibold text-slate-500">
                  {item.label}
                </h3>

                <p
                  className={`mt-2 text-2xl sm:text-3xl font-extrabold ${item.valueColor}`}
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

        {/* ตารางรายงานที่อิงจากข้อมูลจริงในระบบติดตามและจัดการสถานะ */}
        <section className="overflow-hidden rounded-2xl bg-white p-5 shadow-sm lg:p-6 border border-slate-200/60">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  รายการเรื่องร้องเรียนในระบบติดตามและจัดการสถานะ
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  แสดง {displayedIssues.length} จาก {filteredIssues.length} รายการล่าสุด
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                ข้อมูลสถานะจริงจากระบบติดตามและจัดการสถานะ (Status Tracking & Action Log) พร้อมอัปเดตและซิงค์ทันที
              </p>
            </div>

            {/* ค้นหา & แท็บตัวกรอง */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-white text-emerald-900 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ทั้งหมด ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === "pending"
                      ? "bg-white text-rose-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  รอดำเนินการ ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("in_progress")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === "in_progress"
                      ? "bg-white text-blue-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  กำลังดำเนินการ ({inProgressCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("resolved")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === "resolved"
                      ? "bg-white text-emerald-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  แก้ไขแล้ว ({resolvedCount})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ค้นหารหัส, ปัญหา, พื้นที่, ผู้รับผิดชอบ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-xs">
              <thead className="bg-[#f8faf9] text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="px-3 py-3.5">รหัสเคส</th>
                  <th className="px-3 py-3.5">หมวดหมู่ / รายละเอียดปัญหา</th>
                  <th className="px-3 py-3.5">สถานที่เกิดเหตุ</th>
                  <th className="px-3 py-3.5">ความเร่งด่วน</th>
                  <th className="px-3 py-3.5">วันที่แจ้ง</th>
                  <th className="px-3 py-3.5">เวลาที่แจ้ง</th>
                  <th className="px-3 py-3.5">สถานะปัจจุบัน</th>
                  <th className="px-3 py-3.5 text-center">จัดการสถานะ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {displayedIssues.map((report) => {
                  const { date, time } = parseIssueDateTime(report.date);

                  return (
                    <tr
                      key={report.id}
                      className="transition hover:bg-emerald-50/40"
                    >
                      <td className="whitespace-nowrap px-3 py-4 font-bold text-emerald-800">
                        <Link
                          href={`/admin/issues?issueId=${encodeURIComponent(report.id)}`}
                          className="hover:underline flex items-center gap-1 text-[#1b5e4a]"
                          title="คลิกเพื่อเปิด Modal ไทม์ไลน์และจัดการเคสนี้"
                        >
                          #{report.id}
                        </Link>
                      </td>

                      <td className="px-3 py-4 max-w-xs">
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{getCategoryIcon(report.category)}</span>
                          <span>{report.category}</span>
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed notranslate" data-user-content="true">
                          {report.description}
                        </p>
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="font-medium text-slate-700">{report.area}</span>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            report.urgency === "เร่งด่วนมาก"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : report.urgency === "เร่งด่วน"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {report.urgency || "ปกติ"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-slate-600 text-[11px] font-medium">
                        {date}
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-slate-400 text-[11px]">
                        {time}
                      </td>

                      <td className="px-3 py-4">
                        {report.status === "in_progress" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                            <span>กำลังดำเนินการ</span>
                          </span>
                        )}
                        {report.status === "pending" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>รอดำเนินการ</span>
                          </span>
                        )}
                        {report.status === "resolved" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>แก้ไขสำเร็จ</span>
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-center">
                        <Link
                          href={`/admin/issues?issueId=${encodeURIComponent(report.id)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1b5e4a] text-white hover:bg-[#144737] text-[11px] font-semibold transition shadow-xs cursor-pointer"
                          title="เปิดแก้ไขและบันทึกไทม์ไลน์ในระบบติดตามสถานะ"
                        >
                          <span>จัดการสถานะ</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {displayedIssues.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      ไม่พบเรื่องร้องเรียนที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            <span>แสดง 10 รายการล่าสุด</span>
            <Link
              href="/admin/issues"
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              <span>ไปที่หน้าระบบติดตามและจัดการสถานะแบบเต็ม</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}