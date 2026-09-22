"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Report = {
  issue_id: number;
  title: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "In_Progress" | "Resolved" | "Closed";
  date_created: string;
  issue_categories: {
    category_name: string;
  } | null;
  issue_areas: {
    area_name: string;
  } | null;
};

const statusLabel: Record<Report["status"], string> = {
  Pending: "รอเจ้าหน้าที่รับเรื่อง",
  In_Progress: "กำลังดำเนินการ",
  Resolved: "แก้ไขแล้ว",
  Closed: "ปิดเรื่อง",
};

const severityLabel: Record<Report["severity"], string> = {
  Low: "เบา",
  Medium: "ปานกลาง",
  High: "มาก",
  Critical: "เร่งด่วน",
};

export default function ReportDetailPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReport() {
      const rawId = new URLSearchParams(
        window.location.search
      ).get("id");

      const issueId = Number(rawId);

      if (
        !rawId ||
        !Number.isSafeInteger(issueId) ||
        issueId <= 0
      ) {
        setError("หมายเลขรายงานไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        setError("กรุณาเข้าสู่ระบบก่อนดูรายงาน");
        setLoading(false);
        return;
      }

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
        .eq("issue_id", issueId)
        .maybeSingle();

      if (queryError) {
        setError(
          `โหลดรายงานไม่สำเร็จ: ${queryError.message}`
        );
      } else if (!data) {
        setError(
          "ไม่พบรายงาน หรือบัญชีนี้ไม่มีสิทธิ์ดูรายงาน"
        );
      } else {
        setReport(data as unknown as Report);
      }

      setLoading(false);
    }

    loadReport();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/user/dashboard"
          className="text-sm text-emerald-800 hover:underline"
        >
          ← กลับหน้าหลัก
        </Link>

        <section className="mt-5 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-emerald-900">
            รายละเอียดเรื่องแจ้งปัญหา
          </h1>

          {loading && (
            <p className="mt-5 text-slate-500">
              กำลังโหลด...
            </p>
          )}

          {!loading && error && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-4 text-red-700"
            >
              {error}
            </p>
          )}

          {!loading && report && (
            <div className="mt-6 space-y-4 text-sm">
              <div className="rounded-xl bg-emerald-50 p-4 text-emerald-900">
                หมายเลขรายงาน #{report.issue_id} ·{" "}
                {statusLabel[report.status] ?? report.status}
              </div>

              <Field
                label="หัวข้อ"
                value={report.title}
              />

              <Field
                label="ประเภท"
                value={
                  report.issue_categories?.category_name ??
                  "ไม่ระบุ"
                }
              />

              <Field
                label="สถานที่"
                value={
                  report.issue_areas?.area_name ??
                  "ไม่ระบุ"
                }
              />

              <Field
                label="ความรุนแรง"
                value={
                  severityLabel[report.severity] ??
                  report.severity
                }
              />

              <Field
                label="วันที่แจ้ง"
                value={new Date(
                  report.date_created
                ).toLocaleString("th-TH")}
              />

              <div>
                <strong>รายละเอียด</strong>
                <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-4">
                  {report.description}
                </p>
              </div>
            </div>
          )}

          <Link
            href="/report"
            className="mt-7 inline-block rounded-xl bg-emerald-700 px-5 py-3 text-sm text-white hover:bg-emerald-800"
          >
            แจ้งปัญหาใหม่
          </Link>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 border-b border-slate-100 pb-3 sm:grid-cols-[140px_1fr]">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}