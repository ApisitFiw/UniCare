"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDemoSession } from "@/lib/demoAuth";
import {
  getIssueReport,
  type IssueReport,
} from "@/lib/issueReports";
import Header from "@/components/Header";

function formatDate(value: string): string {
  if (!value) return "ไม่ได้ระบุ";

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  if (!Number.isFinite(date.getTime())) return "ไม่ได้ระบุ";

  return date.toLocaleDateString("th-TH", {
    dateStyle: "medium",
  });
}

function Attachment({ file }: { file: File }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 p-4">
      {url && file.type.startsWith("image/") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={file.name}
          className="mb-3 h-48 w-full rounded-lg object-contain"
        />
      )}

      {url && file.type.startsWith("audio/") && (
        <audio controls src={url} className="mb-3 w-full" />
      )}

      {url && file.type === "application/pdf" && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 inline-block text-sm text-emerald-700 underline"
        >
          เปิดดู PDF
        </a>
      )}

      <p className="break-all text-sm font-medium">{file.name}</p>

      <p className="mt-1 text-xs text-slate-500">
        {(file.size / 1024 / 1024).toFixed(2)} MB
      </p>

      {url && (
        <a
          href={url}
          download={file.name}
          className="mt-3 inline-block text-sm text-emerald-700 underline"
        >
          ดาวน์โหลดไฟล์
        </a>
      )}
    </div>
  );
}

export default function ReportDetailPage() {
  const router = useRouter();

  const [report, setReport] = useState<IssueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReport() {
      try {
        const session = getDemoSession();

        if (!session || session.role !== "user") {
          router.replace("/login");
          return;
        }

        const id = new URLSearchParams(
          window.location.search,
        ).get("id");

        if (!id?.trim()) {
          if (active) setError("ไม่พบรหัสรายงานใน URL");
          return;
        }

        const data = await getIssueReport(id);

        if (!active) return;

        // ตรวจผู้แจ้งสำหรับบัญชีทดลอง
        const validReporters = [
          session.name,
          "กิตติภูมิ",
          "กิตติภูมิ ปราชญนคร",
          "กิตติภูมิ ปราญนคร",
          "ผู้ใช้ทดลอง",
        ];
        if (!data || !validReporters.includes(data.reporter)) {
          setError("ไม่พบรายงานทดลองของบัญชีนี้ในเบราว์เซอร์");
          return;
        }

        setReport(data);
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "อ่านข้อมูลรายงานไม่สำเร็จ",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadReport();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f8f5] p-8">
        <p role="status" className="text-emerald-900">
          กำลังโหลดรายงาน...
        </p>
      </main>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#f3f8f5] text-slate-800">
        <Header
          title="รายละเอียดรายงานปัญหา"
          subtitle="UniCare · มหาวิทยาลัยวลัยลักษณ์"
          role="USER"
          backHref="/user/report"
        />
        <main className="px-4 py-8">
          <div className="mx-auto max-w-7xl rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h1 className="text-xl sm:text-2xl font-bold text-emerald-950">
              รายละเอียดรายงาน
            </h1>
            <p role="alert" className="mt-4 text-sm font-medium text-red-700">
              {error || "ไม่พบรายงาน"}
            </p>
            <Link
              href="/user/report"
              className="mt-5 inline-block rounded-xl bg-emerald-700 px-5 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 transition"
            >
              กลับหน้าแจ้งปัญหา
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const rows: [string, string][] = [
    ["ผู้แจ้ง", report.reporter],
    ["ประเภทปัญหา", report.category],

    ...(report.answers ?? []).map(
      (answer): [string, string] => [
        answer.label,
        answer.values.join(", "),
      ],
    ),

    ["สถานที่", report.location],
    [
      "จุดสังเกตเพิ่มเติม",
      report.locationDetail?.trim() || "ไม่ได้ระบุ",
    ],
    ["วันที่พบเหตุ", formatDate(report.occurredAt)],
    [
      "ตอนนี้ยังพบปัญหาอยู่หรือไม่",
      report.ongoing || "ไม่ได้ระบุในรายงานนี้",
    ],
    ["รายละเอียดเพิ่มเติม", report.additional?.trim() || "ไม่ได้ระบุ"],
    ["ความถี่ที่พบ", report.frequency],

    ...(report.frequency === "พบเป็นประจำ"
      ? ([
          [
            "มักพบช่วงไหน",
            report.commonPeriods?.join(", ") || "ไม่ได้ระบุ",
          ],
        ] as [string, string][])
      : []),

    [
      "ผลกระทบที่ได้รับ",
      (report.impacts ?? [])
        .map((impact) =>
          impact === "อื่น ๆ"
            ? `อื่น ๆ: ${report.impactOther}`
            : impact,
        )
        .join(", ") || "ไม่ได้ระบุ",
    ],

    ...(report.urgency
      ? ([
          ["ความเร่งด่วนที่ผู้แจ้งประเมิน", report.urgency],
        ] as [string, string][])
      : report.level
        ? ([
            ["ระดับผลกระทบที่ได้รับ (รายงานเดิม)", report.level],
          ] as [string, string][])
        : []),

    ...(report.urgency === "เร่งด่วนมาก"
      ? ([
          [
            "เหตุผลที่ต้องการให้ตรวจสอบทันที",
            report.urgencyReason || "ไม่ได้ระบุ",
          ],
        ] as [string, string][])
      : []),

    ["สถานะทดลอง", report.status],
    ["วันที่บันทึก", formatDate(report.createdAt)],
  ];

  const attachments = report.files ?? [];

  return (
    <div className="min-h-screen bg-[#f3f8f5] text-slate-800">
      <Header
        title="รายละเอียดรายงานปัญหา"
        subtitle="UniCare · มหาวิทยาลัยวลัยลักษณ์"
        role="USER"
        userName={report.reporter || "กิตติภูมิ"}
        backHref="/my-reports"
      />
      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <Link
            href="/my-reports"
            className="inline-block text-xs sm:text-sm font-medium text-emerald-700 hover:underline"
          >
            ← ดูรายการแจ้งปัญหาทั้งหมด
          </Link>

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs sm:text-sm font-bold text-emerald-700">
              {report.code}
            </p>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
              {report.status}
            </span>
          </div>

          <h1 className="mt-3 break-words text-xl sm:text-2xl font-bold text-emerald-950">
            {report.title}
          </h1>

          <p className="mt-3 text-xs sm:text-sm font-medium text-amber-800">
            รายงานทดลองที่บันทึกในเบราว์เซอร์นี้
            ยังไม่ได้ส่งถึงเจ้าหน้าที่
          </p>
        </header>

        <dl className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-6 shadow-sm">
          {rows.map(([label, value], index) => (
            <div
              key={`${label}-${index}`}
              className="grid gap-2 py-4 text-xs sm:text-sm sm:grid-cols-[210px_1fr]"
            >
              <dt className="text-slate-500 font-semibold">{label}</dt>
              <dd className="min-w-0 whitespace-pre-wrap break-words font-normal text-slate-800">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base sm:text-lg font-bold text-emerald-950">
            หลักฐานประกอบ
            <span className="ml-2 text-xs sm:text-sm font-normal text-slate-500">
              ({attachments.length} ไฟล์)
            </span>
          </h2>

          {attachments.length === 0 ? (
            <p className="text-sm text-slate-500">ไม่มีไฟล์แนบ</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {attachments.map((file, index) => (
                <Attachment
                  key={`${file.name}-${file.lastModified}-${index}`}
                  file={file}
                />
              ))}
            </div>
          )}
        </section>

        <Link
          href="/user/report"
          className="inline-block rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          + แจ้งปัญหาเพิ่มเติม
        </Link>
      </div>
    </main>
  </div>
);
}