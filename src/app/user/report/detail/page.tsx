"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getIssueReports,
  getStatusLabel,
  type IssueReport,
} from "@/lib/issueReports";

export default function ReportDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [report, setReport] = useState<IssueReport | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const found = getIssueReports().find((item) => item.id === id);
    setReport(found ?? null);
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return <main className="p-8">กำลังโหลด...</main>;
  }

  if (!report) {
    return (
      <main className="min-h-screen bg-[#f4f8f6] p-8">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center">
          <h1 className="text-xl font-bold">ไม่พบรายงาน</h1>
          <p className="mt-2 text-sm text-slate-500">
            กรุณาตรวจสอบลิงก์หรือส่งเรื่องแจ้งปัญหาใหม่
          </p>
          <Link
            href="/report"
            className="mt-5 inline-block rounded-xl bg-[#087765] px-5 py-2 text-white"
          >
            ไปหน้าแจ้งปัญหา
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f8f6] px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/user/dashboard"
          className="text-sm font-medium text-emerald-800 hover:underline"
        >
          ← กลับหน้าหลัก
        </Link>

        <div className="mt-5 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="mb-6 rounded-xl bg-emerald-50 p-5 text-center">
            <div className="text-3xl">✅</div>
            <h1 className="mt-2 text-xl font-bold text-[#155a49]">
              รายละเอียดเรื่องแจ้งปัญหา
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              หมายเลขรายงาน: {report.id}
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <Info label="หัวข้อ" value={report.title} />
            <Info label="ผู้แจ้ง" value={report.reporterName} />
            <Info label="ประเภท" value={report.category} />
            <Info label="สถานที่" value={report.location} />
            <Info label="ระดับความรุนแรง" value={report.severity} />
            <Info
              label="วันที่แจ้ง"
              value={new Date(report.createdAt).toLocaleString("th-TH")}
            />
            <Info
              label="สถานะ"
              value={getStatusLabel(report.status)}
            />

            {report.rejectReason && (
              <Info
                label="เหตุผลที่ไม่รับเรื่อง"
                value={report.rejectReason}
              />
            )}

            <div>
              <p className="font-semibold text-slate-600">รายละเอียด</p>
              <p className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 p-4">
                {report.description}
              </p>
            </div>
          </div>

          <div className="mt-7">
            <Link
              href="/report"
              className="inline-block rounded-xl bg-[#087765] px-5 py-3 text-white hover:bg-[#056052]"
            >
              แจ้งปัญหาอีกครั้ง
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 border-b border-slate-100 pb-3 sm:grid-cols-[160px_1fr]">
      <span className="font-semibold text-slate-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}