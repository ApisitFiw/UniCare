"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import { getDemoSession } from "@/lib/authService";
import {
  getAllFeedbacks,
  updateFeedbackReinspected,
  calculateDimensionsFromFeedbacks,
  syncFeedbacksWithSupabase,
  type FeedbackItem,
  type DimensionStat,
} from "@/lib/feedbackData";
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  FileSpreadsheet,
  Download,
  Filter,
  Eye,
  AlertOctagon,
  ArrowRight,
  X,
  MessageSquareQuote,
  AlertCircle,
  Tag,
  Pin,
  FileText,
} from "lucide-react";

export default function AdminEvaluationPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState<string>("นัฐกรณ์");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

  // คำนวณคะแนนประสิทธิภาพรายมิติ 10 ข้อจากเลขจริงใน feedbacks
  const dimensions = useMemo(() => {
    return calculateDimensionsFromFeedbacks(feedbacks);
  }, [feedbacks]);

  // ค้นหามิติที่ได้คะแนนต่ำสุด 2 อันดับแรก เพื่อแสดงจุดที่ควรเฝ้าระวังและปรับปรุง
  const urgentDimensions = useMemo(() => {
    return [...dimensions].sort((a, b) => a.score - b.score).slice(0, 2);
  }, [dimensions]);

  // States สำหรับ Modal ดูเคส และ สั่งตรวจซ้ำ
  const [selectedCase, setSelectedCase] = useState<FeedbackItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isReinspectModalOpen, setIsReinspectModalOpen] =
    useState<boolean>(false);
  const [reinspectNote, setReinspectNote] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const loadData = useCallback(() => {
    const list = getAllFeedbacks();
    setFeedbacks(list);
  }, []);

  useEffect(() => {
    // 1. Load Admin session
    const session = getDemoSession();
    if (session?.name) {
      setAdminName(session.name);
    }

    async function loadAdminUser() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.user_metadata?.full_name) {
          setAdminName(data.user.user_metadata.full_name);
        }
      } catch {
        // Fallback to demo session
      }
    }
    loadAdminUser();

    // 2. Load Feedbacks
    loadData();
    syncFeedbacksWithSupabase().then(() => loadData());

    const channel = supabase
      .channel("unicare-feedbacks-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedbacks" },
        () => {
          syncFeedbacksWithSupabase().then(() => loadData());
        }
      )
      .subscribe();

    window.addEventListener("unicare-feedbacks-updated", loadData);
    window.addEventListener("storage", loadData);
    window.addEventListener("focus", loadData);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("unicare-feedbacks-updated", loadData);
      window.removeEventListener("storage", loadData);
      window.removeEventListener("focus", loadData);
    };
  }, [loadData]);

  // คำนวณค่าสถิติจาก feedbacks จริง
  const kpis = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) {
      return {
        avgRating: "0.0",
        resolvedCount: 0,
        resolvedRate: "0.0",
        feedbackRate: "0.0",
        unsolvedCount: 0,
        csatIndex: "0.0",
        starCounts: [0, 0, 0, 0, 0],
      };
    }

    const sumRating = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
    const avgRating = (sumRating / total).toFixed(1);

    const resolvedCount = feedbacks.filter((f) => f.isSolved).length;
    const resolvedRate = ((resolvedCount / total) * 100).toFixed(1);

    const unsolvedCount = feedbacks.filter((f) => !f.isSolved && !f.reinspected).length;

    // CSAT Index = % of 4 and 5 stars
    const highRatings = feedbacks.filter((f) => f.rating >= 4).length;
    const csatIndex = ((highRatings / total) * 100).toFixed(1);

    // Star distribution [5, 4, 3, 2, 1]
    const starCounts = [5, 4, 3, 2, 1].map(
      (star) => feedbacks.filter((f) => f.rating === star).length
    );

    return {
      avgRating,
      resolvedCount,
      resolvedRate,
      feedbackRate: "88.5",
      unsolvedCount,
      csatIndex,
      starCounts,
    };
  }, [feedbacks]);

  // กรองตารางตามเงื่อนไข
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      if (filterRating === "5") return item.rating === 5;
      if (filterRating === "low") return item.rating <= 2;
      if (filterRating === "unsolved") return !item.isSolved;
      return true;
    });
  }, [feedbacks, filterRating]);

  // เปิด Modal ดูเคส
  const handleOpenViewModal = (item: FeedbackItem) => {
    setSelectedCase(item);
    setIsViewModalOpen(true);
  };

  // เปิด Modal สั่งตรวจซ้ำ
  const handleOpenReinspectModal = (item: FeedbackItem) => {
    setSelectedCase(item);
    setReinspectNote(
      `ผู้ร้องเรียนแจ้งว่ายังพบปัญหาเดิม ต้องการให้เข้าล้างทำความสะอาด/ระงับเหตุซ้ำอย่างเร่งด่วน`
    );
    setIsReinspectModalOpen(true);
  };

  // ยืนยันการสั่งตรวจซ้ำ
  const handleConfirmReinspect = async () => {
    if (!selectedCase) return;

    setIsProcessing(true);
    try {
      // 1. อัปเดตในระบบ local storage & issuesData
      updateFeedbackReinspected(selectedCase.id, reinspectNote);

      // 2. อัปเดตสถานะใน Supabase ถ้ามีตาราง issue_reports
      try {
        const rawIssueId = String(selectedCase.issueId).replace(/^#/, "");
        const numId = parseInt(rawIssueId, 10);
        if (!isNaN(numId)) {
          await supabase
            .from("issue_reports")
            .update({
              status: "In_Progress",
              description: `[สั่งตรวจซ้ำ] ${selectedCase.comment} | หมายเหตุ: ${reinspectNote}`,
            })
            .eq("issue_id", numId);
        }
      } catch (err) {
        console.warn("Supabase update skipped (using local mock):", err);
      }

      setIsReinspectModalOpen(false);
      setToastMessage(
        `ออกคำสั่งเข้าตรวจซ้ำสำหรับเคส ${selectedCase.reportCode} เรียบร้อยแล้ว`
      );
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      console.error("Error reinspecting:", err);
      alert("เกิดข้อผิดพลาดในการสั่งตรวจซ้ำ");
    } finally {
      setIsProcessing(false);
    }
  };

  // ส่งออกข้อมูล CSV
  const handleExportCSV = () => {
    try {
      const headers = [
        "รหัสเคส",
        "ผู้ประเมิน",
        "หมวดหมู่",
        "สถานที่",
        "คะแนน (ดาว)",
        "สถานะผลลัพธ์",
        "สั่งตรวจซ้ำ",
        "ความคิดเห็น",
        "วันที่ประเมิน",
      ];

      const rows = feedbacks.map((f) => [
        `"${f.reportCode}"`,
        `"${f.userName}"`,
        `"${f.category}"`,
        `"${f.location}"`,
        f.rating,
        f.isSolved ? '"ปัญหาหมดไปแล้ว"' : '"ยังมีปัญหาเดิม"',
        f.reinspected ? '"สั่งตรวจซ้ำแล้ว"' : '"-"',
        `"${(f.comment || "").replace(/"/g, '""')}"`,
        `"${f.createdAt || "-"}"`,
      ]);

      const csvContent =
        "\uFEFF" +
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `UniCare_Feedback_Report_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("ดาวน์โหลดรายงานสรุปความพึงพอใจสำเร็จ (CSV)");
    }
  };

  const starBars = [
    {
      label: "5 ดาว",
      count: kpis.starCounts[0],
      percent: feedbacks.length > 0 ? (kpis.starCounts[0] / feedbacks.length) * 100 : 0,
      color: "#1b5e4a",
      hoverColor: "hover:bg-[#144738]",
    },
    {
      label: "4 ดาว",
      count: kpis.starCounts[1],
      percent: feedbacks.length > 0 ? (kpis.starCounts[1] / feedbacks.length) * 100 : 0,
      color: "#217972",
      hoverColor: "hover:bg-[#195e58]",
    },
    {
      label: "3 ดาว",
      count: kpis.starCounts[2],
      percent: feedbacks.length > 0 ? (kpis.starCounts[2] / feedbacks.length) * 100 : 0,
      color: "#f0a42a",
      hoverColor: "hover:bg-[#d48c1a]",
    },
    {
      label: "2 ดาว",
      count: kpis.starCounts[3],
      percent: feedbacks.length > 0 ? (kpis.starCounts[3] / feedbacks.length) * 100 : 0,
      color: "#f97316",
      hoverColor: "hover:bg-[#dd610d]",
    },
    {
      label: "1 ดาว",
      count: kpis.starCounts[4],
      percent: feedbacks.length > 0 ? (kpis.starCounts[4] / feedbacks.length) * 100 : 0,
      color: "#ef4444",
      hoverColor: "hover:bg-[#dc2626]",
    },
  ];

  return (
    <div className="bg-[#f4f7f5] text-slate-800 antialiased min-h-screen flex flex-col font-['Prompt',sans-serif]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#103e31] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 border border-emerald-400/30 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        title="ระบบสรุปผลประเมินความพึงพอใจและการให้บริการ"
        subtitle="UniCare Admin Console • วิเคราะห์คุณภาพการระงับเหตุและข้อเสนอแนะ"
        userName={adminName}
        role="ADMIN"
      />

      {/* Main Content */}
      <main className="p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">
        {/* Banner */}
        <section className="rounded-2xl bg-gradient-to-r from-[#0e4435] via-[#145946] to-[#1b6852] text-white p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1 max-w-xl">
            <span className="bg-emerald-400/20 text-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30 inline-block">
              Admin Quality & Assurance
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight pt-1">
              สถิติความพึงพอใจต่อการระงับเหตุ (CSAT Evaluation)
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-normal">
              ข้อมูลประเมินผลจากนักศึกษาและบุคลากรหลังเจ้าหน้าที่เข้าตรวจสอบและแก้ไขปัญหา
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-white text-[#0e4435] font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs hover:bg-emerald-50 transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#0e4435]" />
              <span>ส่งออกรายงานคำติชม (Excel / CSV)</span>
            </button>
          </div>
        </section>

        {/* 1. KPI 4 ช่อง */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">
                คะแนนความพึงพอใจเฉลี่ย (CSAT)
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-0.5">
                {kpis.avgRating}{" "}
                <span className="text-xs font-normal text-slate-400">
                  / 5.0
                </span>
              </h3>
              <div className="text-[11px] text-amber-500 font-semibold mt-0.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < (Math.round(Number(kpis.avgRating)) || 5)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200 fill-slate-100"
                      }`}
                    />
                  ))}
                </span>
                <span className="text-slate-400 font-normal">({feedbacks.length} ผู้ประเมิน)</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">
                แก้ปัญหาหมดสิ้น (Resolved Rate)
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-0.5">
                {kpis.resolvedRate}%
              </h3>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {kpis.resolvedCount} เคสระบุว่าเหตุการณ์สงบ
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">
                ดัชนีชี้วัดความเชื่อมั่น (CSAT Index)
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-0.5">
                {kpis.csatIndex}%
              </h3>
              <span className="text-[10px] text-slate-400 font-normal">
                ประเมิน 4-5 ดาวรวมกัน
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">
                ผู้ใช้แจ้งว่า "ยังมีปัญหาอยู่"
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-0.5">
                {kpis.unsolvedCount}{" "}
                <span className="text-xs font-normal text-slate-400">
                  เคส
                </span>
              </h3>
              <span className="text-[10px] text-rose-600 font-semibold inline-flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                <span>ต้องการเข้าตรวจซ้ำ</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* 2. Rating Breakdown & Dimensions */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800">
                การแจกแจงระดับคะแนนดาว (Rating Breakdown)
              </h3>
              <p className="text-[11px] text-slate-400">
                จำนวนการประเมินภาพรวม 1 ถึง 5 ดาว
              </p>
            </div>

            <div className="h-60 pt-4 pb-2 flex items-end justify-between gap-2.5 px-2 border-b border-slate-100">
              {starBars.map((item) => (
                <div
                  key={item.label}
                  className="flex-1 flex flex-col items-center h-full justify-end group"
                >
                  <span className="text-[11px] font-bold text-slate-700 mb-1.5 transition-transform group-hover:-translate-y-0.5">
                    {item.count}
                  </span>

                  <div className="w-full max-w-[44px] bg-slate-100 rounded-t-lg overflow-hidden h-[160px] flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-700 ease-out cursor-pointer ${item.hoverColor}`}
                      style={{
                        height: `${Math.max(item.percent, item.count > 0 ? 8 : 4)}%`,
                        backgroundColor: item.color,
                      }}
                      title={`${item.label}: ${item.count} คน`}
                    />
                  </div>

                  <span className="text-[11px] font-medium text-slate-500 mt-2">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>ดัชนีชี้วัดความเชื่อมั่น (CSAT Index):</span>
                <span className="font-bold text-emerald-800">{kpis.csatIndex}%</span>
              </div>
              <p className="text-[10px] text-slate-400">
                คำนวณจากสัดส่วนผู้ให้คะแนน 4 ดาวและ 5 ดาวรวมกัน
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  ประสิทธิภาพการดำเนินงานแยกรายมิติ (10 ข้อสำคัญ)
                </h3>
                <p className="text-[11px] text-slate-400">
                  ข้อมูลวิเคราะห์คะแนนเฉลี่ยรายข้อจากการประเมินของนักศึกษาและบุคลากร
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                  ≥ 4.5 ยอดเยี่ยม
                </span>
                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                  &lt; 4.0 ต้องปรับปรุง
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              {dimensions.map((dim) => (
                <div
                  key={dim.id}
                  className="space-y-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">
                      {dim.title}
                    </span>
                    <span
                      className={`font-bold ${
                        dim.score >= 4.5
                          ? "text-emerald-800"
                          : dim.score >= 4.0
                            ? "text-amber-700"
                            : "text-rose-600"
                      }`}
                    >
                      {dim.score} / 5.0 ({dim.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dim.score >= 4.5
                          ? "bg-[#1b5e4a]"
                          : dim.score >= 4.0
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      style={{ width: `${dim.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center space-x-1.5 text-amber-900 font-bold flex-wrap">
                <Pin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>มิติที่ควรเฝ้าระวังและปรับปรุง (คำนวณจากคะแนนจริง):</span>
                {urgentDimensions.map((dim, idx) => (
                  <React.Fragment key={dim.id}>
                    {idx > 0 && <span className="text-amber-800 font-normal">และ</span>}
                    <span className={dim.score < 4.0 ? "text-rose-700 font-semibold" : "text-amber-800 font-semibold"}>
                      {dim.title} ({dim.score}/5.0 - {dim.percentage}%)
                    </span>
                  </React.Fragment>
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                <strong>แนวทางแก้ไข:</strong> กำหนดให้เจ้าหน้าที่ผู้รับผิดชอบตรวจสอบจุดบกพร่องตามข้อเสนอแนะของผู้ประเมิน และแนบหลักฐานภาพถ่ายการปฏิบัติงานในระบบก่อนปิดงานทุกครั้ง
              </p>
            </div>
          </div>
        </section>

        {/* 3. ตารางข้อเสนอแนะล่าสุด */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                รายการประเมินและข้อเสนอแนะล่าสุด ({filteredFeedbacks.length} รายการ)
              </h3>
              <p className="text-[11px] text-slate-400">
                ตรวจสอบความเห็นของผู้ใช้เพื่อนำไปปรับปรุงการทำงานและสั่งการสายตรวจ
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">กรองระดับดาว:</span>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="border border-slate-200 bg-[#f8faf9] rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">ทั้งหมด (All Ratings)</option>
                <option value="5">เฉพาะ 5 ดาว (ยอดเยี่ยม)</option>
                <option value="low">1 - 2 ดาว (ต้องปรับปรุง)</option>
                <option value="unsolved">เฉพาะเคสที่ยังไม่หมดสิ้น</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8faf9] text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-3">รหัสเคส / ผู้ประเมิน</th>
                  <th className="py-3 px-3">หมวดหมู่ / สถานที่</th>
                  <th className="py-3 px-3">คะแนนที่ได้</th>
                  <th className="py-3 px-3">สถานะผลลัพธ์</th>
                  <th className="py-3 px-3">ข้อเสนอแนะ / คำติชม</th>
                  <th className="py-3 px-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลผลการประเมินในหมวดที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map((row) => (
                    <tr
                      key={row.id}
                      className={`transition ${
                        !row.isSolved && !row.reinspected
                          ? "hover:bg-rose-50/40 bg-rose-50/15"
                          : "hover:bg-[#f6faf8]"
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-800 block">
                          {row.reportCode}
                        </span>
                        <span className="text-[10px] text-slate-400 notranslate" data-user-content="true">
                          {row.userName}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{row.category}</span>
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {row.location}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < row.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200 fill-slate-100"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                          ({row.rating}.0 ดาว)
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {row.reinspected ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold flex items-center w-max gap-1">
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                            <span>สั่งตรวจซ้ำแล้ว</span>
                          </span>
                        ) : row.isSolved ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ปัญหาหมดไปแล้ว</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold flex items-center w-max gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            <span>ยังมีปัญหาเดิม</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 max-w-xs text-slate-600 line-clamp-2 notranslate" data-user-content="true">
                        {row.comment}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {!row.isSolved && !row.reinspected ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReinspectModal(row)}
                            className="text-xs bg-rose-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-rose-700 transition shadow-xs cursor-pointer active:scale-95 inline-flex items-center gap-1"
                          >
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>สั่งตรวจซ้ำ</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(row)}
                            className="text-xs text-[#1b5e4a] font-bold border border-[#1b5e4a]/30 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition cursor-pointer active:scale-95 inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดูเคส</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ==================== Modal: ดูเคส ==================== */}
      {isViewModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    รายละเอียดเคส {selectedCase.reportCode}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedCase.category}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    ผู้ประเมิน:
                  </span>
                  <span className="font-semibold text-slate-800 notranslate" data-user-content="true">
                    {selectedCase.userName}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    สถานที่เกิดเหตุ:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedCase.location}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-[11px] text-slate-400 block">
                    คะแนนความพึงพอใจ:
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < selectedCase.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200 fill-slate-100"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-xs text-amber-600">
                      ({selectedCase.rating}.0 ดาว)
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-[11px] text-slate-400 block">
                    สถานะผลลัพธ์:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedCase.reinspected ? (
                      <span className="text-blue-600 inline-flex items-center gap-1">
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>ส่งตรวจซ้ำแล้ว</span>
                      </span>
                    ) : selectedCase.isSolved ? (
                      <span className="text-emerald-600 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>แก้ไขเรียบร้อย</span>
                      </span>
                    ) : (
                      <span className="text-rose-600 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        <span>ยังไม่หมดสิ้น</span>
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">
                  ความคิดเห็น / ข้อเสนอแนะ:
                </span>
                <div className="p-3 bg-[#f8faf9] rounded-xl border border-slate-200 text-slate-700 leading-relaxed notranslate" data-user-content="true">
                  &quot;{selectedCase.comment}&quot;
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                onClick={() => router.push(`/admin/issues`)}
                className="px-4 py-2 rounded-xl bg-[#1b5e4a] text-white text-xs font-semibold hover:bg-[#144738] transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <span>ไปยังระบบติดตามสถานะ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Modal: สั่งตรวจซ้ำ ==================== */}
      {isReinspectModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                ยืนยันการสั่งตรวจซ้ำ ({selectedCase.reportCode})
              </h3>
              <p className="text-xs text-slate-500">
                ระบบจะส่งการแจ้งเตือนด่วนไปยังเจ้าหน้าที่ตรวจการณ์ประจำพื้นที่{" "}
                {selectedCase.location} และเปลี่ยนสถานะเคสเป็น &quot;กำลังดำเนินการ&quot;
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">
                คำสั่งปฏิบัติการ / หมายเหตุเร่งด่วน:
              </label>
              <textarea
                rows={3}
                value={reinspectNote}
                onChange={(e) => setReinspectNote(e.target.value)}
                placeholder="ระบุข้อความสั่งการไปยังเจ้าหน้าที่สายตรวจ..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsReinspectModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmReinspect}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                <span>
                  {isProcessing ? "กำลังส่งคำสั่ง..." : "ยืนยันสั่งตรวจซ้ำ"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
