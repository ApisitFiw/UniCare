"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Status =
  | "Pending"
  | "In_Progress"
  | "Resolved"
  | "Closed";

type Report = {
  issue_id: number;
  title: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: Status;
  date_created: string;
  issue_categories: {
    category_name: string;
  } | null;
  issue_areas: {
    area_name: string;
  } | null;
};

const statusLabel: Record<Status, string> = {
  Pending: "รอรับเรื่อง",
  In_Progress: "กำลังดำเนินการ",
  Resolved: "แก้ไขแล้ว",
  Closed: "ปิดเรื่อง",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<Status | "All">(
    "All"
  );
  const [selected, setSelected] = useState<Report | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(
    null
  );
  const [error, setError] = useState("");

  async function loadReports() {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("issue_reports")
      .select(`
        issue_id,
        title,
        description,
        severity,
        status,
        date_created,
        issue_categories (category_name),
        issue_areas (area_name)
      `)
      .order("issue_id", { ascending: false });

    if (queryError) {
      setError(
        `โหลดรายการไม่สำเร็จ: ${queryError.message}`
      );
    } else {
      setReports((data ?? []) as unknown as Report[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function updateStatus(
    report: Report,
    nextStatus: Status
  ) {
    const confirmed = window.confirm(
      `เปลี่ยนสถานะเรื่อง #${report.issue_id} เป็น "${statusLabel[nextStatus]}" หรือไม่?`
    );

    if (!confirmed) return;

    setSavingId(report.issue_id);
    setError("");

    const { error: updateError } = await supabase
      .from("issue_reports")
      .update({ status: nextStatus })
      .eq("issue_id", report.issue_id);

    if (updateError) {
      setError(
        `เปลี่ยนสถานะไม่สำเร็จ: ${updateError.message}`
      );
    } else {
      setReports((current) =>
        current.map((item) =>
          item.issue_id === report.issue_id
            ? { ...item, status: nextStatus }
            : item
        )
      );

      setSelected((current) =>
        current?.issue_id === report.issue_id
          ? { ...current, status: nextStatus }
          : current
      );
    }

    setSavingId(null);
  }

  const visibleReports = useMemo(
    () =>
      filter === "All"
        ? reports
        : reports.filter(
            (report) => report.status === filter
          ),
    [reports, filter]
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/dashboard"
          className="text-sm text-emerald-800 hover:underline"
        >
          ← กลับหน้า Admin
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">
              จัดการเรื่องร้องเรียน
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              ตรวจสอบและติดตามเรื่องที่ผู้ใช้แจ้งเข้ามา
            </p>
          </div>

          <select
            aria-label="กรองตามสถานะ"
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target.value as Status | "All"
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2"
          >
            <option value="All">ทุกสถานะ</option>
            <option value="Pending">รอรับเรื่อง</option>
            <option value="In_Progress">
              กำลังดำเนินการ
            </option>
            <option value="Resolved">แก้ไขแล้ว</option>
            <option value="Closed">ปิดเรื่อง</option>
          </select>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Summary
            label="เรื่องทั้งหมด"
            count={reports.length}
          />
          <Summary
            label="รอรับเรื่อง"
            count={
              reports.filter(
                (item) => item.status === "Pending"
              ).length
            }
          />
          <Summary
            label="กำลังดำเนินการ"
            count={
              reports.filter(
                (item) =>
                  item.status === "In_Progress"
              ).length
            }
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-6 space-y-4">
          {loading && (
            <p className="text-sm text-slate-500">
              กำลังโหลดรายการ...
            </p>
          )}

          {!loading && visibleReports.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
              ไม่มีเรื่องร้องเรียนในสถานะนี้
            </div>
          )}

          {!loading &&
            visibleReports.map((report) => (
              <article
                key={report.issue_id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">
                      #{report.issue_id}
                    </p>
                    <h2 className="mt-1 font-bold">
                      {report.title}
                    </h2>
                  </div>

                  <span className="h-fit rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
                    {statusLabel[report.status] ??
                      report.status}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {report.issue_categories
                    ?.category_name ?? "ไม่ระบุประเภท"}
                  {" · "}
                  {report.issue_areas?.area_name ??
                    "ไม่ระบุสถานที่"}
                  {" · "}
                  {new Date(
                    report.date_created
                  ).toLocaleString("th-TH")}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(report)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs hover:bg-slate-50"
                  >
                    ดูรายละเอียด
                  </button>

                  {report.status === "Pending" && (
                    <button
                      type="button"
                      disabled={
                        savingId === report.issue_id
                      }
                      onClick={() =>
                        updateStatus(
                          report,
                          "In_Progress"
                        )
                      }
                      className="rounded-lg bg-emerald-700 px-4 py-2 text-xs text-white disabled:opacity-50"
                    >
                      รับเรื่อง
                    </button>
                  )}

                  {report.status ===
                    "In_Progress" && (
                    <button
                      type="button"
                      disabled={
                        savingId === report.issue_id
                      }
                      onClick={() =>
                        updateStatus(
                          report,
                          "Resolved"
                        )
                      }
                      className="rounded-lg bg-blue-700 px-4 py-2 text-xs text-white disabled:opacity-50"
                    >
                      แก้ไขแล้ว
                    </button>
                  )}

                  {report.status === "Resolved" && (
                    <button
                      type="button"
                      disabled={
                        savingId === report.issue_id
                      }
                      onClick={() =>
                        updateStatus(
                          report,
                          "Closed"
                        )
                      }
                      className="rounded-lg bg-slate-700 px-4 py-2 text-xs text-white disabled:opacity-50"
                    >
                      ปิดเรื่อง
                    </button>
                  )}
                </div>
              </article>
            ))}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="รายละเอียดเรื่องร้องเรียน"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-xs text-emerald-700">
                  #{selected.issue_id}
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  {selected.title}
                </h2>
              </div>

              <button
                type="button"
                aria-label="ปิด"
                onClick={() => setSelected(null)}
                className="text-xl text-slate-500"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <p>
                <strong>ประเภท:</strong>{" "}
                {selected.issue_categories
                  ?.category_name ?? "ไม่ระบุ"}
              </p>

              <p>
                <strong>สถานที่:</strong>{" "}
                {selected.issue_areas?.area_name ??
                  "ไม่ระบุ"}
              </p>

              <p>
                <strong>ความรุนแรง:</strong>{" "}
                {selected.severity}
              </p>

              <p>
                <strong>สถานะ:</strong>{" "}
                {statusLabel[selected.status] ??
                  selected.status}
              </p>

              <div>
                <strong>รายละเอียด:</strong>
                <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-4">
                  {selected.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Summary({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-emerald-900">
        {count}
      </p>
    </div>
  );
}