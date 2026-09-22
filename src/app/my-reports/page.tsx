"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NotificationDropdown from "@/components/NotificationDropdown";
import CaseClarificationDrawer from "@/components/CaseClarificationDrawer";
import {
  MapPin,
  Clock,
  RotateCw,
  CheckCircle2,
  MessageCircle,
  FolderOpen,
  ArrowLeft,
  Plus,
} from "lucide-react";

interface UserReportItem {
  id: string;
  date: string;
  category: string;
  area: string;
  description: string;
  status: "pending" | "in_progress" | "resolved";
  statusLabel: string;
}

export default function MyReportsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("กิตติภูมิ ปราชญนคร");
  const [activeChatReport, setActiveChatReport] = useState<UserReportItem | null>(null);

  const [reports, setReports] = useState<UserReportItem[]>([
    {
      id: "ISS-2026-101",
      date: "07 ก.ย. 2568 - 14:20",
      category: "เสียงรบกวน",
      area: "หอพักนักศึกษาชาย 3 (ชั้น 4 ห้อง 412)",
      description: "เสียงดนตรีเปิดล้ำ 23.00 น. รบกวนเวลาพักผ่อนและอ่านหนังสือสอบ",
      status: "in_progress",
      statusLabel: "กำลังดำเนินการ",
    },
    {
      id: "ISS-2026-102",
      date: "06 ก.ย. 2568 - 11:10",
      category: "ขยะ / ของเสีย",
      area: "โรงอาหารกลาง ด้านหลังโซนล้างจาน",
      description: "ถังขยะล้น ส่งกลิ่นเหม็นและมีแมลงวันรบกวน",
      status: "resolved",
      statusLabel: "แก้ไขสำเร็จ",
    },
    {
      id: "ISS-2026-103",
      date: "07 ก.ย. 2568 - 16:45",
      category: "น้ำ / น้ำเสีย",
      area: "อาคารเรียนรวม 5 ลานทางเดินด้านทิศเหนือ",
      description: "ท่อระบายน้ำอุดตัน น้ำระบายไม่ทันเมื่อฝนตก",
      status: "pending",
      statusLabel: "รอดำเนินการ",
    },
  ]);

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.user_metadata?.full_name) {
          setUserName(authData.user.user_metadata.full_name);
        }
      } catch {
        // Fallback to default
      }
    }
    loadUserData();
  }, []);

  const handleLogout = async () => {
    if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
      await supabase.auth.signOut();
      router.push("/");
    }
  };

  return (
    <div className="bg-[#f4f7f5] text-slate-800 antialiased min-h-screen flex font-['Prompt',sans-serif]">
      {/* ==================== Sidebar (User Perspective) ==================== */}
      <aside
        className="w-64 text-white flex-shrink-0 sticky top-0 h-screen overflow-y-auto p-5 hidden md:flex flex-col justify-between border-r border-[#103e31]"
        style={{
          background:
            "linear-gradient(180deg, #2b8273 0%, #1c5e52 40%, #15453b 70%, #0f3028 100%)",
        }}
      >
        <div className="space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-white/15">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold border border-white/30 shadow-xs">
              🌱
            </div>
            <h1 className="text-xl font-extrabold uppercase tracking-wider text-white">
              UniCare
            </h1>
          </div>

          <nav className="space-y-1.5 text-xs font-medium">
            <Link
              href="/user/dashboard"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-white/90 hover:bg-white/15 hover:text-white transition"
            >
              <span className="text-base">🏠</span>
              <span>หน้าหลัก</span>
            </Link>

            <Link
              href="/report"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-white/90 hover:bg-white/15 hover:text-white transition"
            >
              <span className="text-base">📢</span>
              <span>แจ้งปัญหา</span>
            </Link>

            {/* Active Tab: รายการของฉัน */}
            <Link
              href="/my-reports"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl bg-[#a8e6b1] text-[#0f3028] font-bold shadow-md border border-white/40 transition"
            >
              <span className="text-base">📋</span>
              <span>รายการของฉัน</span>
            </Link>

            <Link
              href="/user/dashboard"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-white/90 hover:bg-white/15 hover:text-white transition"
            >
              <span className="text-base">📰</span>
              <span>ข่าวสาร / ประกาศ</span>
            </Link>

            <Link
              href="/user/dashboard"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-white/90 hover:bg-white/15 hover:text-white transition"
            >
              <span className="text-base">❓</span>
              <span>คำถามที่พบบ่อย</span>
            </Link>

            <Link
              href="/user/dashboard"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-white/90 hover:bg-white/15 hover:text-white transition"
            >
              <span className="text-base">💬</span>
              <span>ติดต่อเรา</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-rose-200 hover:text-white border border-white/15 text-xs font-semibold transition mt-4 shadow-xs cursor-pointer"
            >
              <span className="text-base">🚪</span>
              <span>ออกจากระบบ</span>
            </button>
          </nav>
        </div>

        <div className="bg-black/20 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center shadow-inner">
          <p className="text-xs text-emerald-100 font-medium">
            ร่วมสร้างมหาวิทยาลัยน่าอยู่ไปด้วยกัน 🌱
          </p>
        </div>
      </aside>

      {/* ==================== Main Content ==================== */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/user/dashboard"
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-emerald-950 leading-tight">
                รายการแจ้งปัญหาของฉัน (My Reports)
              </h1>
              <p className="text-xs text-slate-500">
                ติดตามขั้นตอนการดำเนินงาน และพูดคุยซักถามข้อมูลกับเจ้าหน้าที่
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <NotificationDropdown />

            <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full text-xs shadow-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[12px]">
                👤
              </div>
              <span className="font-medium text-slate-800 hidden sm:inline-block">
                {userName}
              </span>
              <span className="bg-[#1b5e4a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                User
              </span>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8 space-y-6 max-w-6xl w-full overflow-y-auto">
          {/* Hero Banner */}
          <section className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#065f46] text-white p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/30">
                มุมมอง: ผู้แจ้งเรื่อง (User Perspective)
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                ติดตามสถานะและสนทนากับเจ้าหน้าที่
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 font-light">
                หากเจ้าหน้าที่ต้องการข้อมูลเพิ่มเติม หรือคุณต้องการส่งรูปภาพ/เสียงหลักฐานเพิ่ม สามารถกดปุ่ม &quot;สนทนากับเจ้าหน้าที่&quot; ได้ทันที
              </p>
            </div>
            <Link
              href="/report"
              className="bg-white text-emerald-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs hover:bg-emerald-50 transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>แจ้งปัญหาใหม่</span>
            </Link>
          </section>

          {/* Cards List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-700" />
                <span>ประวัติเรื่องร้องเรียนทั้งหมด ({reports.length} รายการ)</span>
              </h3>
            </div>

            <div className="grid gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-extrabold text-[#154c3c] text-sm">
                        #{report.id}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {report.category}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        แจ้งเมื่อ: {report.date}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {report.status === "in_progress" && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{report.statusLabel}</span>
                        </span>
                      )}
                      {report.status === "resolved" && (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{report.statusLabel}</span>
                        </span>
                      )}
                      {report.status === "pending" && (
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{report.statusLabel}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {report.description}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{report.area}</span>
                    </div>

                    {/* Action Button: เปิดแชทสนทนากับเจ้าหน้าที่ (User View) */}
                    <button
                      type="button"
                      onClick={() => setActiveChatReport(report)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1b5e4a] hover:bg-[#144737] text-white rounded-xl font-medium transition text-xs shadow-xs cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>สนทนากับเจ้าหน้าที่ / ส่งข้อมูลเพิ่ม</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* ================= CLARIFICATION CHAT DRAWER (User Perspective) ================= */}
      <CaseClarificationDrawer
        isOpen={Boolean(activeChatReport)}
        reportId={activeChatReport ? activeChatReport.id : null}
        reportTitle={activeChatReport ? `${activeChatReport.category} - ${activeChatReport.area}` : undefined}
        onClose={() => setActiveChatReport(null)}
        currentUserRole="user"
        currentUserName="กิตติภูมิ ปราชญนคร (ผู้แจ้ง)"
      />
    </div>
  );
}
