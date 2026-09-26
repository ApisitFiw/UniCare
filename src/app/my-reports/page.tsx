"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getDemoSession } from "@/lib/authService";
import Header from "@/components/Header";
import CaseClarificationDrawer from "@/components/CaseClarificationDrawer";
import UserSidebar from "@/components/UserSidebar";
import { getAllCurrentIssues } from "@/lib/issuesData";
import { fetchIssuesFromSupabase } from "@/lib/supabaseService";
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
} from "lucide-react";
import { isIssueEvaluated, getFeedbackByIssueId } from "@/lib/feedbackData";

interface UserReportItem {
  id: string;
  date: string;
  category: string;
  area: string;
  description: string;
  status: "pending" | "in_progress" | "resolved" | "rejected";
  statusLabel: string;
}

export default function MyReportsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("สมชาย ใจดี");
  const [activeChatReport, setActiveChatReport] = useState<UserReportItem | null>(null);
  const [reports, setReports] = useState<UserReportItem[]>([]);

  const loadReports = useCallback(() => {
    if (typeof window === "undefined") {
      setReports([]);
      return;
    }

    const session = getDemoSession();
    const currentName = (session?.name || "").trim().toLowerCase();
    const currentEmail = (session?.email || "").trim().toLowerCase();

    const allIssues = getAllCurrentIssues();
    const myIssues = allIssues.filter((i) => {
      const repName = (i.reporterName || "").trim().toLowerCase();
      const repEmail = (i.reporterEmail || "").trim().toLowerCase();

      // Check email match
      if (currentEmail && repEmail && currentEmail === repEmail) return true;
      // Check alias user@unicare.local
      if (
        currentEmail === "user@unicare.local" &&
        (repEmail === "somchai@example.com" ||
          repName.includes("สมชาย") ||
          repEmail === "kittipoom@example.com" ||
          repName.includes("กิตติภูมิ"))
      ) {
        return true;
      }
      // Check name match
      if (currentName && repName && currentName === repName) return true;

      return false;
    });

    const mappedReports: UserReportItem[] = myIssues.map((item) => {
      let statusKey: "pending" | "in_progress" | "resolved" | "rejected" = item.status;
      let statusLabel = item.statusLabel;
      if (item.status === "in_progress") {
        statusLabel = "กำลังดำเนินการ";
      } else if (item.status === "resolved") {
        statusLabel = "แก้ไขสำเร็จ";
      } else {
        statusLabel = "รอรับเรื่อง";
      }

      return {
        id: item.id,
        date: item.date,
        category: item.category,
        area: item.area,
        description: item.description,
        status: statusKey,
        statusLabel,
      };
    });

    setReports(mappedReports);
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
    fetchIssuesFromSupabase().then((issues) => {
      if (issues && issues.length > 0) {
        try {
          const saved = window.localStorage.getItem("unicare_demo_issue_reports");
          const current = saved ? JSON.parse(saved) : [];
          issues.forEach((remote) => {
            const idx = current.findIndex(
              (l: any) => String(l.id) === remote.id || String(l.issue_id) === remote.id
            );
            if (idx >= 0) {
              current[idx].status = remote.status;
            }
          });
          window.localStorage.setItem("unicare_demo_issue_reports", JSON.stringify(current));
          handleUpdate();
        } catch {
          // ignore
        }
      }
    });

    const channel = supabase
      .channel("unicare-user-issues-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, () => {
        fetchIssuesFromSupabase().then((issues) => {
          if (issues && issues.length > 0) {
            try {
              const saved = window.localStorage.getItem("unicare_demo_issue_reports");
              const current = saved ? JSON.parse(saved) : [];
              issues.forEach((remote) => {
                const idx = current.findIndex(
                  (l: any) => String(l.id) === remote.id || String(l.issue_id) === remote.id
                );
                if (idx >= 0) {
                  current[idx].status = remote.status;
                }
              });
              window.localStorage.setItem("unicare_demo_issue_reports", JSON.stringify(current));
              handleUpdate();
            } catch {
              // ignore
            }
          }
        });
      })
      .subscribe();

    // 4. Listen to real-time updates from admin actions and user reports
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("unicare-demo-reports-updated", handleUpdate);
    window.addEventListener("unicare-profile-updated", handleUpdate);
    window.addEventListener("unicare-feedbacks-updated", handleUpdate);

    return () => {
      channel.unsubscribe();
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("unicare-demo-reports-updated", handleUpdate);
      window.removeEventListener("unicare-profile-updated", handleUpdate);
      window.removeEventListener("unicare-feedbacks-updated", handleUpdate);
    };
  }, [loadReports, router]);

  return (
    <div className="bg-[#f4f7f5] text-slate-800 antialiased min-h-screen flex font-['Prompt',sans-serif]">
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>แจ้งปัญหาใหม่</span>
                  </Link>
                </div>
              </div>
            ) : (
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
                  </div>
                ))}
              </div>
            )}
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
        currentUserName={userName ? `${userName} (ผู้แจ้ง)` : "กิตติภูมิ (ผู้แจ้ง)"}
      />
    </div>
  );
}
