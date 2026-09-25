"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
  MapPin,
  RotateCw,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import Header from "@/components/Header";
import { addNotification } from "@/lib/notifications";
import { getCurrentAdminDisplayName, getAdminInitials } from "@/lib/issuesData";

type Status = "Pending" | "In_Progress" | "Resolved" | "Closed";
type Severity = "Low" | "Medium" | "High" | "Critical";

type Report = {
  issue_id: number;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  date_created: string;
  reporter_name?: string | null;
  reporter_email?: string | null;
  admin_name?: string | null;
  adminName?: string | null;
  adminInitial?: string | null;
  evidence_count?: number;
  issue_categories: { category_name: string } | null;
  issue_areas: { area_name: string } | null;
};

const statusLabel: Record<Status, string> = {
  Pending: "รอรับเรื่อง",
  In_Progress: "รับเรื่องแล้ว",
  Resolved: "แก้ไขแล้ว",
  Closed: "ปิดเรื่อง",
};

const severityStyle: Record<
  Severity,
  { label: string; className: string }
> = {
  Low: {
    label: "ต่ำ",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  Medium: {
    label: "เร่งด่วน",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  High: {
    label: "เร่งด่วนมาก",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  Critical: {
    label: "วิกฤต",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

// Demo Mode: หน้า User และ Admin ต้องใช้ key เดียวกัน
const DEMO_REPORTS_KEY = "unicare_demo_issue_reports";

const demoReports: Report[] = [
  {
    issue_id: 908,
    title: "เสียงรบกวน",
    description: "มีการเปิดเพลงเสียงดังบริเวณหอพักในช่วงกลางคืน",
    severity: "High",
    status: "Pending",
    date_created: "2026-09-08T20:30:00.000Z",
    reporter_name: "สมชาย ใจดี",
    reporter_email: "somchai@example.com",
    evidence_count: 2,
    issue_categories: { category_name: "เสียงรบกวน" },
    issue_areas: { area_name: "อาคารเรียนรวม" },
  },
  {
    issue_id: 907,
    title: "ขยะ / ของเสีย",
    description: "พบขยะตกค้างบริเวณโรงอาหารและมีกลิ่นรบกวน",
    severity: "Medium",
    status: "Pending",
    date_created: "2026-09-07T10:15:00.000Z",
    reporter_name: "นภัสสร แสงทอง",
    reporter_email: "napatsorn@example.com",
    evidence_count: 1,
    issue_categories: { category_name: "ขยะ / ของเสีย" },
    issue_areas: { area_name: "โรงอาหาร" },
  },
];

function readDemoReports(): Report[] {
  const saved = window.localStorage.getItem(DEMO_REPORTS_KEY);

  if (!saved) {
    window.localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(demoReports));
    return demoReports;
  }

  try {
    const parsed = JSON.parse(saved) as Report[];
    return Array.isArray(parsed) ? parsed : demoReports;
  } catch {
    window.localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(demoReports));
    return demoReports;
  }
}

function saveDemoReports(reports: Report[]) {
  window.localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(reports));
  window.dispatchEvent(new Event("unicare-demo-reports-updated"));
}

export default function AdminIssuesPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<Status | "All">("Pending");
  const [selected, setSelected] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadReports = useCallback((showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    const nextReports = readDemoReports().sort(
      (a, b) =>
        new Date(b.date_created).getTime() - new Date(a.date_created).getTime(),
    );
    setReports(nextReports);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReports();

    const refreshReports = () => loadReports(false);
    window.addEventListener("storage", refreshReports);
    window.addEventListener("unicare-demo-reports-updated", refreshReports);

    return () => {
      window.removeEventListener("storage", refreshReports);
      window.removeEventListener("unicare-demo-reports-updated", refreshReports);
    };
  }, [loadReports]);

  function updateStatus(report: Report, nextStatus: Status) {
    const isReject = nextStatus === "Closed";
    const isAccept = nextStatus === "In_Progress";

    const displayId = String(report.issue_id).startsWith("ISS-")
      ? String(report.issue_id)
      : `ISS-2026-${String(report.issue_id).padStart(3, "0")}`;
    const categoryName = report.issue_categories?.category_name || report.title || "ทั่วไป";

    const confirmMessage = isReject
      ? `คุณต้องการ "ปฏิเสธ" คำร้องเรียน #${displayId} (${categoryName}) หรือไม่?\n(คำร้องจะออกจากรายการใหม่ และระบบจะแจ้งเตือนไปยังผู้ใช้)`
      : isAccept
      ? `คุณต้องการ "รับเรื่อง" คำร้องเรียน #${displayId} (${categoryName}) หรือไม่?\n(ระบบจะส่งการแจ้งเตือนและนำเรื่องเข้าสู่ระบบติดตามสถานะ)`
      : `เปลี่ยนสถานะเรื่อง #${displayId} เป็น “${statusLabel[nextStatus]}” หรือไม่?`;

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setSavingId(report.issue_id);
    setError("");

    const actingAdminName = getCurrentAdminDisplayName();
    const actingAdminInitials = getAdminInitials(actingAdminName);

    const nextReports = reports.map((item) =>
      item.issue_id === report.issue_id
        ? {
            ...item,
            status: nextStatus,
            admin_name: isAccept ? actingAdminName : item.admin_name,
            adminName: isAccept ? actingAdminName : item.adminName,
            adminInitial: isAccept ? actingAdminInitials : item.adminInitial,
          }
        : item,
    );
    setReports(nextReports);
    saveDemoReports(nextReports);

    // 1. ส่งการแจ้งเตือนในกระดิ่งเมื่อถูกปฏิเสธ
    if (isReject) {
      addNotification({
        title: "ปัญหาถูกปฏิเสธ",
        description: `คำร้องเรียน #${displayId} (${categoryName}) ได้รับการตรวจสอบและปฏิเสธโดย ${actingAdminName}`,
        type: "urgent",
        isRead: false,
        link: "/my-reports",
        targetRole: "user",
        targetEmail: report.reporter_email || undefined,
        targetName: report.reporter_name || undefined,
        issueId: String(displayId),
      });
    }

    // 2. ส่งการแจ้งเตือนในกระดิ่งเมื่อรับเรื่อง พร้อมสร้างไทม์ไลน์เริ่มต้น
    if (isAccept) {
      addNotification({
        title: "เจ้าหน้าที่รับเรื่องร้องเรียนแล้ว",
        description: `คำร้องเรียน #${displayId} (${categoryName}) ได้รับการรับเรื่องโดย ${actingAdminName} และส่งต่อไปยังระบบติดตามสถานะ`,
        type: "status",
        isRead: false,
        link: "/my-reports",
        targetRole: "user",
        targetEmail: report.reporter_email || undefined,
        targetName: report.reporter_name || undefined,
        issueId: String(displayId),
      });

      try {
        const savedTimeline = window.localStorage.getItem("unicare_demo_timeline_history");
        const timelineObj = savedTimeline ? JSON.parse(savedTimeline) : {};
        const now = new Date();
        const thaiDate =
          now.toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }) + " น.";

        timelineObj[displayId] = [
          {
            statusText: "รับเรื่องร้องเรียน (Accepted)",
            time: thaiDate,
            note: `เจ้าหน้าที่ ${actingAdminName} เข้าตรวจสอบข้อมูลเบื้องต้นและกดรับเรื่องร้องเรียน พร้อมส่งต่อไปยังระบบติดตามสถานะการแก้ไข`,
            author: actingAdminName,
            color: "bg-blue-600",
          },
          ...(timelineObj[displayId] || [
            {
              statusText: "สร้างเรื่องร้องเรียน (Reported)",
              time:
                new Date(report.date_created).toLocaleDateString("th-TH", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) + " น.",
              note: report.description || "ผู้ใช้งานแจ้งเรื่องร้องเรียนผ่านระบบ UNICARE",
              author: report.reporter_name || "ผู้ใช้งานระบบ",
              color: "bg-amber-500",
            },
          ]),
        ];
        window.localStorage.setItem("unicare_demo_timeline_history", JSON.stringify(timelineObj));
      } catch {
        // ignore
      }
    }

    setSelected((current) =>
      current?.issue_id === report.issue_id
        ? { ...current, status: nextStatus }
        : current,
    );

    setSavingId(null);
  }

  const counts = useMemo(
    () => ({
      all: reports.length,
      pending: reports.filter((item) => item.status === "Pending").length,
      accepted: reports.filter((item) => item.status === "In_Progress").length,
      finished: reports.filter(
        (item) => item.status === "Resolved" || item.status === "Closed",
      ).length,
    }),
    [reports],
  );

  const visibleReports = useMemo(
    () =>
      filter === "All"
        ? reports
        : reports.filter((report) => report.status === filter),
    [filter, reports],
  );

  const currentAdmin = getCurrentAdminDisplayName().replace(/\(Admin\)/g, '').trim();

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-800">
      <Header
        title="จัดการคำร้องเรียน"
        subtitle="มหาวิทยาลัยวลัยลักษณ์"
        userName={currentAdmin}
        role="ADMIN"
      />

        <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              active={filter === "Pending"}
              icon={<ClipboardList className="h-5 w-5" />}
              iconClass="bg-sky-50 text-sky-600"
              label="คำร้องใหม่"
              description="รอเจ้าหน้าที่ตรวจสอบ"
              count={counts.pending}
              onClick={() => setFilter("Pending")}
            />
            <SummaryCard
              active={filter === "In_Progress"}
              icon={<CheckCircle2 className="h-5 w-5" />}
              iconClass="bg-emerald-50 text-emerald-600"
              label="รับเรื่องแล้ว"
              description="กำลังดำเนินการ"
              count={counts.accepted}
              onClick={() => setFilter("In_Progress")}
            />
            <SummaryCard
              active={filter === "Resolved"}
              icon={<XCircle className="h-5 w-5" />}
              iconClass="bg-rose-50 text-rose-500"
              label="เสร็จสิ้น / ปิดเรื่อง"
              description="ดำเนินการเรียบร้อย"
              count={counts.finished}
              onClick={() => setFilter("Resolved")}
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between sm:px-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  รายการเรื่องร้องเรียนและประวัติสถานะ (Issue Reports)
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  คลิกดูรายละเอียดของคำร้อง หรือกดปุ่มอัปเดตสถานะ
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  aria-label="กรองตามสถานะ"
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value as Status | "All")
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                >
                  <option value="All">ทุกสถานะ ({counts.all})</option>
                  <option value="Pending">รอรับเรื่อง</option>
                  <option value="In_Progress">รับเรื่องแล้ว</option>
                  <option value="Resolved">แก้ไขแล้ว</option>
                </select>

                <button
                  type="button"
                  onClick={() => loadReports()}
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
                  title="โหลดข้อมูลใหม่"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {error && (
              <p className="m-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </p>
            )}

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                กำลังโหลดรายการ...
              </div>
            ) : visibleReports.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">
                ไม่มีเรื่องร้องเรียนในสถานะนี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                    <tr>
                      <th className="px-5 py-4">รหัสเคส / วันที่</th>
                      <th className="px-5 py-4">หมวดหมู่</th>
                      <th className="px-5 py-4">ระดับความเร่งด่วน</th>
                      <th className="px-5 py-4">ดูรายละเอียด</th>
                      <th className="px-5 py-4">จัดการสถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleReports.map((report) => {
                      const busy = savingId === report.issue_id;
                      const severity =
                        severityStyle[report.severity] ?? severityStyle.Low;

                      return (
                        <tr key={report.issue_id} className="align-middle transition hover:bg-slate-50/70">
                          <td className="px-5 py-5">
                            <p className="text-xs font-extrabold text-emerald-800">
                              #ISS-{new Date(report.date_created).getFullYear()}-
                              {String(report.issue_id).padStart(3, "0")}
                            </p>
                            <p className="mt-1 text-[11px] leading-4 text-slate-400">
                              {new Date(report.date_created).toLocaleDateString("th-TH", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                              <br />
                              {new Date(report.date_created).toLocaleTimeString("th-TH", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <p className="text-xs font-semibold text-slate-700">
                              {report.issue_categories?.category_name || report.title}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                              <MapPin className="h-3.5 w-3.5 text-rose-500" />
                              {report.issue_areas?.area_name || "ไม่ระบุสถานที่"}
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${severity.className}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {severity.label}
                            </span>
                          </td>

                          <td className="px-5 py-5">
                            <button
                              type="button"
                              onClick={() => setSelected(report)}
                              className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              ดูรายละเอียด
                            </button>
                          </td>

                          <td className="px-5 py-5">
                            <div className="flex flex-wrap gap-2">
                              {report.status === "Pending" && (
                                <>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => updateStatus(report, "Closed")}
                                    className="flex items-center gap-1 rounded-full bg-rose-500 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-rose-600 disabled:opacity-50"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    ปฏิเสธ
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => updateStatus(report, "In_Progress")}
                                    className="flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                                  >
                                    {busy ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                    รับเรื่อง
                                  </button>
                                </>
                              )}

                              {report.status === "In_Progress" && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => updateStatus(report, "Resolved")}
                                  className="rounded-full bg-blue-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"
                                >
                                  แก้ไขแล้ว
                                </button>
                              )}

                              {report.status === "Resolved" && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => updateStatus(report, "Closed")}
                                  className="rounded-full bg-slate-700 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"
                                >
                                  ปิดเรื่อง
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="รายละเอียดคำร้อง"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  รายละเอียดคำร้อง
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-emerald-700">
                  #ISS-{new Date(selected.date_created).getFullYear()}-
                  {String(selected.issue_id).padStart(3, "0")}
                </h2>
              </div>
              <button
                type="button"
                aria-label="ปิด"
                onClick={() => setSelected(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[11px] text-slate-400">ประเภทปัญหา</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">
                      {selected.issue_categories?.category_name || selected.title}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard
                  icon={<UserRound className="h-4 w-4" />}
                  label="ผู้แจ้ง"
                  value={selected.reporter_name || "ผู้ใช้งานระบบ"}
                />
                <InfoCard
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="ผู้รับผิดชอบ"
                  value={
                    selected.admin_name ||
                    selected.adminName ||
                    (selected.status === "Pending"
                      ? "ยังไม่มีผู้รับผิดชอบ (รอรับเรื่อง)"
                      : getCurrentAdminDisplayName())
                  }
                />
                <InfoCard
                  icon={<MapPin className="h-4 w-4" />}
                  label="สถานที่"
                  value={selected.issue_areas?.area_name || "ไม่ระบุสถานที่"}
                />
                <InfoCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="วันที่แจ้ง"
                  value={new Date(selected.date_created).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                />
                <InfoCard
                  icon={<XCircle className="h-4 w-4" />}
                  label="ระดับความรุนแรง"
                  value={`● ${severityStyle[selected.severity]?.label || selected.severity}`}
                  valueClass={severityStyle[selected.severity]?.className.split(" ").find((item) => item.startsWith("text-"))}
                />
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  รายละเอียดปัญหาจากผู้ใช้งาน
                </h3>
                <p className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {selected.description}
                </p>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <FolderOpen className="h-4 w-4 text-emerald-600" />
                  หลักฐานประกอบ
                </h3>
                <div className="mt-2 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <FolderOpen className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        หลักฐานแนบ {selected.evidence_count ?? 0} ไฟล์
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        รูปภาพและไฟล์เสียงประกอบคำร้อง
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      window.alert(
                        (selected.evidence_count ?? 0) > 0
                          ? `โหมดทดลอง: มีหลักฐาน ${selected.evidence_count} ไฟล์`
                          : "คำร้องนี้ยังไม่มีไฟล์หลักฐาน",
                      )
                    }
                    className="flex items-center justify-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-800"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    ดูหลักฐานทั้งหมด
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg bg-emerald-700 px-8 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  active,
  icon,
  iconClass,
  label,
  description,
  count,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  iconClass: string;
  label: string;
  description: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-emerald-500 ring-1 ring-emerald-100" : "border-slate-200"
      }`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-700">{label}</span>
        <span className="block text-[11px] text-slate-400">{description}</span>
      </span>
      <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{count}</span>
    </button>
  );
}

function InfoCard({
  icon,
  label,
  value,
  valueClass = "text-slate-700",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-400">{label}</p>
          <p className={`mt-1 truncate text-xs font-bold ${valueClass}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
