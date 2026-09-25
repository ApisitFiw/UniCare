"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";
import { getDemoSession } from "@/lib/authService";
import { getAllCurrentIssues, getCategoryIcon, type IssueItem } from "@/lib/issuesData";
import {
  saveFeedback,
  isIssueEvaluated,
  getFeedbackByIssueId,
  type FeedbackItem,
} from "@/lib/feedbackData";
import { createFeedbackInSupabase } from "@/lib/supabaseService";
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  FolderOpen,
  Lock,
  Sparkles,
  AlertOctagon,
  XCircle,
  Zap,
  Megaphone,
} from "lucide-react";

const starDescriptions = [
  "",
  "ควรปรับปรุงเร่งด่วน (1 ดาว)",
  "พอใช้ แต่ยังมีข้อบกพร่อง (2 ดาว)",
  "ปานกลาง เป็นไปตามมาตรฐาน (3 ดาว)",
  "ดีมาก แก้ปัญหาได้เรียบร้อย (4 ดาว)",
  "ยอดเยี่ยม ประทับใจมาก (5 ดาว)",
];

const criteriaList = [
  { id: 1, text: "1. ความรวดเร็วในการเข้าตรวจสอบและระงับเหตุ" },
  { id: 2, text: "2. การแก้ไขปัญหาเสร็จสิ้นได้ทันเวลาที่นัดหมาย" },
  { id: 3, text: "3. ความสุภาพและการพูดจาประสานงานของเจ้าหน้าที่" },
  { id: 4, text: "4. ความเป็นมืออาชีพและความพร้อมของอุปกรณ์ในการแก้ปัญหา" },
  { id: 5, text: "5. การอัปเดตสถานะและขั้นตอนการทำงานอย่างต่อเนื่อง" },
  { id: 6, text: "6. คำชี้แจงและบันทึกผลการปฏิบัติงานมีความชัดเจน" },
  { id: 7, text: "7. การรักษาความสะอาดและความเรียบร้อยหลังทำงานเสร็จ" },
  { id: 8, text: "8. ปัญหาสิ่งแวดล้อม/เสียงรบกวนได้รับการแก้ไขอย่างตรงจุด" },
  { id: 9, text: "9. ความมั่นใจในมาตรการป้องกันไม่ให้เกิดปัญหาซ้ำ" },
  { id: 10, text: "10. ความสะดวกและความพึงพอใจต่อระบบแจ้งเหตุ UniCare" },
];

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryIssueId = searchParams.get("id");

  const [userName, setUserName] = useState<string>("กิตติภูมิ");
  const [overallRating, setOverallRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbacksVersion, setFeedbacksVersion] = useState<number>(0);

  const [criteriaScores, setCriteriaScores] = useState<Record<number, number>>({
    1: 5,
    2: 5,
    3: 5,
    4: 5,
    5: 5,
    6: 5,
    7: 5,
    8: 5,
    9: 5,
    10: 5,
  });

  const [isSolved, setIsSolved] = useState<"yes" | "no">("yes");
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  // Issues data & selected issue
  const [allResolvedIssues, setAllResolvedIssues] = useState<IssueItem[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);

  const refreshFeedbacks = useCallback(() => {
    setFeedbacksVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    window.addEventListener("unicare-feedbacks-updated", refreshFeedbacks);
    window.addEventListener("storage", refreshFeedbacks);
    return () => {
      window.removeEventListener("unicare-feedbacks-updated", refreshFeedbacks);
      window.removeEventListener("storage", refreshFeedbacks);
    };
  }, [refreshFeedbacks]);

  useEffect(() => {
    // 1. Load user session
    const session = getDemoSession();
    if (session?.name) {
      setUserName(session.name);
    }

    async function loadUserData() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.user_metadata?.full_name) {
          setUserName(authData.user.user_metadata.full_name);
        }
      } catch {
        // Fallback to session
      }
    }
    loadUserData();

    // 2. Load issues to find the target case
    const allIssues = getAllCurrentIssues();
    const resolved = allIssues.filter((i) => i.status === "resolved");
    setAllResolvedIssues(resolved);

    if (queryIssueId) {
      const match = allIssues.find(
        (i) => i.id === queryIssueId || i.id === queryIssueId.replace(/^#/, "")
      );
      if (match) {
        setSelectedIssue(match);
        return;
      }
    }

    // Default: prioritize first UN-evaluated resolved issue
    const pendingCases = resolved.filter((i) => !isIssueEvaluated(i.id));
    if (pendingCases.length > 0) {
      setSelectedIssue(pendingCases[0]);
    } else if (resolved.length > 0) {
      setSelectedIssue(resolved[0]);
    } else if (allIssues.length > 0) {
      setSelectedIssue(allIssues[0]);
    }
  }, [queryIssueId]);

  // Check if currently selected case is already evaluated
  const isEvaluated = useMemo(() => {
    if (!selectedIssue) return false;
    return isIssueEvaluated(selectedIssue.id);
  }, [selectedIssue, feedbacksVersion]);

  const existingFeedback = useMemo(() => {
    if (!selectedIssue) return undefined;
    return getFeedbackByIssueId(selectedIssue.id);
  }, [selectedIssue, feedbacksVersion]);

  // Sync form inputs with existing feedback or reset
  useEffect(() => {
    if (existingFeedback) {
      setOverallRating(existingFeedback.rating || 5);
      if (existingFeedback.criteriaScores) {
        setCriteriaScores(existingFeedback.criteriaScores);
      }
      setIsSolved(existingFeedback.isSolved ? "yes" : "no");
      setFeedbackText(existingFeedback.comment || "");
    } else {
      setOverallRating(0);
      setHoverRating(0);
      setCriteriaScores({
        1: 5,
        2: 5,
        3: 5,
        4: 5,
        5: 5,
        6: 5,
        7: 5,
        8: 5,
        9: 5,
        10: 5,
      });
      setIsSolved("yes");
      setFeedbackText("");
    }
  }, [existingFeedback, selectedIssue]);

  const pendingEvaluationCases = useMemo(() => {
    return allResolvedIssues.filter((i) => !isIssueEvaluated(i.id));
  }, [allResolvedIssues, feedbacksVersion]);

  // คำนวณคะแนนเฉลี่ยของ 10 ข้อย่อย
  const criteriaAvg = useMemo(() => {
    const scores = Object.values(criteriaScores);
    if (scores.length === 0) return 5;
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / scores.length).toFixed(1));
  }, [criteriaScores]);

  // ตรวจจับความขัดแย้งของคะแนน (Smart Conflict Detection)
  const ratingConflict = useMemo(() => {
    if (isEvaluated || overallRating === 0) return null;

    const diff = Math.abs(overallRating - criteriaAvg);
    const roundedAvg = Math.max(1, Math.min(5, Math.round(criteriaAvg)));

    // กรณีที่ 1: ดาวภาพรวมสูงมาก (4-5 ดาว) แต่คะแนนย่อยเฉลี่ยต่ำมาก (<= 2.5) เช่น ให้ 5 ดาวแต่ประเมินย่อย 1 หมด
    if (overallRating >= 4 && criteriaAvg <= 2.5) {
      return {
        isSevere: true,
        diff,
        title: "คะแนนภาพรวมและคะแนนประเมินรายข้อขัดแย้งกันอย่างสิ้นเชิง",
        description: `คุณให้คะแนนภาพรวม ${overallRating} ดาว (ดีมาก/ยอดเยี่ยม) แต่ผลการประเมิน 10 ข้อย่อยเฉลี่ยเพียง ${criteriaAvg} ดาว ซึ่งขัดแย้งกันโดยตรง ระบบไม่สามารถบันทึกข้อมูลที่ขัดแย้งกันได้`,
        suggestedStar: roundedAvg,
        suggestedCriteriaScore: overallRating,
      };
    }

    // กรณีที่ 2: ดาวภาพรวมต่ำมาก (1-2 ดาว) แต่คะแนนย่อยเฉลี่ยสูงมาก (>= 3.8)
    if (overallRating <= 2 && criteriaAvg >= 3.8) {
      return {
        isSevere: true,
        diff,
        title: "คะแนนภาพรวมและคะแนนประเมินรายข้อขัดแย้งกันอย่างสิ้นเชิง",
        description: `คุณให้คะแนนภาพรวมเพียง ${overallRating} ดาว (ควรปรับปรุง/พอใช้) แต่ผลการประเมิน 10 ข้อย่อยเฉลี่ยสูงถึง ${criteriaAvg} ดาว ซึ่งขัดแย้งกันโดยตรง ระบบไม่สามารถบันทึกข้อมูลที่ขัดแย้งกันได้`,
        suggestedStar: roundedAvg,
        suggestedCriteriaScore: overallRating,
      };
    }

    // กรณีที่ 3: ผลต่างระหว่างดาวภาพรวมและคะแนนเฉลี่ยต่างกันตั้งแต่ 1.8 ดาวขึ้นไป
    if (diff >= 1.8) {
      return {
        isSevere: true,
        diff,
        title: "คะแนนภาพรวมและคะแนนเฉลี่ย 10 ข้อมีความแตกต่างกันมากเกินเกณฑ์",
        description: `คะแนนภาพรวม (${overallRating} ดาว) และคะแนนเฉลี่ย 10 ข้อย่อย (${criteriaAvg} ดาว) ต่างกัน ${diff.toFixed(1)} ดาว โปรดปรับให้สอดคล้องกัน`,
        suggestedStar: roundedAvg,
        suggestedCriteriaScore: overallRating,
      };
    }

    // กรณีที่ 4: ความขัดแย้งกับผลลัพธ์หน้างาน (Soft Warning) เช่น ให้ 5 ดาวแต่ระบุว่าปัญหายังไม่หมดสิ้น
    if (overallRating >= 4 && isSolved === "no") {
      return {
        isSevere: false,
        diff,
        title: "ข้อสังเกต: คุณระบุว่ายังพบปัญหาเดิม แต่ให้คะแนนระดับสูง",
        description: "คุณให้คะแนนภาพรวม 4-5 ดาว แต่ระบุว่า 'ยังพบปัญหาเดิมอยู่' หากต้องการให้ทีมงานเข้าตรวจสอบซ้ำ โปรดระบุเหตุผลในช่องข้อเสนอแนะเพิ่มเติมด้านล่างครับ",
        suggestedStar: roundedAvg,
        suggestedCriteriaScore: overallRating,
      };
    }

    return null;
  }, [overallRating, criteriaAvg, isSolved, isEvaluated]);

  const hasConflict = ratingConflict !== null;

  // ฟังก์ชัน 1-Click ปรับดาวภาพรวมตามผลเฉลี่ยของ 10 ข้อ
  const handleHarmonizeOverallStar = () => {
    if (!ratingConflict) return;
    setOverallRating(ratingConflict.suggestedStar);
    setHoverRating(0);
  };

  // ฟังก์ชัน 1-Click ปรับคะแนน 10 ข้อทั้งหมดตามดาวภาพรวม
  const handleHarmonizeCriteriaScores = () => {
    if (!ratingConflict) return;
    const targetScore = ratingConflict.suggestedCriteriaScore;
    const updatedScores: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) {
      updatedScores[i] = targetScore;
    }
    setCriteriaScores(updatedScores);
  };

  const handleCriteriaChange = (questionId: number, score: number) => {
    if (isEvaluated) return;
    setCriteriaScores((prev) => ({
      ...prev,
      [questionId]: score,
    }));
  };

  const handleEvaluationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEvaluated) {
      alert("เคสนี้ได้รับการประเมินความพึงพอใจไปแล้ว ไม่สามารถประเมินซ้ำได้ครับ");
      return;
    }

    if (overallRating === 0) {
      alert("กรุณาคลิกเลือกดาวเพื่อประเมินระดับความพึงพอใจในภาพรวมก่อนส่งครับ");
      return;
    }

    // บล็อกการส่งหากคะแนนขัดแย้งกันอย่างรุนแรง
    if (ratingConflict && ratingConflict.isSevere) {
      alert(
        `ไม่สามารถส่งแบบประเมินได้ เนื่องจากคะแนนขัดแย้งกัน:\n- คะแนนภาพรวม: ${overallRating} ดาว\n- คะแนนเฉลี่ย 10 ข้อย่อย: ${criteriaAvg} ดาว\n\nโปรดกดปุ่มปรับคะแนนให้อัตโนมัติ (Smart Harmonize) หรือแก้ไขคะแนนให้สอดคล้องกันก่อนส่งครับ`
      );
      const alertElem = document.getElementById("conflict-alert-bottom");
      if (alertElem) {
        alertElem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (hasConflict && !ratingConflict?.isSevere && feedbackText.trim() === "") {
      alert(
        "คุณประเมินดาวระดับสูงแต่ระบุว่ายังพบปัญหาเดิม โปรดพิมพ์ข้อเสนอแนะเพื่อให้ทีมงานนำไปแก้ไขได้ตรงจุดครับ"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const reportIdStr = selectedIssue?.id || "ISS-2026-102";
      const newFeedback: FeedbackItem = {
        id: String(Date.now()),
        issueId: reportIdStr,
        reportCode: reportIdStr.startsWith("#") ? reportIdStr : `#${reportIdStr}`,
        userName: userName || "ผู้ใช้งาน",
        category: selectedIssue?.category || "เสียงรบกวน",
        categoryIcon: getCategoryIcon(selectedIssue?.category || ""),
        location: selectedIssue?.area || "หอพักนักศึกษาชาย 3",
        rating: overallRating,
        isSolved: isSolved === "yes",
        comment:
          feedbackText.trim() ||
          (isSolved === "yes"
            ? "การแก้ไขเรียบร้อยดี ขอบคุณครับ"
            : "ยังมีปัญหาเดิมอยู่ ต้องการให้เข้าตรวจซ้ำ"),
        reinspected: false,
        criteriaScores,
        createdAt: new Date().toISOString(),
      };

      // 1. บันทึกลงระบบ feedback data (มีระบบตรวจจับไม่ให้บันทึกซ้ำ)
      const result = saveFeedback(newFeedback);
      if (!result.success) {
        alert(result.message || "ไม่สามารถส่งแบบประเมินซ้ำได้");
        setIsSubmitting(false);
        return;
      }

      // 2. บันทึกลง Supabase table feedbacks
      try {
        await createFeedbackInSupabase(newFeedback);
      } catch (err) {
        console.warn("Supabase feedback direct insert failed:", err);
      }

      setShowToast(true);
      setFeedbacksVersion((v) => v + 1);

      setTimeout(() => {
        setShowToast(false);
        router.push("/my-reports");
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  const caseCode = selectedIssue?.id
    ? selectedIssue.id.startsWith("#")
      ? selectedIssue.id
      : `#${selectedIssue.id}`
    : "#REC-20260907-004";
  const caseTitle = selectedIssue?.description || "เสียงเปิดเพลงและกีตาร์ดังยามวิกาล";
  const caseLocation = selectedIssue?.area || "หอพักนักศึกษาชาย 3 (ชั้น 4)";
  const caseDate = selectedIssue?.date || "07 ก.ย. 2568 • 14:20 น.";

  return (
    <div className="bg-[#f4f7f5] text-slate-800 antialiased min-h-screen flex flex-col font-['Prompt',sans-serif]">
      {/* ส่วนหัว Header */}
      <Header
        title="ระบบประเมินผลการแก้ไขปัญหา (Feedback & Rating)"
        subtitle="UniCare • ยกระดับคุณภาพการจัดการสิ่งแวดล้อมภายในมหาวิทยาลัย"
        userName={userName}
        role="USER"
        backHref="/my-reports"
      />

      {/* ส่วนเนื้อหาหลัก (Main Content) */}
      <main className="p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">
        {/* Banner */}
        <section className="rounded-2xl bg-gradient-to-r from-[#0e4435] via-[#145946] to-[#1b6852] text-white p-6 sm:p-7 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="bg-emerald-400/20 text-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30 inline-block">
              เคสเสร็จสิ้นแล้ว (Resolved)
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight pt-1">
              ร่วมประเมินความพึงพอใจการให้บริการ
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-normal">
              ความคิดเห็นของคุณมีความสำคัญยิ่งต่อการปรับปรุงการทำงานของทีมสวัสดิการมหาวิทยาลัยวลัยลักษณ์
            </p>
          </div>
          <div className="hidden sm:flex p-3 bg-white/10 rounded-2xl border border-white/20 text-amber-300">
            <Star className="w-8 h-8 fill-amber-300" />
          </div>
        </section>

        {/* สรุปข้อมูลเคส */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          {/* แถวที่ 1: บรรทัดชื่อเคส และสถานะ (ไม่มีปุ่มเลือกเคสมาปนในบรรทัดนี้) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100/80 shadow-2xs shrink-0">
                <Megaphone className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 notranslate" data-user-content="true">
                  {caseTitle}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  รหัสเคส: {caseCode} • หมวดหมู่: {selectedIssue?.category || "ทั่วไป"}
                </p>
              </div>
            </div>

            <div>
              {isEvaluated ? (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300 inline-flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ประเมินแล้ว (เสร็จสิ้น)</span>
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ดำเนินการแก้ไขแล้ว</span>
                </span>
              )}
            </div>
          </div>

          {/* แถวที่ 2: แถบเลือกเคส (อยู่ด้านล่างชื่อเคสตลอด ไม่ขึ้นไปบรรทัดเดียวกับชื่อเคส) */}
          {allResolvedIssues.length > 0 && (
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2 shrink-0">
                <FolderOpen className="w-4 h-4 text-emerald-700" />
                <label
                  htmlFor="case-select-dropdown"
                  className="text-xs font-semibold text-slate-700"
                >
                  เลือกเคสที่ต้องการประเมิน:
                </label>
              </div>
              <div className="flex-1 max-w-xl">
                <select
                  id="case-select-dropdown"
                  value={selectedIssue?.id || ""}
                  onChange={(e) => {
                    const found = allResolvedIssues.find(
                      (i) => i.id === e.target.value
                    );
                    if (found) setSelectedIssue(found);
                  }}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs cursor-pointer"
                >
                  {allResolvedIssues.map((issue) => {
                    const evaluated = isIssueEvaluated(issue.id);
                    return (
                      <option key={issue.id} value={issue.id}>
                        #{issue.id} - {issue.category} ({issue.area}){" "}
                        {evaluated ? "[ประเมินแล้ว]" : "[รอประเมิน]"}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

          {/* แจ้งเตือนเมื่อเคสนี้ได้รับการประเมินไปแล้ว */}
          {isEvaluated && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-emerald-900">
                  เคสนี้ได้รับการประเมินความพึงพอใจแล้ว (ระบบอนุญาตให้ประเมินได้ 1 ครั้งต่อเคส)
                </span>
                <p className="text-[11px] text-emerald-700">
                  คุณได้ให้คะแนนความพึงพอใจภาพรวม {existingFeedback?.rating} ดาว{" "}
                  {existingFeedback?.createdAt
                    ? `เมื่อ ${new Date(existingFeedback.createdAt).toLocaleDateString("th-TH")}`
                    : ""}{" "}
                  ข้อมูลด้านล่างแสดงผลการประเมินที่คุณได้ส่งไป
                </p>
              </div>
            </div>
          )}

          {/* ข้อมูลสถานที่ วันเวลา และเจ้าหน้าที่ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="p-2.5 bg-[#f8faf9] rounded-xl border border-slate-100 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-slate-400 block">
                  สถานที่เกิดเหตุ:
                </span>
                <span className="font-semibold text-slate-800">
                  {caseLocation}
                </span>
              </div>
            </div>
            <div className="p-2.5 bg-[#f8faf9] rounded-xl border border-slate-100 flex items-start gap-2">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-slate-400 block">
                  เวลาที่แจ้งเรื่อง:
                </span>
                <span className="font-semibold text-slate-800">
                  {caseDate}
                </span>
              </div>
            </div>
            <div className="p-2.5 bg-[#f8faf9] rounded-xl border border-slate-100 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-slate-400 block">
                  ผู้รับผิดชอบดูแล:
                </span>
                <span className="font-semibold text-slate-800">
                  {selectedIssue?.adminName || "ทีมสายตรวจมหาวิทยาลัยวลัยลักษณ์"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-slate-700">
            <span className="font-bold text-emerald-900">
              บันทึกการปฏิบัติงานของเจ้าหน้าที่ (Action Log):{" "}
            </span>
            &quot;เจ้าหน้าที่สายตรวจและผู้รับผิดชอบเข้าตรวจสอบพื้นที่ ดำเนินการระงับเหตุและปรับปรุงพื้นที่เรียบร้อยตามมาตรฐานความปลอดภัย&quot;
          </div>
        </div>

        {/* แบบฟอร์มประเมิน */}
        <form
          onSubmit={handleEvaluationSubmit}
          className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6"
        >
          {/* ส่วนที่ 1: คะแนนดาวภาพรวม */}
          <div className="space-y-2 text-center pb-6 border-b border-slate-100">
            <div className="flex items-center justify-center gap-1.5">
              <label className="block text-sm font-bold text-slate-800">
                ความพึงพอใจในภาพรวมต่อการแก้ปัญหาครั้งนี้
              </label>
              {!isEvaluated && <span className="text-rose-500 font-bold">*</span>}
              {isEvaluated && <Lock className="w-3.5 h-3.5 text-slate-400 inline" />}
            </div>
            <p className="text-xs text-slate-400">
              {isEvaluated
                ? "คะแนนดาวที่คุณได้ประเมินไว้สำหรับเคสนี้"
                : "คลิกเลือกดาวเพื่อประเมินระดับความพึงพอใจ"}
            </p>

            <div className="flex justify-center items-center space-x-2 text-4xl text-slate-200 py-2 select-none">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  disabled={isEvaluated}
                  onMouseEnter={() => !isEvaluated && setHoverRating(star)}
                  onMouseLeave={() => !isEvaluated && setHoverRating(0)}
                  onClick={() => !isEvaluated && setOverallRating(star)}
                  className={`transition-transform p-1 ${
                    isEvaluated ? "cursor-default" : "cursor-pointer hover:scale-110"
                  }`}
                  aria-label={`${star} ดาว`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      (hoverRating || overallRating) >= star
                        ? "fill-amber-400 text-amber-400 scale-105"
                        : "fill-slate-100 text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold text-[#154c3c] h-4">
              {starDescriptions[hoverRating || overallRating]}
            </p>
          </div>

          {/* ส่วนที่ 2: รายละเอียด 10 ข้อ */}
          <div className="space-y-4 pb-6 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>ประเมินรายละเอียดการบริการ (10 ข้อสำคัญ)</span>
                {isEvaluated && <Lock className="w-3.5 h-3.5 text-slate-400" />}
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  คะแนนเฉลี่ย: <span className="text-emerald-700 font-bold">{criteriaAvg}</span> / 5.0
                </span>
                {ratingConflict?.isSevere && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>ขัดแย้งกับดาวภาพรวม ({overallRating} ดาว)</span>
                  </span>
                )}
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  (1 = ควรปรับปรุงเร่งด่วน, 5 = ยอดเยี่ยม)
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs space-y-2">
              {criteriaList.map((item) => (
                <div
                  key={item.id}
                  className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <span className="font-medium text-slate-700">
                    {item.text}
                  </span>
                  <div className="flex items-center space-x-3 text-slate-600 shrink-0">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <label
                        key={val}
                        className={`flex items-center space-x-1 ${
                          isEvaluated ? "cursor-default opacity-85" : "cursor-pointer hover:text-emerald-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${item.id}`}
                          value={val}
                          disabled={isEvaluated}
                          checked={criteriaScores[item.id] === val}
                          onChange={() => handleCriteriaChange(item.id, val)}
                          className="text-[#1b5e4a] focus:ring-0 cursor-pointer disabled:cursor-default"
                        />
                        <span className="text-xs">{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ส่วนที่ 3: สถานะหน้างาน */}
          <div className="bg-[#f8faf9] p-4 rounded-xl border border-slate-200/70 space-y-2">
            <span className="text-xs font-bold text-slate-800 block">
              ผลลัพธ์ในปัจจุบัน: ปัญหานี้ได้รับการแก้ไขหมดสิ้นแล้วหรือไม่?
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-slate-700">
              <label
                className={`flex items-center space-x-2 ${
                  isEvaluated ? "cursor-default" : "cursor-pointer hover:text-emerald-900"
                }`}
              >
                <input
                  type="radio"
                  name="is_solved"
                  value="yes"
                  disabled={isEvaluated}
                  checked={isSolved === "yes"}
                  onChange={() => !isEvaluated && setIsSolved("yes")}
                  className="text-emerald-700 focus:ring-0 cursor-pointer disabled:cursor-default"
                />
                <span className="font-medium flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ปัญหาหมดสิ้นแล้ว ไม่ถูกรบกวนอีก</span>
                </span>
              </label>
              <label
                className={`flex items-center space-x-2 ${
                  isEvaluated ? "cursor-default" : "cursor-pointer hover:text-rose-900"
                }`}
              >
                <input
                  type="radio"
                  name="is_solved"
                  value="no"
                  disabled={isEvaluated}
                  checked={isSolved === "no"}
                  onChange={() => !isEvaluated && setIsSolved("no")}
                  className="text-rose-600 focus:ring-0 cursor-pointer disabled:cursor-default"
                />
                <span className="font-medium text-rose-700 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>ยังพบปัญหาเดิมอยู่ (ต้องการให้เข้าตรวจซ้ำ)</span>
                </span>
              </label>
            </div>
          </div>

          {/* ส่วนที่ 4: ข้อเสนอแนะ */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-slate-700">
              ข้อเสนอแนะเพิ่มเติม หรือจุดที่ต้องการให้ปรับปรุง{" "}
              {hasConflict && !isEvaluated && (
                <span className="text-rose-500 font-semibold">
                  * (จำเป็นต้องระบุเนื่องจากมีคะแนนแย้ง)
                </span>
              )}
            </label>
            <textarea
              rows={3}
              value={feedbackText}
              disabled={isEvaluated}
              onChange={(e) => !isEvaluated && setFeedbackText(e.target.value)}
              placeholder={
                isEvaluated
                  ? "ไม่มีข้อเสนอแนะเพิ่มเติม"
                  : hasConflict
                    ? "โปรดระบุจุดที่ควรปรับปรุงเพิ่มเติม เนื่องจากมีบางหัวข้อที่คุณประเมินในระดับต่ำ..."
                    : "ระบุข้อคิดเห็นเพื่อให้ทีมงานนำไปปรับปรุง เช่น อยากให้เพิ่มรอบตรวจช่วงดึก หรือมีมาตรการป้องกันเพิ่มเติม..."
              }
              className={`w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none transition resize-none ${
                isEvaluated
                  ? "bg-slate-100 text-slate-600 cursor-default"
                  : "bg-[#f9fcfa] focus:ring-1 focus:ring-[#1b5e4a]"
              }`}
            />
          </div>

          {/* ปุ่มการทำงาน */}
          {isEvaluated ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>คุณได้ทำการประเมินเคสนี้เรียบร้อยแล้ว (ไม่สามารถประเมินซ้ำได้)</span>
              </span>

              <div className="flex items-center gap-2">
                {pendingEvaluationCases.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIssue(pendingEvaluationCases[0]);
                    }}
                    className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition cursor-pointer"
                  >
                    ประเมินเคสถัดไปที่ยังค้างอยู่ ({pendingEvaluationCases.length}) →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => router.push("/my-reports")}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  กลับหน้ารายการของฉัน
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              {ratingConflict?.isSevere && (
                <div
                  id="conflict-alert-bottom"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-rose-50/95 border border-rose-300 rounded-2xl text-xs shadow-xs"
                >
                  <div className="flex items-start gap-2.5 text-rose-900">
                    <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-sm block">ไม่อนุญาตให้ส่ง: คะแนนประเมินยังขัดแย้งกัน</span>
                      <p className="text-xs text-rose-700 font-normal mt-0.5">
                        คะแนนภาพรวมได้ {overallRating} ดาว แต่คะแนนเฉลี่ย 10 ข้อย่อยได้ {criteriaAvg} ดาว (โปรดปรับให้สอดคล้องกัน)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={handleHarmonizeOverallStar}
                      className="px-3.5 py-2 bg-white text-emerald-800 font-bold text-xs border border-emerald-300 hover:bg-emerald-50 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>ปรับดาวภาพรวมเป็น {ratingConflict.suggestedStar} ดาว</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleHarmonizeCriteriaScores}
                      className="px-3.5 py-2 bg-[#1b5e4a] text-white font-bold text-xs hover:bg-[#154c3c] rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>ปรับ 10 ข้อเป็น {ratingConflict.suggestedCriteriaScore} ดาว</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push("/my-reports")}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  ไว้ประเมินภายหลัง
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || ratingConflict?.isSevere}
                  className={`px-6 py-2.5 text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 ${
                    ratingConflict?.isSevere
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed opacity-80"
                      : "text-white bg-[#1b5e4a] hover:bg-[#154c3c] cursor-pointer disabled:opacity-50"
                  }`}
                  title={
                    ratingConflict?.isSevere
                      ? "กรุณาปรับคะแนนให้สอดคล้องกันก่อนส่งแบบประเมิน"
                      : "คลิกเพื่อส่งผลการประเมิน"
                  }
                >
                  <span>
                    {isSubmitting
                      ? "กำลังส่งแบบประเมิน..."
                      : ratingConflict?.isSevere
                        ? "คะแนนขัดแย้งกัน (โปรดปรับคะแนน)"
                        : "ส่งแบบประเมิน"}
                  </span>
                  {!ratingConflict?.isSevere && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-[#0f382c] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500/30 flex items-center space-x-3 z-50 animate-bounce">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold">บันทึกผลการประเมินสำเร็จ!</p>
            <p className="text-[11px] text-emerald-200">
              ขอบคุณที่ร่วมเป็นส่วนหนึ่งในการพัฒนามหาวิทยาลัยวลัยลักษณ์
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserFeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          กำลังโหลดแบบประเมิน...
        </div>
      }
    >
      <FeedbackContent />
    </Suspense>
  );
}
