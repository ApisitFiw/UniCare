"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addIssueReport } from "@/lib/issueReports";

const categories = [
  "เสียงรบกวน",
  "ขยะ / ของเสีย",
  "น้ำ / น้ำเสีย",
  "อากาศ / มลพิษ",
  "แสงสว่าง",
  "ต้นไม้ / พื้นที่สีเขียว",
  "อื่น ๆ",
];

export default function ReportPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    reporterName: "",
    title: "",
    category: "",
    location: "",
    severity: "",
    description: "",
  });

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;
    setSubmitting(true);

    try {
      const report = addIssueReport({
        reporterName: form.reporterName.trim(),
        title: form.title.trim(),
        category: form.category,
        location: form.location.trim(),
        severity: form.severity,
        description: form.description.trim(),
      });

      router.push(`/report/detail?id=${encodeURIComponent(report.id)}`);
    } catch {
      alert("บันทึกรายงานไม่สำเร็จ กรุณาลองอีกครั้ง");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f8f6] px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href="/user/dashboard"
            className="text-sm font-medium text-emerald-800 hover:underline"
          >
            ← กลับหน้าหลัก
          </Link>

          <h1 className="mt-5 text-2xl font-bold text-[#155a49]">
            แจ้งปัญหาเสียงรบกวนและสิ่งแวดล้อม
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            กรุณากรอกรายละเอียดเพื่อให้เจ้าหน้าที่ตรวจสอบปัญหา
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="reporterName"
              className="mb-2 block text-sm font-medium"
            >
              ชื่อผู้แจ้ง
            </label>
            <input
              id="reporterName"
              required
              value={form.reporterName}
              onChange={(event) =>
                updateField("reporterName", event.target.value)
              }
              placeholder="กรอกชื่อของคุณ"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium">
              หัวข้อปัญหา
            </label>
            <input
              id="title"
              required
              value={form.title}
              onChange={(event) =>
                updateField("title", event.target.value)
              }
              placeholder="เช่น เสียงดังบริเวณหอพัก"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium"
              >
                ประเภทปัญหา
              </label>
              <select
                id="category"
                required
                value={form.category}
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-600"
              >
                <option value="">เลือกประเภทปัญหา</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="severity"
                className="mb-2 block text-sm font-medium"
              >
                ระดับความรุนแรง
              </label>
              <select
                id="severity"
                required
                value={form.severity}
                onChange={(event) =>
                  updateField("severity", event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-600"
              >
                <option value="">เลือกระดับความรุนแรง</option>
                <option value="เบา">เบา</option>
                <option value="ปานกลาง">ปานกลาง</option>
                <option value="มาก">มาก</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-2 block text-sm font-medium"
            >
              สถานที่เกิดปัญหา
            </label>
            <input
              id="location"
              required
              value={form.location}
              onChange={(event) =>
                updateField("location", event.target.value)
              }
              placeholder="เช่น อาคารเรียนรวม 1"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium"
            >
              รายละเอียดปัญหา
            </label>
            <textarea
              id="description"
              required
              rows={5}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="อธิบายปัญหาที่พบ ช่วงเวลา และข้อมูลที่เกี่ยวข้อง"
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#087765] px-6 py-3 font-medium text-white hover:bg-[#056052] disabled:opacity-50"
            >
              {submitting ? "กำลังส่ง..." : "ส่งเรื่องแจ้งปัญหา"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}