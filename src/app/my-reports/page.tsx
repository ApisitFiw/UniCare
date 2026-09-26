"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getDemoSession } from "@/lib/authService";
import Header from "@/components/Header";
import CaseClarificationDrawer from "@/components/CaseClarificationDrawer";
import UserSidebar from "@/components/UserSidebar";
import { getAllCurrentIssues, getUserAllIssues, type TimelineEntry } from "@/lib/issuesData";
import {
  fetchIssuesFromSupabase,
  removeIssueFromLocalStorage,
  fetchTimelineEntriesFromSupabase,
} from "@/lib/supabaseService";
import {
  MapPin,
  Clock,
  RotateCw,
  CheckCircle2,
  MessageCircle,
  FolderOpen,
  ArrowLeft,
  Plus,
  X,
  ClipboardList,
  Star,
  History,
  Loader2,
  Paperclip,
} from "lucide-react";
import { isIssueEvaluated, getFeedbackByIssueId } from "@/lib/feedbackData";

interface UserReportItem {
  id: string;
  supabaseId?: string;
  date: string;
  category: string;
  area: string;
  description: string;
  status: "pending" | "in_progress" | "resolved" | "rejected";
  statusLabel: string;
  reporterName?: string;
  reporterEmail?: string;
  adminName?: string;
}

export default function MyReportsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("สมชาย ใจดี");
  const [activeChatReport, setActiveChatReport] = useState<UserReportItem | null>(null);
  const [activeTimelineReport, setActiveTimelineReport] = useState<UserReportItem | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState<boolean>(false);
  const [reports, setReports] = useState<UserReportItem[]>([]);

  const loadReports = useCallback(() => {
    if (typeof window === "undefined") {
      setReports([]);
      return;
    }

    const session = getDemoSession();
    const rawUserIssues = getUserAllIssues(session);
    const mapped: UserReportItem[] = rawUserIssues.map((item) => {
      let statusKey: "pending" | "in_progress" | "resolved" | "rejected" = "pending";
      if (item.status === "in_progress") statusKey = "in_progress";
      else if (item.status === "resolved") statusKey = "resolved";
      else if ((item.status as string) === "rejected") statusKey = "rejected";

      return {
        id: item.id,
        supabaseId: item.supabaseId || item.rawId || item.id,
        date: item.date,
        category: item.category,
        area: item.area,
        description: item.description,
        status: statusKey,
        statusLabel: item.statusLabel,
        reporterName: item.reporterName,
        reporterEmail: item.reporterEmail,
        adminName: item.adminName,
      };
    });

    setReports(mapped);
  }, []);

  useEffect(() => {
    // 1. Load user session
    const session = getDemoSession();
    if (!session || session.role !== "user") {
      router.replace("/login");
      return;
    }

    setUserName(session.name);

    // 2. Load reports for this specific user
    loadReports();

    const handleUpdate = () => {
      const currentSession = getDemoSession();
      if (currentSession?.name) {
        setUserName(currentSession.name);
      }
      loadReports();
    };

    // 3. Sync latest issues from Supabase
    fetchIssuesFromSupabase().then(() => {
      handleUpdate();
    });

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("unicare-demo-reports-updated", handleUpdate);
    window.addEventListener("unicare-profile-updated", handleUpdate);
    window.addEventListener("unicare-issues-sync", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("unicare-demo-reports-updated", handleUpdate);
      window.removeEventListener("unicare-profile-updated", handleUpdate);
      window.removeEventListener("unicare-issues-sync", handleUpdate);
    };
  }, [router, loadReports]);

  // Handle URL query param for automatically opening chat (e.g. ?chat=ISS-2026-001)
  useEffect(() => {
    if (typeof window === "undefined" || reports.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const chatReportId = params.get("chat");
    if (chatReportId) {
      const cleanTarget = chatReportId.replace(/^#/, "").trim().toLowerCase();
      const targetNumMatch = cleanTarget.match(/\d+$/);
      const targetNum = targetNumMatch ? parseInt(targetNumMatch[0], 10) : null;

      const found = reports.find((r) => {
        const cleanId = String(r.id).replace(/^#/, "").trim().toLowerCase();
        const cleanSub = String(r.supabaseId || "").trim().toLowerCase();
        if (cleanId === cleanTarget || cleanSub === cleanTarget) return true;
        if (targetNum !== null) {
          const m = cleanId.match(/\d+$/);
          if (m && parseInt(m[0], 10) === targetNum) return true;
        }
        return false;
      });

      if (found) {
        setActiveChatReport(found);
      } else {
        // Not this user's report, remove unauthorized param without page reload
        const url = new URL(window.location.href);
        url.searchParams.delete("chat");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [reports]);

  // Open Timeline Modal and fetch history from Supabase issue_timelines
  const handleOpenTimeline = async (report: UserReportItem) => {
    setActiveTimelineReport(report);
    setIsLoadingTimeline(true);
    setTimelineEntries([]);

    try {
      // 1. Fetch from Supabase issue_timelines
      const targetId = report.supabaseId || report.id;
      const remote = await fetchTimelineEntriesFromSupabase(targetId);

      if (remote && remote.length > 0) {
        setTimelineEntries(remote);
      } else {
        // Fallback to localStorage
        const rawHistory = window.localStorage.getItem("unicare_demo_timeline_history");
        if (rawHistory) {
          const parsed = JSON.parse(rawHistory);
          const entries = parsed[report.id] || parsed[targetId] || [];
          setTimelineEntries(entries);
        }
      }
    } catch (err) {
      console.warn("Failed to load timeline entries:", err);
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8faf9] text-slate-800 font-sans overflow-hidden">
      {/* ==================== Sidebar (User Perspective) ==================== */}
      <Suspense fallback={<div className="w-64 flex-shrink-0 hidden md:block" />}>
        <UserSidebar />
      </Suspense>

      {/* ==================== Main Content ==================== */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="รายการแจ้งปัญหาของฉัน (My Reports)"
          subtitle="ติดตามขั้นตอนการดำเนินงาน และพูดคุยซักถามข้อมูลกับเจ้าหน้าที่"
          role="USER"
          userName={userName}
          backHref="/user/dashboard"
        />

        <main className="p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {/* Hero Banner */}
          <section className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#065f46] text-white p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                ติดตามสถานะและสนทนากับเจ้าหน้าที่
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 font-normal">
                หากเจ้าหน้าที่ต้องการข้อมูลเพิ่มเติม หรือคุณต้องการส่งรูปภาพ/เสียงหลักฐานเพิ่ม สามารถกดปุ่ม &quot;สนทนากับเจ้าหน้าที่&quot; ได้ทันที
              </p>
            </div>
            <Link
              href="/user/report"
              className="bg-white text-emerald-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs hover:bg-emerald-50 transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>แจ้งปัญหาใหม่</span>
            </Link>
          </section>

          {/* Cards List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-700" />
                <span>ประวัติเรื่องร้องเรียนทั้งหมด ({reports.length} รายการ)</span>
              </h3>
            </div>

            {reports.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-200/90 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="text-base font-bold text-slate-800">
                    ยังไม่มีรายการแจ้งปัญหาของคุณ
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    คุณ ({userName}) ยังไม่มีประวัติการส่งเรื่องร้องเรียนในระบบ หากพบปัญหาเสียงรบกวน สิ่งแวดล้อม หรือสิ่งอำนวยความสะดวก สามารถกดปุ่ม &quot;แจ้งปัญหาใหม่&quot; เพื่อส่งเรื่องให้เจ้าหน้าที่ได้ทันที
                  </p>
                </div>
                <div>
                  <Link
                    href="/user/report"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1b5e4a] text-white rounded-xl text-xs font-bold hover:bg-[#144737] transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>แจ้งปัญหาแรกของคุณ</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
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
                        {report.status === "rejected" && (
                          <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
                            <X className="w-3.5 h-3.5" />
                            <span>{report.statusLabel}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium notranslate" data-user-content="true">
                      {report.description}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{report.area}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {report.status === "resolved" && (() => {
                          const evaluated = isIssueEvaluated(report.id);
                          const fb = evaluated ? getFeedbackByIssueId(report.id) : undefined;
                          if (evaluated) {
                            return (
                              <Link
                                href={`/user/feedback?id=${encodeURIComponent(report.id)}`}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-medium transition text-xs shadow-xs"
                                title="คลิกเพื่อดูผลการประเมินที่ส่งไปแล้ว"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>ประเมินแล้ว ({fb?.rating || 5} ดาว)</span>
                              </Link>
                            );
                          }
                          return (
                            <Link
                              href={`/user/feedback?id=${encodeURIComponent(report.id)}`}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold transition text-xs shadow-xs animate-pulse"
                              title="คลิกเพื่อประเมินความพึงพอใจ (ประเมินได้ 1 ครั้ง)"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                              <span>ประเมินความพึงพอใจ</span>
                            </Link>
                          );
                        })()}

                        {/* View Timeline Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenTimeline(report)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl font-medium transition text-xs shadow-2xs border border-slate-200 cursor-pointer"
                          title="ดูประวัติและไทม์ไลน์การปฏิบัติงานของเจ้าหน้าที่"
                        >
                          <History className="w-3.5 h-3.5 text-emerald-700" />
                          <span>ดูประวัติไทม์ไลน์</span>
                        </button>

                        {/* Chat / Clarification Button */}
                        <button
                          type="button"
                          onClick={() => setActiveChatReport(report)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1b5e4a] hover:bg-[#144737] text-white rounded-xl font-medium transition text-xs shadow-xs cursor-pointer"
                          title="สนทนาและส่งข้อมูลเพิ่มเติมกับเจ้าหน้าที่"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>สนทนากับเจ้าหน้าที่</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ================= TIMELINE MODAL (User Perspective) ================= */}
      {activeTimelineReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="hero-gradient px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4" />
                <h3 className="font-bold text-sm">
                  ประวัติไทม์ไลน์ความคืบหน้า #{activeTimelineReport.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTimelineReport(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Report Header Card */}
              <div className="bg-[#f8faf9] p-3.5 rounded-xl border border-slate-200 flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-xs">
                    {activeTimelineReport.category} — {activeTimelineReport.area}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 notranslate" data-user-content="true">
                    {activeTimelineReport.description}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                  {activeTimelineReport.statusLabel}
                </span>
              </div>

              {/* Timeline Entries List */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-700 flex items-center justify-between">
                  <span>ขั้นตอนการปฏิบัติงาน (issue_timelines)</span>
                  {isLoadingTimeline && (
                    <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" /> โหลดข้อมูลล่าสุด...
                    </span>
                  )}
                </h4>

                {isLoadingTimeline && timelineEntries.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-[#f8faf9] rounded-xl border border-dashed border-slate-200 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>กำลังดึงข้อมูลประวัติไทม์ไลน์...</span>
                  </div>
                ) : timelineEntries.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-[#f8faf9] rounded-xl border border-dashed border-slate-200 text-xs">
                    ยังไม่มีรายการบันทึกไทม์ไลน์สำหรับเคสนี้
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {timelineEntries.map((t, idx) => (
                      <div
                        key={t.id || idx}
                        className="flex items-start space-x-3 p-3.5 bg-[#f8faf9] rounded-xl border border-slate-100"
                      >
                        <div className={`w-2.5 h-2.5 mt-1.5 rounded-full ${t.color || "bg-emerald-600"} shrink-0 ring-4 ring-slate-100`} />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between font-semibold text-slate-700">
                            <span className="truncate">{t.statusText}</span>
                            <span className="text-slate-400 font-normal shrink-0 text-[10px] ml-2">{t.time}</span>
                          </div>
                          {t.note && (
                            <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-wrap notranslate" data-user-content="true">
                              {t.note}
                            </p>
                          )}
                          {(t.evidenceFile || t.evidenceUrl) && (
                            <div className="pt-1">
                              {t.evidenceUrl && (t.evidenceUrl.startsWith("data:image/") || t.evidenceUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)) ? (
                                <div className="mt-1">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={t.evidenceUrl}
                                    alt={t.evidenceFile || "หลักฐานการปฏิบัติงาน"}
                                    className="max-h-28 rounded-lg border border-slate-200 object-cover cursor-pointer hover:opacity-90 transition bg-white"
                                    onClick={() => window.open(t.evidenceUrl!, "_blank")}
                                  />
                                  {t.evidenceFile && (
                                    <span className="text-[10px] text-slate-500 mt-0.5 block">{t.evidenceFile}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium">
                                  <Paperclip className="w-3 h-3 text-emerald-600" />
                                  <span className="truncate max-w-xs">{t.evidenceFile || "ไฟล์แนบหลักฐาน"}</span>
                                </span>
                              )}
                            </div>
                          )}
                          <div className="text-[10px] text-[#1b5e4a] pt-0.5 font-medium">
                            - ดำเนินการโดย: <span className="notranslate font-semibold" data-user-content="true">{t.author}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTimelineReport(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-100 transition cursor-pointer text-xs"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CLARIFICATION CHAT DRAWER (User Perspective) ================= */}
      <CaseClarificationDrawer
        isOpen={Boolean(activeChatReport)}
        reportId={activeChatReport ? activeChatReport.id : null}
        issueId={activeChatReport ? (activeChatReport.supabaseId || activeChatReport.id) : null}
        reportTitle={activeChatReport ? `${activeChatReport.category} - ${activeChatReport.area}` : undefined}
        onClose={() => setActiveChatReport(null)}
        currentUserRole="user"
        currentUserName={userName || getDemoSession()?.name || "ผู้แจ้ง"}
        currentUserId={getDemoSession()?.email || getDemoSession()?.id || "user"}
        reporterName={activeChatReport?.reporterName || userName}
        reporterEmail={activeChatReport?.reporterEmail || getDemoSession()?.email}
        assignedAdminName={activeChatReport?.adminName}
      />
    </div>
  );
}
