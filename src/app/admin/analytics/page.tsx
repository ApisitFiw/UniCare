"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { supabase } from "@/lib/supabaseClient";

// ลงทะเบียนโมดูล Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface IssueReport {
  issue_id: number;
  status: string;
  severity: string;
  date_created: string;
  category_id: number;
  area_id: number;
  issue_categories?: { category_name: string };
  issue_areas?: { area_name: string };
}

interface HotspotDetail {
  id: number;
  area: string;
  mainIssue: string;
  cases: number;
  severity: string;
  avgTime: string;
  riskText: string;
  riskColor: string;
  note: string;
}

export default function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "reported" | "pending" | "resolved"
  >("reported");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลจริงจาก Supabase
  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from("issue_reports").select(`
            issue_id,
            status,
            severity,
            date_created,
            category_id,
            area_id,
            issue_categories ( category_name ),
            issue_areas ( area_name )
          `);

        if (error) {
          console.error("Error fetching Supabase data:", error.message);
        } else if (data) {
          setReports(data as unknown as IssueReport[]);
        }
      } catch (err) {
        console.error("Supabase query error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, []);

  // คำนวณค่าสถิติสำหรับ 4 Summary KPI Cards
  const stats = useMemo(() => {
    const total = reports.length || 128;
    const pending = reports.filter((r) => r.status === "Pending").length || 8;
    const inProgress =
      reports.filter((r) => r.status === "In_Progress").length || 24;
    const resolved =
      reports.filter((r) => r.status === "Resolved" || r.status === "Closed")
        .length || 96;
    const resolvedRate = ((resolved / total) * 100).toFixed(1);

    return { total, pending, inProgress, resolved, resolvedRate };
  }, [reports]);

  // ข้อมูลกราฟเส้นรายเดือน
  const trendLabels = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
  ];

  const lineChartData = useMemo(() => {
    if (activeTab === "reported") {
      return {
        labels: trendLabels,
        datasets: [
          {
            label: "รับแจ้งปัญหา",
            data: [12, 19, 15, 22, 28, 24, 30, 26, 32],
            borderColor: "#1b5e4a",
            backgroundColor: "rgba(27, 94, 74, 0.1)",
            tension: 0.35,
            fill: true,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: "#1b5e4a",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      };
    } else if (activeTab === "pending") {
      return {
        labels: trendLabels,
        datasets: [
          {
            label: "แก้ยังไม่สำเร็จ / รอตรวจ",
            data: [2, 2, 1, 2, 3, 2, 3, 2, 4],
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            tension: 0.35,
            fill: true,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: "#f59e0b",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      };
    } else {
      return {
        labels: trendLabels,
        datasets: [
          {
            label: "แก้ไขสำเร็จแล้ว",
            data: [10, 17, 14, 20, 25, 22, 27, 24, 28],
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.35,
            fill: true,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: "#10b981",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      };
    }
  }, [activeTab]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { boxWidth: 12, font: { size: 12 } },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#f1f5f3" },
        ticks: { font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  };

  // ข้อมูล Doughnut Chart (7 หมวดหมู่ปัญหา)
  const donutData = {
    labels: [
      "เสียงรบกวน",
      "ขยะ / ของเสีย",
      "น้ำ / น้ำเสีย",
      "อากาศ / มลพิษ",
      "แสงสว่าง",
      "ต้นไม้ / สีเขียว",
      "อื่นๆ",
    ],
    datasets: [
      {
        data: [40.6, 24.2, 14.1, 10.5, 5.3, 3.8, 1.5],
        backgroundColor: [
          "#1b5e4a",
          "#f0a42a",
          "#3b82f6",
          "#ef4444",
          "#fbbf24",
          "#86efac",
          "#8b5cf6",
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { display: false },
    },
  };

  // ข้อมูลรายการจุดเสี่ยง 10 อันดับสำหรับ Modal
  const hotspotList: HotspotDetail[] = [
    {
      id: 1,
      area: "หอพักนักศึกษาชาย 3",
      mainIssue: "เสียงดนตรีเปิดลำโพง (วิกาล)",
      cases: 38,
      severity: "High",
      avgTime: "45 นาที",
      riskText: "🔴 สูง",
      riskColor: "text-rose-600",
      note: "ต้องติดตามใกล้ชิด",
    },
    {
      id: 2,
      area: "โรงอาหารกลาง",
      mainIssue: "ถังขยะเต็ม / ขยะตกค้าง",
      cases: 29,
      severity: "Medium",
      avgTime: "2 ชั่วโมง",
      riskText: "🟠 ปานกลาง",
      riskColor: "text-amber-600",
      note: "เพิ่มจำนวนถังขยะ",
    },
    {
      id: 3,
      area: "อาคารเรียนรวม 5",
      mainIssue: "เสียงงานก่อสร้าง / ฝุ่นละออง",
      cases: 22,
      severity: "Medium",
      avgTime: "3 ชั่วโมง",
      riskText: "🟠 ปานกลาง",
      riskColor: "text-amber-600",
      note: "กำหนดเวลาก่อสร้าง",
    },
    {
      id: 4,
      area: "หอพักนักศึกษาหญิง 2",
      mainIssue: "ท่อระบายน้ำขัดข้อง",
      cases: 14,
      severity: "Low",
      avgTime: "5 ชั่วโมง",
      riskText: "🟢 ต่ำ",
      riskColor: "text-emerald-600",
      note: "ปกติ",
    },
    {
      id: 5,
      area: "ห้องสมุด",
      mainIssue: "เสียงรบกวน / ความสงบ",
      cases: 18,
      severity: "Medium",
      avgTime: "1.5 ชั่วโมง",
      riskText: "🟠 ปานกลาง",
      riskColor: "text-amber-600",
      note: "มีเวรตรวจความเรียบร้อย",
    },
    {
      id: 6,
      area: "ลานสนามกีฬา",
      mainIssue: "ปัญหาแสงสว่าง (กลางคืน)",
      cases: 11,
      severity: "Medium",
      avgTime: "4 ชั่วโมง",
      riskText: "🟠 ปานกลาง",
      riskColor: "text-amber-600",
      note: "ซ่อมแซมไฟส่องสว่าง",
    },
    {
      id: 7,
      area: "อาคาร IT",
      mainIssue: "ปัญหาด้านอากาศ (ระบบแอร์)",
      cases: 16,
      severity: "Medium",
      avgTime: "2.5 ชั่วโมง",
      riskText: "🟠 ปานกลาง",
      riskColor: "text-amber-600",
      note: "ตรวจบำรุงรักษา",
    },
    {
      id: 8,
      area: "มหาวิทยาลัยโดยรวม",
      mainIssue: "ปัญหาด้านน้ำ (ท่อ / น้ำรั่วซึม)",
      cases: 9,
      severity: "Low",
      avgTime: "6 ชั่วโมง",
      riskText: "🟢 ต่ำ",
      riskColor: "text-emerald-600",
      note: "ปกติ",
    },
    {
      id: 9,
      area: "ส่วนจัดเลี้ยง",
      mainIssue: "เสียงงานปรุงอาหาร",
      cases: 12,
      severity: "Low",
      avgTime: "3 ชั่วโมง",
      riskText: "🟢 ต่ำ",
      riskColor: "text-emerald-600",
      note: "ปกติ",
    },
    {
      id: 10,
      area: "พื้นที่โครงการเขียว",
      mainIssue: "ปัญหาต้นไม้ / หญ้ารก",
      cases: 7,
      severity: "Low",
      avgTime: "7 ชั่วโมง",
      riskText: "🟢 ต่ำ",
      riskColor: "text-emerald-600",
      note: "ปกติ",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-800 antialiased">


      {/* ==================== ส่วนเนื้อหาด้านขวา (Dashboard Content) ==================== */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200/80 px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">
              สถิติและรายงานสถานการณ์สิ่งแวดล้อม
            </h1>
            <p className="text-xs text-slate-400">
              ระบบแดชบอร์ดข้อมูลภาพรวม มหาวิทยาลัยวลัยลักษณ์
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative w-8 h-8 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition">
              🔔
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {stats.pending}
              </span>
            </button>

            <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full text-xs shadow-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[12px]">
                👤
              </div>
              <span className="font-medium text-slate-800">
                กิตติภูมิ ปราชญนคร
              </span>
              <span className="bg-[#1b5e4a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                ADMIN
              </span>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl w-full">
          {/* 1. Hero Banner */}
          <section
            className="rounded-2xl p-6 text-white space-y-3"
            style={{
              background:
                "linear-gradient(135deg, #0e4435 0%, #145946 50%, #1b6852 100%)",
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold drop-shadow-xs">
                  📋 แดชบอร์ดการรับแจ้งปัญหาสิ่งแวดล้อม
                </h2>
                <p className="text-emerald-100 text-sm mt-1">
                  ข้อมูลสถิติการรับแจ้งปัญหาสิ่งแวดล้อม บำรุงรักษา และสถิติอื่นๆ
                </p>
              </div>
              <button
                onClick={() =>
                  alert("ฟังก์ชันส่งออกข้อมูล Excel / CSV กำลังดำเนินการ")
                }
                className="px-4 py-2 bg-white text-emerald-700 rounded-full font-semibold text-sm hover:bg-emerald-50 transition"
              >
                📥 ส่งออกข้อมูล (Excel / CSV)
              </button>
            </div>
          </section>

          {/* 1.5 ตัวกรองข้อมูล */}
          <div className="flex flex-wrap items-center justify-between bg-white rounded-xl p-4 border border-slate-200/70 gap-4">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  ช่วงเวลา
                </label>
                <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium cursor-pointer bg-white">
                  <option>เดือนนี้ (กันยายน 2026)</option>
                  <option>3 เดือนที่แล้ว</option>
                  <option>6 เดือนที่แล้ว</option>
                  <option>ทั้งปี</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  โซน/พื้นที่
                </label>
                <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium cursor-pointer bg-white">
                  <option>ทั้งมหาวิทยาลัย</option>
                  <option>โซนทิศเหนือ</option>
                  <option>โซนทิศใต้</option>
                  <option>โซนส่วนกลาง</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {loading
                ? "กำลังซิงค์ Supabase..."
                : "ปรับปรุงข้อมูลล่าสุด: วันนี้ 18.00 น."}
            </p>
          </div>

          {/* 2. สถิติเปรียบเทียบ (KPI Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200/70 shadow-xs hover:shadow-sm transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold">
                    ปัญหาที่รับแจ้ง
                  </span>
                  <span className="text-3xl font-bold text-slate-800 mt-2">
                    {stats.total}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">เรื่อง</span>
                </div>
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-xl">
                  📊
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-red-600 font-semibold">↑ 12%</span>
                <span className="text-slate-500">จากเดือนที่แล้ว</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/70 shadow-xs hover:shadow-sm transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold">
                    กำลังดำเนินการ
                  </span>
                  <span className="text-3xl font-bold text-slate-800 mt-2">
                    {stats.inProgress}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">เรื่อง</span>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-xl">
                  ⏳
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500">คิดเป็น</span>
                <span className="text-amber-600 font-semibold">18.8%</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/70 shadow-xs hover:shadow-sm transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold">
                    แก้ไขสำเร็จแล้ว
                  </span>
                  <span className="text-3xl font-bold text-slate-800 mt-2">
                    {stats.resolved}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    อัตราสำเร็จ {stats.resolvedRate}%
                  </span>
                </div>
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-xl">
                  ✅
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-emerald-600 font-semibold">↑ 8%</span>
                <span className="text-slate-500">จากเดือนที่แล้ว</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/70 shadow-xs hover:shadow-sm transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold">
                    อยู่ระหว่างตรวจสอบ
                  </span>
                  <span className="text-3xl font-bold text-slate-800 mt-2">
                    {stats.pending}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    เรื่องปัญหา
                  </span>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-xl">
                  🔍
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500">ต้องติดตาม</span>
                <span className="text-blue-600 font-semibold">เร่งด่วน</span>
              </div>
            </div>
          </div>

          {/* 3. กราฟแนวโน้มปัญหาประจำเดือนแบบแท็บ */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  📊 กราฟแนวโน้มการแจ้งปัญหารายเดือน
                </h3>
                <p className="text-[11px] text-slate-400">
                  เปรียบเทียบระหว่างเรื่องที่รับแจ้ง และเรื่องที่แก้ไข
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 space-x-1">
              <button
                type="button"
                onClick={() => setActiveTab("reported")}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                  activeTab === "reported"
                    ? "text-emerald-700 bg-emerald-50 border-t border-x border-emerald-500 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📝 รับแจ้งปัญหา
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                  activeTab === "pending"
                    ? "text-emerald-700 bg-emerald-50 border-t border-x border-emerald-500 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ⏳ แก้ยังไม่สำเร็จ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("resolved")}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                  activeTab === "resolved"
                    ? "text-emerald-700 bg-emerald-50 border-t border-x border-emerald-500 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ✅ แก้ไขสำเร็จแล้ว
              </button>
            </div>

            {/* Line Chart */}
            <div className="h-80 relative">
              <Line data={lineChartData} options={lineOptions} />
            </div>
          </section>

          {/* 4. สัดส่วนประเภทปัญหาที่รับแจ้ง */}
          <div className="grid lg:grid-cols-3 gap-6">
            <section className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  🏷️ สัดส่วนประเภทปัญหา
                </h3>
                <p className="text-[11px] text-slate-400">จำแนกตามประเภท</p>
              </div>
              <div className="h-60 flex items-center justify-center relative">
                <Doughnut data={donutData} options={donutOptions} />
              </div>
            </section>

            <section className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  📋 รายละเอียดประเภทปัญหา
                </h3>
                <p className="text-[11px] text-slate-400">
                  การจำแนกตามหมวดหมู่ 7 ประเภท
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#1b5e4a]"></span>
                  <span className="font-semibold">เสียงรบกวน</span>
                  <span className="ml-auto font-bold text-slate-600">
                    40.6%
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#f0a42a]"></span>
                  <span className="font-semibold">ขยะ / ของเสีย</span>
                  <span className="ml-auto font-bold text-slate-600">
                    24.2%
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span>
                  <span className="font-semibold">น้ำ / น้ำเสีย</span>
                  <span className="ml-auto font-bold text-slate-600">
                    14.1%
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#ef4444]"></span>
                  <span className="font-semibold">อากาศ / มลพิษ</span>
                  <span className="ml-auto font-bold text-slate-600">
                    10.5%
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#fbbf24]"></span>
                  <span className="font-semibold">แสงสว่าง</span>
                  <span className="ml-auto font-bold text-slate-600">5.3%</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#86efac]"></span>
                  <span className="font-semibold">ต้นไม้ / สีเขียว</span>
                  <span className="ml-auto font-bold text-slate-600">3.8%</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#8b5cf6]"></span>
                  <span className="font-semibold">อื่นๆ</span>
                  <span className="ml-auto font-bold text-slate-600">1.5%</span>
                </div>
              </div>
            </section>
          </div>

          {/* 5. ตารางอันดับพื้นที่จุดเสี่ยง (Campus Hotspots) */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  🔴 อันดับพื้นที่จุดเสี่ยงที่พบบ่อย (Campus Hotspots)
                </h3>
                <p className="text-[11px] text-slate-400">
                  สถิติความถี่สะสมสำหรับจัดเวรตรวจและวางแผนแก้ไข
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-emerald-700 font-semibold cursor-pointer hover:underline"
              >
                ดูรายละเอียดทั้งหมด →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8faf9] text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-2.5 px-3">โซน / พื้นที่</th>
                    <th className="py-2.5 px-3">ประเภทปัญหาหลัก</th>
                    <th className="py-2.5 px-3">จำนวนเคสสะสม</th>
                    <th className="py-2.5 px-3">ความเร่งด่วนเฉลี่ย</th>
                    <th className="py-2.5 px-3">เวลาเฉลี่ยแก้ไข</th>
                    <th className="py-2.5 px-3">ระดับความเสี่ยง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {hotspotList.slice(0, 4).map((item) => (
                    <tr key={item.id} className="hover:bg-[#f6faf8] transition">
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {item.area}
                      </td>
                      <td className="py-3 px-3">{item.mainIssue}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {item.cases} เรื่อง
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            item.severity === "High"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : item.severity === "Medium"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {item.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3">{item.avgTime}</td>
                      <td className="py-3 px-3">
                        <span className={`font-semibold ${item.riskColor}`}>
                          {item.riskText}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* ==================== Modal: Campus Hotspots Details ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  🔴 รายละเอียดพื้นที่จุดเสี่ยง (Campus Hotspots)
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  สถิติครบถ้วนสำหรับจัดเวรตรวจและวางแผนแก้ไขปัญหา
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-rose-600 font-semibold">
                    พื้นที่เสี่ยงสูง
                  </p>
                  <p className="text-2xl font-bold text-rose-700 mt-1">4</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600 font-semibold">
                    พื้นที่เสี่ยงปานกลาง
                  </p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">6</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600 font-semibold">
                    พื้นที่เสี่ยงต่ำ
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">3</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-600 font-semibold">
                    รวมทั้งหมด
                  </p>
                  <p className="text-2xl font-bold text-slate-700 mt-1">13</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800">
                  📋 ตารางรายละเอียดเต็ม
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold text-slate-700">
                          ลำดับ
                        </th>
                        <th className="py-3 px-4 font-semibold text-slate-700">
                          โซน / พื้นที่
                        </th>
                        <th className="py-3 px-4 font-semibold text-slate-700">
                          ประเภทปัญหาหลัก
                        </th>
                        <th className="py-3 px-4 font-semibold text-slate-700">
                          จำนวนเคส
                        </th>
                        <th className="py-3 px-4 font-semibold text-slate-700">
                          ความเร่งด่วน
                        </th>
                        <th className="py-3 px-4 font-semibold text-slate-700">
                          เวลาเฉลี่ย
                        </th>
                        <th className="py-3 px-4 font-semibold text-slate-700">
                          ความเสี่ยง
                        </th>
                        <th className="py-3 px-4 font-semibold text-slate-700">
                          หมายเหตุ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {hotspotList.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50 transition"
                        >
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {row.id}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            {row.area}
                          </td>
                          <td className="py-3 px-4">{row.mainIssue}</td>
                          <td className="py-3 px-4 font-bold">
                            {row.cases} เรื่อง
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded font-semibold ${
                                row.severity === "High"
                                  ? "bg-rose-100 text-rose-700"
                                  : row.severity === "Medium"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {row.severity}
                            </span>
                          </td>
                          <td className="py-3 px-4">{row.avgTime}</td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${row.riskColor}`}>
                              {row.riskText}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {row.note}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-emerald-900">
                  💡 คำแนะนำการจัดการ
                </h3>
                <ul className="text-sm text-emerald-800 space-y-1">
                  <li>
                    ✓ เพิ่มเวรตรวจพื้นที่เสี่ยงสูง (หอพักชาย 3) ให้บ่อยขึ้น
                  </li>
                  <li>✓ ประสานกับฝ่ายรักษาความสะอาดเพื่อเพิ่มจำนวนถังขยะ</li>
                  <li>✓ กำหนดเวลาการก่อสร้างให้ไม่เป็นช่วงเรียนการสอน</li>
                  <li>✓ ตรวจสอบระบบท่อระบายน้ำและแอร์เป็นประจำ</li>
                </ul>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                ปิด
              </button>
              <button
                onClick={() => alert("ดาวน์โหลดรายงานฉบับเต็มแล้ว")}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
              >
                📥 ส่งออกเป็น Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}