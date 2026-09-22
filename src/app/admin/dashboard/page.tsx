"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NotificationDropdown from "@/components/NotificationDropdown";
import CaseClarificationDrawer from "@/components/CaseClarificationDrawer";

interface ActionReport {
  issue_id: number;
  title: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "In_Progress" | "Resolved" | "Closed";
  date_created: string;
  area_name?: string;
  category_name?: string;
}

interface CategoryStat {
  category_id: number;
  category_name: string;
  count: number;
  percentage: number;
  icon: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState<string>("กิตติภูมิ ปราชญนคร");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const [reports, setReports] = useState<ActionReport[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [activeChatIssue, setActiveChatIssue] = useState<ActionReport | null>(null);

  const categoryIconMap: Record<string, string> = {
    เสียงรบกวน: "🔊",
    "ขยะ / ของเสีย": "🗑️",
    ขยะ: "🗑️",
    "น้ำ / น้ำเสีย": "💧",
    "อากาศ / มลพิษ": "💨",
    แสงสว่าง: "💡",
    "ต้นไม้ / สีเขียว": "🌳",
    "ต้นไม้ / พื้นที่เขียว": "🌳",
  };

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);

        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.user_metadata?.full_name) {
          setAdminName(authData.user.user_metadata.full_name);
        }

        const { data: reportData, error: reportErr } = await supabase
          .from("issue_reports")
          .select(
            `
            issue_id,
            title,
            description,
            severity,
            status,
            date_created,
            issue_areas ( area_name ),
            issue_categories ( category_id, category_name )
          `,
          )
          .order("issue_id", { ascending: false });

        if (!reportErr && reportData && reportData.length > 0) {
          const formattedReports: ActionReport[] = reportData.map(
            (item: any) => ({
              issue_id: item.issue_id,
              title: item.title || "ไม่มีหัวข้อ",
              description: item.description || "",
              severity: item.severity || "Medium",
              status: item.status || "Pending",
              date_created: item.date_created,
              area_name: item.issue_areas?.area_name || "ไม่ระบุสถานที่",
              category_name: item.issue_categories?.category_name || "ทั่วไป",
            }),
          );
          setReports(formattedReports);

          const { data: catData } = await supabase
            .from("issue_categories")
            .select("category_id, category_name");

          if (catData) {
            const total = formattedReports.length;
            const stats: CategoryStat[] = catData.map((cat) => {
              const count = formattedReports.filter(
                (r) => r.category_name === cat.category_name,
              ).length;
              return {
                category_id: cat.category_id,
                category_name: cat.category_name,
                count,
                percentage:
                  total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
                icon: categoryIconMap[cat.category_name] || "💬",
              };
            });
            setCategoryStats(stats);
          }
        } else {
          setReports([
            {
              issue_id: 108,
              title: "เสียงดนตรีเปิดลำโพงยามวิกาล",
              description: "เสียงดังรบกวนช่วงเวลาอ่านหนังสือสอบ",
              severity: "High",
              status: "Pending",
              date_created: new Date().toISOString(),
              area_name: "หอพักนักศึกษาชาย 3 (ชั้น 4)",
              category_name: "เสียงรบกวน",
            },
            {
              issue_id: 107,
              title: "ขยะล้นถังส่งกลิ่นเหม็น",
              description: "ถังขยะเปียกศูนย์อาหารเต็ม มีสุนัขคุ้ย",
              severity: "Medium",
              status: "In_Progress",
              date_created: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
              area_name: "ศูนย์อาหารกลาง (โซนทิศใต้)",
              category_name: "ขยะ / ของเสีย",
            },
            {
              issue_id: 106,
              title: "เสาไฟทางเดินดับยามค่ำคืน",
              description: "ทางเดินมืด เสี่ยงต่อความปลอดภัย",
              severity: "Medium",
              status: "In_Progress",
              date_created: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              area_name: "ทางเดินเชื่อมระหว่างอาคารเรียนรวม 5",
              category_name: "แสงสว่าง",
            },
          ]);

          setCategoryStats([
            {
              category_id: 1,
              category_name: "เสียงรบกวน",
              count: 52,
              percentage: 40.6,
              icon: "🔊",
            },
            {
              category_id: 2,
              category_name: "ขยะ / ของเสีย",
              count: 31,
              percentage: 24.2,
              icon: "🗑️",
            },
            {
              category_id: 3,
              category_name: "น้ำ / น้ำเสีย",
              count: 18,
              percentage: 14.1,
              icon: "💧",
            },
            {
              category_id: 4,
              category_name: "อากาศ / มลพิษ",
              count: 13,
              percentage: 10.5,
              icon: "💨",
            },
            {
              category_id: 5,
              category_name: "แสงสว่าง",
              count: 7,
              percentage: 5.3,
              icon: "💡",
            },
            {
              category_id: 6,
              category_name: "ต้นไม้ / พื้นที่เขียว",
              count: 5,
              percentage: 3.8,
              icon: "🌳",
            },
            {
              category_id: 7,
              category_name: "อื่น ๆ",
              count: 2,
              percentage: 1.5,
              icon: "💬",
            },
          ]);
        }
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, []);

  const stats = useMemo(() => {
    const total = reports.length || 128;
    const pending = reports.filter((r) => r.status === "Pending").length || 8;
    const inProgress =
      reports.filter((r) => r.status === "In_Progress").length || 24;
    const resolved =
      reports.filter((r) => r.status === "Resolved" || r.status === "Closed")
        .length || 96;

    const inProgressPercent = ((inProgress / total) * 100).toFixed(1);
    const resolvedPercent = ((resolved / total) * 100).toFixed(1);
    const pendingPercent = ((pending / total) * 100).toFixed(1);

    return {
      total,
      pending,
      inProgress,
      resolved,
      inProgressPercent,
      resolvedPercent,
      pendingPercent,
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const q = searchQuery.toLowerCase();
      return (
        r.issue_id.toString().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.area_name && r.area_name.toLowerCase().includes(q))
      );
    });
  }, [reports, searchQuery]);

  const handleAssignCase = async (issueId: number) => {
    try {
      const { error } = await supabase
        .from("issue_reports")
        .update({ status: "In_Progress" })
        .eq("issue_id", issueId);

      if (!error) {
        setReports((prev) =>
          prev.map((r) =>
            r.issue_id === issueId ? { ...r, status: "In_Progress" } : r,
          ),
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleLogout = async () => {
    if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
      await supabase.auth.signOut();
      router.push("/");
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return "เมื่อสักครู่";
    if (diff < 60) return `${diff} นาทีที่แล้ว`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    return `${Math.floor(hours / 24)} วันที่แล้ว`;
  };

  return (
    <div className="bg-[#f4f7f5] text-slate-800 antialiased min-h-screen flex">
      {/* ==================== แถบเมนูด้านซ้าย (Sidebar) ==================== */}
      <aside
        className="w-64 text-white flex-shrink-0 sticky top-0 h-screen overflow-y-auto p-5 flex flex-col justify-between hidden md:flex border-r border-[#103e31]"
        style={{
          background:
            "linear-gradient(180deg, #2b8273 0%, #1c5e52 40%, #15453b 70%, #0f3028 100%)",
        }}
      >
        <div className="space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-white/15">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-bold border border-white/30 shadow-xs">
              🌱
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wider uppercase leading-none text-white drop-shadow-xs">
                UniCare
              </h1>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-medium">
            <Link
              href="/"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-emerald-100/80 hover:bg-white/10 hover:text-white transition"
            >
              <span className="text-base">🏠</span>
              <span>หน้าหลัก</span>
            </Link>

            <Link
              href="/admin/reports"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-emerald-100/80 hover:bg-white/10 hover:text-white transition"
            >
              <span className="text-base">📢</span>
              <span>จัดการเรื่องร้องเรียน</span>
            </Link>

            <Link
              href="/admin/map"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-emerald-100/80 hover:bg-white/10 hover:text-white transition"
            >
              <span className="text-base">🗺️</span>
              <span>แผนที่จุดเสี่ยง</span>
            </Link>

            {/* แท็บ Active: สถิติและรายงาน */}
            <Link
              href="/admin/analytics"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl bg-[#c5e8d5] text-[#0d3b2e] font-bold shadow-xs transition"
            >
              <span className="text-base">📊</span>
              <span>สถิติและรายงาน</span>
            </Link>

            <Link
              href="/admin/feedback"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-emerald-100/80 hover:bg-white/10 hover:text-white transition"
            >
              <span className="text-base">⭐</span>
              <span>ผลการประเมิน</span>
            </Link>

            <Link
              href="/admin/categories"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-emerald-100/80 hover:bg-white/10 hover:text-white transition"
            >
              <span className="text-base">⚙️</span>
              <span>จัดการหมวดหมู่</span>
            </Link>

            <Link
              href="/admin/users"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-emerald-100/80 hover:bg-white/10 hover:text-white transition"
            >
              <span className="text-base">👥</span>
              <span>จัดการบัญชีผู้ใช้</span>
            </Link>

            <button
              onClick={() => {
                if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
                  supabase.auth.signOut().then(() => {
                    window.location.href = "/";
                  });
                }
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-rose-200 hover:text-white border border-white/15 text-xs font-semibold transition mt-4 shadow-xs"
            >
              <span className="text-base">🚪</span>
              <span>ออกจากระบบ</span>
            </button>
          </nav>
        </div>

        <div className="bg-black/15 p-3.5 rounded-2xl border border-white/10 text-center">
          <p className="text-xs text-emerald-100/90 font-medium leading-relaxed">
            ร่วมสร้างมหาวิทยาลัยน่าอยู่ไปด้วยกัน 🌱
          </p>
        </div>
      </aside>
      {/* ==================== ส่วนเนื้อหาหลัก (Main Content) ==================== */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div>
            <h1 className="text-base font-bold text-slate-800">
              แดชบอร์ดจัดการเรื่องร้องเรียนและสิ่งแวดล้อม
            </h1>
            <p className="text-xs text-slate-400">
              มหาวิทยาลัยวลัยลักษณ์ - หน่วยงานบริหารส่วนกลาง
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <NotificationDropdown />

            <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs shadow-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[12px]">
                👤
              </div>
              <span className="font-medium text-slate-800">{adminName}</span>
              <span className="bg-[#1b5e4a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                ADMIN
              </span>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8 space-y-6 max-w-7xl w-full overflow-y-auto">
          {/* 1. Hero Banner */}
          <section className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#065f46] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="relative z-10 space-y-2 max-w-xl text-center sm:text-left">
              <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/30">
                สถานะระบบ: ปกติ (Realtime Sync)
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                ศูนย์บริหารจัดการสิ่งแวดล้อม UniCare
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 font-light">
                ติดตามและกำกับดูแลปัญหาด้านเสียงรบกวน ขยะ น้ำ และความปลอดภัยตลอด
                24 ชั่วโมง
              </p>
            </div>
            <div className="relative z-10 hidden sm:flex w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 items-center justify-center text-4xl shadow-inner">
              🌿
            </div>
          </section>

          {/* 2. สรุปตัวเลขภาพรวม 4 สถานะ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">
                  ปัญหาที่รับแจ้งทั้งหมด
                </span>
                <span className="text-lg">📢</span>
              </div>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {stats.total}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-slate-400">รายการสะสม</span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  100%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-amber-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">
                  กำลังดำเนินการ
                </span>
                <span className="text-lg">⏳</span>
              </div>
              <p className="text-3xl font-bold text-amber-900 mt-2">
                {stats.inProgress}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-slate-400">
                  อยู่ระหว่างแก้ไข
                </span>
                <span className="text-[11px] text-amber-600 font-semibold">
                  {stats.inProgressPercent}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-teal-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">
                  แก้ไขสำเร็จแล้ว
                </span>
                <span className="text-lg">✅</span>
              </div>
              <p className="text-3xl font-bold text-teal-950 mt-2">
                {stats.resolved}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-slate-400">
                  ปิดงานเรียบร้อย
                </span>
                <span className="text-[11px] text-teal-700 font-semibold">
                  อัตราสำเร็จ {stats.resolvedPercent}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-rose-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">
                  รอรับการตรวจสอบ
                </span>
                <span className="text-lg">🔍</span>
              </div>
              <p className="text-3xl font-bold text-rose-900 mt-2">
                {stats.pending}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-slate-400">
                  เคสใหม่ยังไม่มอบหมาย
                </span>
                <span className="text-[11px] text-rose-600 font-bold">
                  เร่งด่วน {stats.pendingPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* 3. หมวดหมู่ประเภทปัญหา */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  🏷️ หมวดหมู่ประเภทปัญหาที่รับแจ้ง
                </h3>
                <p className="text-xs text-slate-400">
                  สัดส่วนและจำนวนเคสแบ่งตามประเภทสิ่งแวดล้อม
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                รวม {categoryStats.length} หมวดหมู่
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {categoryStats.map((cat) => (
                <div
                  key={cat.category_id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center flex flex-col items-center"
                >
                  <span className="text-2xl mb-1">{cat.icon}</span>
                  <span className="text-xs font-bold text-slate-800 truncate w-full">
                    {cat.category_name}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-1">
                    {cat.count} เรื่อง ({cat.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 4. ตาราง: Action Required */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  รายการแจ้งปัญหาที่รอการตรวจสอบและมอบหมาย (Action Required)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  เรื่องร้องเรียนใหม่ที่ต้องมอบหมายเจ้าหน้าที่ตรวจการณ์
                </p>
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหารหัสเคส, สถานที่..."
                  className="w-full px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">รหัสเคส</th>
                    <th className="py-3 px-3">หมวดหมู่ / รายละเอียดปัญหา</th>
                    <th className="py-3 px-3">สถานที่เกิดเหตุ</th>
                    <th className="py-3 px-3 text-center">ความเร่งด่วน</th>
                    <th className="py-3 px-3 text-center">เวลาที่แจ้ง</th>
                    <th className="py-3 px-3 text-center">สถานะ</th>
                    <th className="py-3 px-3 text-center">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.slice(0, 5).map((row) => {
                    const icon =
                      categoryIconMap[row.category_name || ""] || "💬";
                    return (
                      <tr
                        key={row.issue_id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="py-4 px-3 font-semibold text-slate-800">
                          #REC-{row.issue_id}
                        </td>
                        <td className="py-4 px-3">
                          <div className="flex items-start space-x-2">
                            <span className="text-sm">{icon}</span>
                            <div>
                              <p className="font-bold text-slate-800">
                                {row.title}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                {row.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3 text-slate-600 font-medium">
                          {row.area_name}
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                              row.severity === "High" ||
                              row.severity === "Critical"
                                ? "bg-rose-50 text-rose-600 border-rose-200"
                                : "bg-amber-50 text-amber-600 border-amber-200"
                            }`}
                          >
                            {row.severity}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center text-slate-500">
                          {formatTimeAgo(row.date_created)}
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              row.status === "Pending"
                                ? "bg-rose-100 text-rose-700"
                                : row.status === "In_Progress"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveChatIssue(row)}
                              title="เปิดระบบสนทนาซักถามข้อมูลเพิ่มเติม (Case Comments & Clarification)"
                              className="px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold rounded-lg text-xs border border-slate-200 transition cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <span>💬</span>
                              <span className="hidden sm:inline text-[11px]">ซักถาม</span>
                            </button>
                            {row.status === "Pending" ? (
                              <button
                                type="button"
                                onClick={() => handleAssignCase(row.issue_id)}
                                className="px-3 py-1.5 bg-[#1b4332] hover:bg-[#143326] text-white font-semibold rounded-lg text-xs transition shadow-xs cursor-pointer"
                              >
                                รับเรื่อง / มอบหมาย
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(`/admin/issues`)
                                }
                                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs border border-slate-200 transition cursor-pointer"
                              >
                                ติดตามสถานะ
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
          </section>

          {/* 5. การ์ด 3 ช่องด้านล่าง */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-xl">
                  ⚙️
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  จัดการหมวดหมู่ & SLA
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ตั้งค่ากำหนดเวลาการแก้ไขปัญหา (SLA)
                  และปรับปรุงประเภทปัญหามลพิษในระบบ
                </p>
              </div>
              <div>
                <Link
                  href="#sla"
                  className="inline-flex items-center text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
                >
                  เข้าสู่การตั้งค่า →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl">
                  🗺️
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  สำรวจแผนที่จุดเสี่ยง
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ดูแผนผังความหนาแน่นของการแจ้งเหตุภายในมหาวิทยาลัยเพื่อจัดเวรตรวจการณ์
                </p>
              </div>
              <div>
                <Link
                  href="#map"
                  className="inline-flex items-center text-xs font-bold text-blue-700 hover:text-blue-900 transition"
                >
                  เปิดแผนที่มหาวิทยาลัย →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl">
                  ⭐
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  สรุปคะแนนความพึงพอใจ
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ตรวจสอบความเห็น คำติชม
                  และเคสที่ผู้ใช้ร้องขอให้มีการเข้าตรวจซ้ำ
                </p>
              </div>
              <div>
                <Link
                  href="#evaluation"
                  className="inline-flex items-center text-xs font-bold text-amber-700 hover:text-amber-900 transition"
                >
                  ดูผลการประเมิน (CSAT) →
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ================= CLARIFICATION CHAT DRAWER ================= */}
      <CaseClarificationDrawer
        isOpen={Boolean(activeChatIssue)}
        reportId={activeChatIssue ? activeChatIssue.issue_id.toString() : null}
        reportTitle={activeChatIssue ? activeChatIssue.title : undefined}
        onClose={() => setActiveChatIssue(null)}
        currentUserRole="admin"
        currentUserName="นายนัฐกรณ์ ไพรพฤกษ์ (Admin)"
      />
    </div>
  );
}

