import {
  createFeedbackInSupabase,
  fetchFeedbacksFromSupabase,
  updateIssueStatusInSupabase,
} from "@/lib/supabaseService";

export interface FeedbackItem {
  id: string;
  issueId: string | number;
  reportCode: string;
  userName: string;
  category: string;
  categoryIcon: string;
  location: string;
  rating: number; // 1 - 5
  isSolved: boolean;
  comment: string;
  reinspected?: boolean;
  createdAt?: string;
  criteriaScores?: Record<number, number>;
}

export interface DimensionStat {
  id: number;
  title: string;
  score: number;
  percentage: number;
}

export const DIMENSION_TITLES: { id: number; title: string }[] = [
  { id: 1, title: "1. ความรวดเร็วในการเข้าตรวจสอบ" },
  { id: 2, title: "2. แก้ปัญหาเสร็จทันเวลานัดหมาย" },
  { id: 3, title: "3. ความสุภาพและการประสานงาน" },
  { id: 4, title: "4. ความพร้อมของอุปกรณ์/มืออาชีพ" },
  { id: 5, title: "5. การอัปเดตสถานะงานต่อเนื่อง" },
  { id: 6, title: "6. คำชี้แจง/บันทึกผลงานชัดเจน" },
  { id: 7, title: "7. ความสะอาดเรียบร้อยหลังทำงาน" },
  { id: 8, title: "8. แก้ไขปัญหาได้ตรงจุด" },
  { id: 9, title: "9. ความมั่นใจไม่ให้เกิดปัญหาซ้ำ" },
  { id: 10, title: "10. ความพึงพอใจต่อระบบ UniCare" },
];

export const INITIAL_MOCK_FEEDBACKS: FeedbackItem[] = [
  {
    id: "1",
    issueId: "ISS-2026-101",
    reportCode: "#ISS-2026-101",
    userName: "กิตติภูมิ ปราชญนคร",
    category: "เสียงรบกวน",
    categoryIcon: "",
    location: "หอพักนักศึกษาชาย 3",
    rating: 5,
    isSolved: true,
    comment:
      "รปภ. เข้ามาระงับเหตุได้รวดเร็วมากครับ ภายใน 30 นาทีก็เงียบสงบ สามารถอ่านหนังสือสอบต่อได้ ขอบคุณครับ",
    reinspected: false,
    createdAt: "2026-09-04T23:45:00.000Z",
    criteriaScores: {
      1: 5,
      2: 5,
      3: 5,
      4: 5,
      5: 4,
      6: 5,
      7: 4,
      8: 5,
      9: 4,
      10: 5,
    },
  },
  {
    id: "2",
    issueId: "ISS-2026-102",
    reportCode: "#ISS-2026-102",
    userName: "นศ. สุภัทรา (สงวนนามสกุล)",
    category: "ขยะ / ของเสีย",
    categoryIcon: "",
    location: "โรงอาหารกลาง",
    rating: 2,
    isSolved: false,
    comment:
      "มีการเก็บขยะไปแล้วส่วนหนึ่ง แต่น้ำขยะส่งกลิ่นเหม็นเน่ามาก ยังไม่มีการล้างพื้นจุดวางถังขยะ อยากให้ทำความสะอาดซ้ำค่ะ",
    reinspected: false,
    createdAt: "2026-09-06T12:00:00.000Z",
    criteriaScores: {
      1: 4,
      2: 3,
      3: 4,
      4: 3,
      5: 3,
      6: 3,
      7: 2,
      8: 2,
      9: 2,
      10: 3,
    },
  },
  {
    id: "3",
    issueId: "ISS-2026-105",
    reportCode: "#ISS-2026-105",
    userName: "อาจารย์ สันติสุข",
    category: "ต้นไม้ / พื้นที่สีเขียว",
    categoryIcon: "",
    location: "ลานกิจกรรมหน้าอาคารสถาปัตยกรรมศาสตร์",
    rating: 4,
    isSolved: true,
    comment:
      "เจ้าหน้าที่ประสานงานตัดแต่งกิ่งไม้ได้ดี แต่อยากให้มีมาตรการติดป้ายเตือนช่วงลมแรงเพิ่มเติมครับ",
    reinspected: false,
    createdAt: "2026-09-08T15:00:00.000Z",
    criteriaScores: {
      1: 5,
      2: 4,
      3: 5,
      4: 5,
      5: 4,
      6: 4,
      7: 4,
      8: 4,
      9: 3,
      10: 5,
    },
  },
];

const FEEDBACKS_STORAGE_KEY = "unicare_feedbacks";

function normalizeCriteria(f: FeedbackItem): FeedbackItem {
  if (f.criteriaScores && Object.keys(f.criteriaScores).length === 10) {
    return f;
  }
  const base = f.rating || 4;
  const scores: Record<number, number> = {};
  for (let i = 1; i <= 10; i++) {
    if (base >= 4) {
      scores[i] = i === 7 ? Math.max(1, base - 1) : i === 9 ? Math.max(1, base - 1) : base;
    } else {
      scores[i] = Math.max(1, Math.min(5, base + (i % 2 === 0 ? 1 : 0)));
    }
  }
  return { ...f, criteriaScores: scores };
}

export function getAllFeedbacks(): FeedbackItem[] {
  if (typeof window === "undefined") {
    return INITIAL_MOCK_FEEDBACKS;
  }

  try {
    const raw = window.localStorage.getItem(FEEDBACKS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        FEEDBACKS_STORAGE_KEY,
        JSON.stringify(INITIAL_MOCK_FEEDBACKS)
      );
      return INITIAL_MOCK_FEEDBACKS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(normalizeCriteria);
    }
    return INITIAL_MOCK_FEEDBACKS;
  } catch {
    return INITIAL_MOCK_FEEDBACKS;
  }
}

/**
 * คำนวณค่าเฉลี่ยและเปอร์เซ็นต์ของประสิทธิภาพ 10 มิติจากข้อมูลจริงใน feedbacks
 */
export function calculateDimensionsFromFeedbacks(feedbacks: FeedbackItem[]): DimensionStat[] {
  return DIMENSION_TITLES.map((dim) => {
    const scores: number[] = [];

    feedbacks.forEach((f) => {
      if (f.criteriaScores && typeof f.criteriaScores[dim.id] === "number") {
        scores.push(f.criteriaScores[dim.id]);
      } else if (typeof f.rating === "number") {
        scores.push(f.rating);
      }
    });

    if (scores.length === 0) {
      return {
        id: dim.id,
        title: dim.title,
        score: 5.0,
        percentage: 100,
      };
    }

    const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
    const roundedScore = Math.round(avg * 10) / 10;
    const percentage = Math.round((roundedScore / 5) * 100);

    return {
      id: dim.id,
      title: dim.title,
      score: roundedScore,
      percentage,
    };
  });
}

/**
 * ตรวจสอบว่าเคสนี้ (issueId) ได้รับการประเมินความพึงพอใจไปแล้วหรือไม่
 */
export function isIssueEvaluated(issueId: string | number): boolean {
  if (typeof window === "undefined") return false;
  const feedbacks = getAllFeedbacks();
  const cleanId = String(issueId).replace(/^#/, "").trim().toLowerCase();
  return feedbacks.some(
    (f) => String(f.issueId).replace(/^#/, "").trim().toLowerCase() === cleanId
  );
}

/**
 * ดึงข้อมูลผลการประเมินของเคสที่ระบุ
 */
export function getFeedbackByIssueId(issueId: string | number): FeedbackItem | undefined {
  if (typeof window === "undefined") return undefined;
  const feedbacks = getAllFeedbacks();
  const cleanId = String(issueId).replace(/^#/, "").trim().toLowerCase();
  return feedbacks.find(
    (f) => String(f.issueId).replace(/^#/, "").trim().toLowerCase() === cleanId
  );
}

/**
 * ซิงค์ข้อมูล Feedbacks กับ Supabase
 */
export async function syncFeedbacksWithSupabase(): Promise<FeedbackItem[]> {
  if (typeof window === "undefined") return INITIAL_MOCK_FEEDBACKS;
  try {
    const remote = await fetchFeedbacksFromSupabase();
    if (remote && remote.length > 0) {
      const current = getAllFeedbacks();
      const map = new Map<string, FeedbackItem>();
      for (const f of current) map.set(String(f.id), f);
      for (const r of remote) map.set(String(r.id), r);
      const merged = Array.from(map.values());
      window.localStorage.setItem(FEEDBACKS_STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event("unicare-feedbacks-updated"));
      window.dispatchEvent(new Event("storage"));
      return merged;
    }
  } catch (err) {
    console.warn("syncFeedbacksWithSupabase error:", err);
  }
  return getAllFeedbacks();
}

/**
 * บันทึกผลการประเมิน โดยอนุญาตให้ประเมินได้เพียงครั้งเดียวต่อ 1 เคส
 */
export function saveFeedback(feedback: FeedbackItem): { success: boolean; message?: string } {
  if (typeof window === "undefined") return { success: false, message: "Browser only" };

  try {
    const current = getAllFeedbacks();
    const cleanId = String(feedback.issueId).replace(/^#/, "").trim().toLowerCase();
    
    // ตรวจสอบว่าเคยประเมินเคสนี้ไปแล้วหรือไม่
    const alreadyEvaluated = current.some(
      (f) => String(f.issueId).replace(/^#/, "").trim().toLowerCase() === cleanId
    );

    if (alreadyEvaluated) {
      return {
        success: false,
        message: "เคสนี้ได้รับการประเมินความพึงพอใจไปแล้ว (อนุญาตให้ประเมินได้ครั้งเดียว)",
      };
    }

    const updated = [feedback, ...current];
    window.localStorage.setItem(FEEDBACKS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("unicare-feedbacks-updated"));
    window.dispatchEvent(new Event("storage"));

    // Sync to Supabase in background
    createFeedbackInSupabase(feedback).catch((err) =>
      console.warn("createFeedbackInSupabase error:", err)
    );

    return { success: true };
  } catch (e) {
    console.error("Failed to save feedback to localStorage:", e);
    return { success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}

export function updateFeedbackReinspected(feedbackId: string, note?: string): void {
  if (typeof window === "undefined") return;

  try {
    const current = getAllFeedbacks();
    const targetFeedback = current.find((f) => f.id === feedbackId);
    const updated = current.map((f) =>
      f.id === feedbackId ? { ...f, reinspected: true } : f
    );
    window.localStorage.setItem(FEEDBACKS_STORAGE_KEY, JSON.stringify(updated));

    // If there is an issue linked, update its status to in_progress in unicare_demo_issue_reports
    if (targetFeedback) {
      const issueIdStr = String(targetFeedback.issueId).replace(/^#/, "");
      
      // Update in Supabase
      updateIssueStatusInSupabase(issueIdStr, "in_progress").catch(console.warn);

      const savedReportsRaw = window.localStorage.getItem("unicare_demo_issue_reports");
      const currentReports = savedReportsRaw ? JSON.parse(savedReportsRaw) : [];
      const reportIdx = currentReports.findIndex(
        (r: { id: string | number }) => String(r.id) === issueIdStr
      );

      if (reportIdx >= 0) {
        currentReports[reportIdx].status = "in_progress";
        currentReports[reportIdx].statusLabel = "กำลังดำเนินการ (ตรวจซ้ำ)";
        window.localStorage.setItem(
          "unicare_demo_issue_reports",
          JSON.stringify(currentReports)
        );
      } else {
        currentReports.push({
          id: issueIdStr,
          status: "in_progress",
          statusLabel: "กำลังดำเนินการ (ตรวจซ้ำ)",
        });
        window.localStorage.setItem(
          "unicare_demo_issue_reports",
          JSON.stringify(currentReports)
        );
      }

      // Add timeline entry
      try {
        const savedTimelineRaw = window.localStorage.getItem("unicare_demo_timeline_history");
        const timelineHistory = savedTimelineRaw ? JSON.parse(savedTimelineRaw) : {};
        if (!timelineHistory[issueIdStr]) {
          timelineHistory[issueIdStr] = [];
        }
        timelineHistory[issueIdStr].unshift({
          statusText: "สั่งตรวจซ้ำ (Reinspection)",
          time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          note: note || `ผู้ใช้แจ้งว่ายังพบปัญหาเดิม ต้องการให้เข้าดำเนินการซ้ำอย่างเร่งด่วน`,
          author: "ผู้ดูแลระบบ",
          color: "bg-rose-500 text-white",
        });
        window.localStorage.setItem(
          "unicare_demo_timeline_history",
          JSON.stringify(timelineHistory)
        );
      } catch {
        // Ignore timeline error
      }

      window.dispatchEvent(new Event("unicare-demo-reports-updated"));
    }

    window.dispatchEvent(new Event("unicare-feedbacks-updated"));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to update reinspected status:", e);
  }
}
