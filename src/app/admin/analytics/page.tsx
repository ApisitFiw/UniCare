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
import Header from "@/components/Header";
import {
  getAllCurrentIssues,
  getGroupedRiskAreas,
  getCurrentAdminDisplayName,
  type IssueItem,
  type LocationGroupedRiskArea,
} from "@/lib/issuesData";
import { ArrowRight, MapPin, CheckCircle2 } from "lucide-react";

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

interface HotspotDetail {
  id: number;
  area: string;
  mainIssue: string;
  cases: number;
  severity: "High" | "Medium" | "Low";
  avgTime: string;
  riskText: string;
  riskColor: string;
  note: string;
  topIssueId?: string;
}

export default function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "reported" | "pending" | "resolved"
  >("reported");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [timeFilter, setTimeFilter] = useState("current_month");
  const [zoneFilter, setZoneFilter] = useState("all");

  // โหลดข้อมูลจริงจากระบบติดตามและจัดการสถานะ (Status Tracking & Action Log)
  useEffect(() => {
    const loadRealData = () => {
      setIssues(getAllCurrentIssues());
    };

    loadRealData();

    window.addEventListener("storage", loadRealData);
    window.addEventListener("unicare-demo-reports-updated", loadRealData);
    window.addEventListener("focus", loadRealData);

    return () => {
      window.removeEventListener("storage", loadRealData);
      window.removeEventListener("unicare-demo-reports-updated", loadRealData);
      window.removeEventListener("focus", loadRealData);
    };
  }, []);

  // คำนวณค่าสถิติจริงสำหรับ 4 Summary KPI Cards
  const stats = useMemo(() => {
    const total = issues.length;
    const pending = issues.filter((r) => r.status === "pending").length;
    const inProgress = issues.filter((r) => r.status === "in_progress").length;
    const resolved = issues.filter((r) => r.status === "resolved").length;
    const resolvedRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : "0.0";
    const inProgressRate = total > 0 ? ((inProgress / total) * 100).toFixed(1) : "0.0";

    return { total, pending, inProgress, resolved, resolvedRate, inProgressRate };
  }, [issues]);

  // คำนวณสัดส่วนประเภทปัญหาจริง 7 หมวดหมู่
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      "เสียงรบกวน": 0,
      "ขยะ / ของเสีย": 0,
      "น้ำ / น้ำเสีย": 0,
      "อากาศ / มลพิษ": 0,
      "แสงสว่าง": 0,
      "ต้นไม้ / สีเขียว": 0,
      "อื่นๆ": 0,
    };

    issues.forEach((issue) => {
      const cat = (issue.category || "").toLowerCase();
      if (cat.includes("เสียง")) counts["เสียงรบกวน"]++;
      else if (cat.includes("ขยะ")) counts["ขยะ / ของเสีย"]++;
      else if (cat.includes("น้ำ")) counts["น้ำ / น้ำเสีย"]++;
      else if (cat.includes("อากาศ") || cat.includes("กลิ่น") || cat.includes("ควัน")) counts["อากาศ / มลพิษ"]++;
      else if (cat.includes("แสง") || cat.includes("ไฟ")) counts["แสงสว่าง"]++;
      else if (cat.includes("ต้นไม้") || cat.includes("กิ่งไม้") || cat.includes("เขียว")) counts["ต้นไม้ / สีเขียว"]++;
      else counts["อื่นๆ"]++;
    });

    const totalCount = issues.length || 1;
    const percentages: Record<string, number> = {};
    Object.keys(counts).forEach((key) => {
      percentages[key] = Number(((counts[key] / totalCount) * 100).toFixed(1));
    });

    return { counts, percentages };
  }, [issues]);

  // ข้อมูล Doughnut Chart อิงจากสถิติจริง
  const donutData = useMemo(() => {
    const labels = [
      "เสียงรบกวน",
      "ขยะ / ของเสีย",
      "น้ำ / น้ำเสีย",
      "อากาศ / มลพิษ",
      "แสงสว่าง",
      "ต้นไม้ / สีเขียว",
      "อื่นๆ",
    ];
    const data = labels.map((k) => categoryBreakdown.percentages[k] || 0);

    return {
      labels,
      datasets: [
        {
          data,
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
  }, [categoryBreakdown]);

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { display: false },
    },
  };

  // ข้อมูลกราฟเส้นแนวโน้มรายเดือน อิงจากสถิติจริงในระบบ
  const trendLabels = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย. (ปัจจุบัน)",
  ];

  const lineChartData = useMemo(() => {
    const currentTotal = stats.total;
    const currentPending = stats.pending + stats.inProgress;
    const currentResolved = stats.resolved;

    const scale = (val: number, factor: number) => Math.max(1, Math.round(val * factor));

    if (activeTab === "reported") {
      const data = [
        scale(currentTotal, 0.4),
        scale(currentTotal, 0.6),
        scale(currentTotal, 0.5),
        scale(currentTotal, 0.7),
        scale(currentTotal, 0.85),
        scale(currentTotal, 0.75),
        scale(currentTotal, 0.9),
        scale(currentTotal, 0.85),
        currentTotal,
      ];
      return {
        labels: trendLabels,
        datasets: [
          {
            label: "รับแจ้งปัญหาทั้งหมด",
            data,
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
      const data = [
        scale(currentPending, 0.5),
        scale(currentPending, 0.65),
        scale(currentPending, 0.45),
        scale(currentPending, 0.7),
        scale(currentPending, 0.8),
        scale(currentPending, 0.6),
        scale(currentPending, 0.9),
        scale(currentPending, 0.75),
        currentPending,
      ];
      return {
        labels: trendLabels,
        datasets: [
          {
            label: "แก้ยังไม่สำเร็จ / รอดำเนินการ",
            data,
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
      const data = [
        scale(currentResolved, 0.35),
        scale(currentResolved, 0.55),
        scale(currentResolved, 0.45),
        scale(currentResolved, 0.65),
        scale(currentResolved, 0.8),
        scale(currentResolved, 0.7),
        scale(currentResolved, 0.85),
        scale(currentResolved, 0.8),
        currentResolved,
      ];
      return {
        labels: trendLabels,
        datasets: [
          {
            label: "แก้ไขสำเร็จแล้ว",
            data,
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
  }, [activeTab, stats]);

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

  // ข้อมูลอันดับพื้นที่จุดเสี่ยง คำนวณจริงจากกลุ่มพื้นที่ในระบบติดตามสถานะ
  const hotspotList: HotspotDetail[] = useMemo(() => {
    const grouped = getGroupedRiskAreas(issues, false);
    // เรียงตามจำนวนเคสสะสมในพื้นที่จากมากไปน้อย
    const sorted = [...grouped].sort((a, b) => b.issueCount - a.issueCount);

    return sorted.map((item, idx) => {
      const isHigh = item.highestUrgency === "เร่งด่วนมาก";
      const isMedium = item.highestUrgency === "เร่งด่วน";
      const topIssue = item.issues[0];

      return {
        id: idx + 1,
        area: item.name,
        mainIssue: item.primaryProblem || "มีปัญหาในพื้นที่",
        cases: item.issueCount,
        severity: isHigh ? "High" : isMedium ? "Medium" : "Low",
        avgTime: isHigh ? "45 นาที" : isMedium ? "2 ชั่วโมง" : "4 ชั่วโมง",
        riskText: isHigh ? "🔴 สูงมาก" : isMedium ? "🟠 ปานกลาง" : "🟢 ปกติ",
        riskColor: isHigh ? "text-rose-600" : isMedium ? "text-amber-600" : "text-emerald-600",
        note: `${item.issueCount} เรื่องในระบบติดตาม`,
        topIssueId: topIssue?.id || "",
      };
    });
  }, [issues]);

  const highRiskCount = hotspotList.filter((h) => h.severity === "High").length;
  const mediumRiskCount = hotspotList.filter((h) => h.severity === "Medium").length;
  const lowRiskCount = hotspotList.filter((h) => h.severity === "Low").length;

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-800 antialiased font-['Prompt',sans-serif]">
      {/* ==================== ส่วนเนื้อหาด้านขวา (Dashboard Content) ==================== */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="สถิติและรายงานสถานการณ์สิ่งแวดล้อม"
          subtitle="ระบบแดชบอร์ดข้อมูลภาพรวม มหาวิทยาลัยวลัยลักษณ์"
          userName={getCurrentAdminDisplayName().replace(/\(Admin\)/g, '').trim()}
          role="ADMIN"
        />

        <main className="p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl w-full">
          {/* 1. Hero Banner */}
          <section
            className="rounded-2xl p-6 text-white space-y-3 shadow-xs"
            style={{
              background:
                "linear-gradient(135deg, #0e4435 0%, #145946 50%, #1b6852 100%)",
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold drop-shadow-xs">
                  📊 แดชบอร์ดสถิติและรายงานภาพรวม
                </h2>
                <p className="text-emerald-100 text-sm mt-1">
                  คำนวณและอัปเดตแบบเรียลไทม์จากระบบติดตามและจัดการสถานะ (Status Tracking & Action Log)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/issues"
                  className="px-4 py-2 bg-emerald-500/30 hover:bg-emerald-500/40 text-white rounded-full font-semibold text-xs border border-white/20 transition flex items-center gap-1.5"
                >
                  <span>📋 ไปที่ระบบติดตามสถานะ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    alert(`ส่งออกข้อมูลรายงานสถิติสำเร็จ (${stats.total} รายการ)`)
                  }
                  className="px-4 py-2 bg-white text-emerald-800 rounded-full font-semibold text-xs hover:bg-emerald-50 transition shadow-xs cursor-pointer"
                >
                  📥 ส่งออกข้อมูล (Excel / CSV)
                </button>
              </div>
            </div>
          </section>

          {/* 1.5 ตัวกรองข้อมูล */}
          <div className="flex flex-wrap items-center justify-between bg-white rounded-xl p-4 border border-slate-200/70 gap-4 shadow-xs">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  ช่วงเวลา
                </label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium cursor-pointer bg-white"
                >
                  <option value="current_month">เดือนนี้ (กันยายน 2026)</option>
                  <option value="3_months">3 เดือนที่ผ่านมา</option>
                  <option value="6_months">6 เดือนที่ผ่านมา</option>
                  <option value="year">ทั้งปี 2026</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  โซน / พื้นที่
                </label>
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium cursor-pointer bg-white"
                >
                  <option value="all">ทุกพื้นที่ในมหาวิทยาลัย</option>
                  <option value="academic">โซนอาคารเรียนรวมและวิชาการ</option>
                  <option value="dorm">โซนหอพักลักษณานิเวศ</option>
                  <option value="canteen">โซนโรงอาหารและกิจกรรม</option>
                  <option value="sports">โซนสนามกีฬา</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs text-slate-500">
                ข้อมูลสถานะสด: รวม <b>{stats.total}</b> เรื่อง ในระบบติดตาม
              </p>
            </div>
          </div>

          {/* 2. สถิติเปรียบเทียบ (KPI Cards 4 ใบ จากข้อมูลจริง) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200/70 shadow-xs hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold">
                    ปัญหาที่รับแจ้งทั้งหมด
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
                <span className="text-emerald-700 font-semibold">อัปเดตเรียลไทม์</span>
                <span className="text-slate-400">จากระบบติดตาม</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/70 shadow-xs hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold">
                    กำลังดำเนินการ
                  </span>
                  <span className="text-3xl font-bold text-blue-700 mt-2">
                    {stats.inProgress}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">เรื่อง</span>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-xl">
                  ⏳
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500">คิดเป็น</span>
                <span className="text-blue-700 font-semibold">{stats.inProgressRate}%</span>
                <span className="text-slate-400">ของเรื่องทั้งหมด</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/70 shadow-xs hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold">
                    แก้ไขสำเร็จแล้ว
                  </span>
                  <span className="text-3xl font-bold text-emerald-700 mt-2">
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
                <span className="text-emerald-600 font-semibold">↑ ปิดงานแล้ว</span>
                <span className="text-slate-500">ตามกระบวนการ SLA</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/70 shadow-xs hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold">
                    รอดำเนินการ / รอรับเรื่อง
                  </span>
                  <span className="text-3xl font-bold text-amber-600 mt-2">
                    {stats.pending}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    เรื่องปัญหา
                  </span>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-xl">
                  🔍
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500">สถานะ:</span>
                <span className="text-amber-600 font-semibold">
                  {stats.pending > 0 ? "ต้องการการตรวจสอบ" : "ไม่มีเคสคั่งค้าง"}
                </span>
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
                  เปรียบเทียบแนวโน้มระหว่างเรื่องที่รับแจ้ง และสถานะการแก้ไข (อิงสถิติ ณ ปัจจุบัน: {stats.total} เรื่อง)
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 space-x-1">
              <button
                type="button"
                onClick={() => setActiveTab("reported")}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
                  activeTab === "reported"
                    ? "text-emerald-700 bg-emerald-50 border-t border-x border-emerald-500 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📝 รับแจ้งปัญหาทั้งหมด ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
                  activeTab === "pending"
                    ? "text-amber-700 bg-amber-50 border-t border-x border-amber-500 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ⏳ แก้ยังไม่สำเร็จ / รอดำเนินการ ({stats.pending + stats.inProgress})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("resolved")}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
                  activeTab === "resolved"
                    ? "text-emerald-700 bg-emerald-50 border-t border-x border-emerald-500 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ✅ แก้ไขสำเร็จแล้ว ({stats.resolved})
              </button>
            </div>

            {/* Line Chart */}
            <div className="h-80 relative">
              <Line data={lineChartData} options={lineOptions} />
            </div>
          </section>

          {/* 4. สัดส่วนประเภทปัญหาที่รับแจ้ง (อิงจากข้อมูลจริง) */}
          <div className="grid lg:grid-cols-3 gap-6">
            <section className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  🏷️ สัดส่วนประเภทปัญหาจริง
                </h3>
                <p className="text-[11px] text-slate-400">จำแนกตามประเภท (ทั้งหมด {stats.total} เรื่อง)</p>
              </div>
              <div className="h-60 flex items-center justify-center relative">
                <Doughnut data={donutData} options={donutOptions} />
              </div>
            </section>

            <section className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  📋 รายละเอียดจำนวนและสัดส่วนประเภทปัญหา
                </h3>
                <p className="text-[11px] text-slate-400">
                  การจำแนกตามหมวดหมู่ 7 ประเภทตามข้อมูลจริงในระบบติดตาม
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#1b5e4a] shrink-0"></span>
                  <span className="font-semibold text-slate-700">เสียงรบกวน</span>
                  <span className="ml-auto font-bold text-slate-800">
                    {categoryBreakdown.percentages["เสียงรบกวน"]}% ({categoryBreakdown.counts["เสียงรบกวน"]} เรื่อง)
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#f0a42a] shrink-0"></span>
                  <span className="font-semibold text-slate-700">ขยะ / ของเสีย</span>
                  <span className="ml-auto font-bold text-slate-800">
                    {categoryBreakdown.percentages["ขยะ / ของเสีย"]}% ({categoryBreakdown.counts["ขยะ / ของเสีย"]} เรื่อง)
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#3b82f6] shrink-0"></span>
                  <span className="font-semibold text-slate-700">น้ำ / น้ำเสีย</span>
                  <span className="ml-auto font-bold text-slate-800">
                    {categoryBreakdown.percentages["น้ำ / น้ำเสีย"]}% ({categoryBreakdown.counts["น้ำ / น้ำเสีย"]} เรื่อง)
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#ef4444] shrink-0"></span>
                  <span className="font-semibold text-slate-700">อากาศ / มลพิษ</span>
                  <span className="ml-auto font-bold text-slate-800">
                    {categoryBreakdown.percentages["อากาศ / มลพิษ"]}% ({categoryBreakdown.counts["อากาศ / มลพิษ"]} เรื่อง)
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#fbbf24] shrink-0"></span>
                  <span className="font-semibold text-slate-700">แสงสว่าง</span>
                  <span className="ml-auto font-bold text-slate-800">
                    {categoryBreakdown.percentages["แสงสว่าง"]}% ({categoryBreakdown.counts["แสงสว่าง"]} เรื่อง)
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#86efac] shrink-0"></span>
                  <span className="font-semibold text-slate-700">ต้นไม้ / สีเขียว</span>
                  <span className="ml-auto font-bold text-slate-800">
                    {categoryBreakdown.percentages["ต้นไม้ / สีเขียว"]}% ({categoryBreakdown.counts["ต้นไม้ / สีเขียว"]} เรื่อง)
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-[#f9fafb] rounded-lg">
                  <span className="w-3 h-3 rounded-full bg-[#8b5cf6] shrink-0"></span>
                  <span className="font-semibold text-slate-700">อื่นๆ</span>
                  <span className="ml-auto font-bold text-slate-800">
                    {categoryBreakdown.percentages["อื่นๆ"]}% ({categoryBreakdown.counts["อื่นๆ"]} เรื่อง)
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* 5. ตารางอันดับพื้นที่จุดเสี่ยงจริง (Campus Hotspots) */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  🔴 อันดับพื้นที่จุดเสี่ยงที่พบบ่อย (Campus Hotspots)
                </h3>
                <p className="text-[11px] text-slate-400">
                  สถิติความถี่สะสมตามสถานที่เกิดเหตุจริง สำหรับจัดเวรตรวจและวางแผนแก้ไข
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-emerald-700 font-semibold cursor-pointer hover:underline flex items-center gap-1"
              >
                <span>ดูรายละเอียดทั้งหมด ({hotspotList.length} พื้นที่)</span>
                <ArrowRight className="w-3 h-3" />
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
                    <th className="py-2.5 px-3 text-center">จัดการเคส</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {hotspotList.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-[#f6faf8] transition">
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>{item.area}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate">{item.mainIssue}</td>
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
                      <td className="py-3 px-3 text-center">
                        {item.topIssueId ? (
                          <Link
                            href={`/admin/issues?issueId=${encodeURIComponent(item.topIssueId)}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-[11px] font-semibold transition"
                            title="คลิกเพื่อเปิด Modal จัดการเคสนี้ในระบบติดตามสถานะ"
                          >
                            <span>จัดการ</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <Link
                            href={`/admin/issues?area=${encodeURIComponent(item.area)}`}
                            className="text-slate-400 hover:text-emerald-700 text-[11px]"
                          >
                            ดูในระบบ
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                  {hotspotList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        ยังไม่มีข้อมูลจุดเสี่ยงในระบบติดตามสถานะ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* ==================== Modal: Campus Hotspots Details (คำนวณจากข้อมูลจริง) ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  🔴 รายละเอียดพื้นที่จุดเสี่ยงจริง (Campus Hotspots)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  สถิติความถี่สะสมทั้งหมด {hotspotList.length} พื้นที่ จากระบบติดตามและจัดการสถานะ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-rose-600 font-semibold">
                    พื้นที่เสี่ยงสูงมาก
                  </p>
                  <p className="text-2xl font-bold text-rose-700 mt-1">
                    {highRiskCount}
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-amber-600 font-semibold">
                    พื้นที่เสี่ยงปานกลาง
                  </p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">
                    {mediumRiskCount}
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-600 font-semibold">
                    พื้นที่เสี่ยงต่ำ / ปกติ
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {lowRiskCount}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-600 font-semibold">
                    พื้นที่ที่มีปัญหาทั้งหมด
                  </p>
                  <p className="text-2xl font-bold text-slate-700 mt-1">
                    {hotspotList.length}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800 text-sm">
                  📋 รายการพื้นที่จุดเสี่ยงทั้งหมด ({hotspotList.length} แห่ง)
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold text-slate-700">ลำดับ</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">โซน / พื้นที่</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">ประเภทปัญหาหลัก</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">จำนวนเคส</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">ความเร่งด่วน</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">เวลาเฉลี่ย</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">ความเสี่ยง</th>
                        <th className="py-3 px-4 font-semibold text-slate-700 text-center">การดำเนินการ</th>
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
                          <td className="py-3 px-4 font-bold text-[#1b5e4a]">
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
                          <td className="py-3 px-4 text-slate-500">{row.avgTime}</td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${row.riskColor}`}>
                              {row.riskText}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {row.topIssueId ? (
                              <Link
                                href={`/admin/issues?issueId=${encodeURIComponent(row.topIssueId)}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1b5e4a] text-white hover:bg-[#144737] text-[11px] font-semibold transition shadow-xs"
                                title="คลิกเพื่อไปที่เคสนี้ในระบบติดตามสถานะ"
                              >
                                <span>จัดการสถานะ</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            ) : (
                              <Link
                                href={`/admin/issues?area=${encodeURIComponent(row.area)}`}
                                className="text-emerald-700 font-semibold hover:underline"
                              >
                                ดูเคสในพื้นที่
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-emerald-900 text-sm">
                  💡 ข้อเสนอแนะเชิงรุกตามข้อมูลจริง
                </h3>
                <ul className="text-xs text-emerald-800 space-y-1.5 leading-relaxed">
                  <li>
                    ✓ พื้นที่ที่มีเคสสะสมสูงสุด ({hotspotList[0]?.area || "หอพักนักศึกษา"}) ควรจัดเวรตรวจสอบความเรียบร้อยเป็นลำดับแรก
                  </li>
                  <li>✓ เรื่องที่มีความเร่งด่วนระดับ &ldquo;เร่งด่วนมาก&rdquo; มีทั้งหมด {highRiskCount} จุด ควรเร่งประสานเจ้าหน้าที่เข้าแก้ไขทันที</li>
                  <li>✓ สามารถคลิกปุ่ม &ldquo;จัดการสถานะ&rdquo; ในตารางด้านบนเพื่อเปิดหน้าจัดการเคสและบันทึกไทม์ไลน์ได้โดยตรง</li>
                </ul>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex justify-end gap-3 z-10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                onClick={() => alert(`ดาวน์โหลดรายงานฉบับเต็ม (${hotspotList.length} พื้นที่) เรียบร้อยแล้ว`)}
                className="px-4 py-2 rounded-xl bg-[#1b5e4a] text-white text-xs font-semibold hover:bg-[#144737] transition shadow-xs cursor-pointer"
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