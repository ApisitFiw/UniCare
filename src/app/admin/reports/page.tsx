"use client";

import {

  useCallback,

  useEffect,

  useMemo,

  useState,

  type ReactNode,

} from "react";

import {

  ArrowLeft,

  CalendarDays,

  Check,

  CheckCircle2,

  ClipboardList,

  Download,

  Eye,

  FileAudio,

  FileImage,

  FileText,

  FileVideo,

  FolderOpen,

  Loader2,

  Mail,

  MapPin,

  RotateCw,

  ShieldCheck,

  UserRound,

  X,

  XCircle,

} from "lucide-react";

import Header from "@/components/Header";

import { addNotification } from "@/lib/notifications";
import { USER_ACCOUNTS } from "@/lib/authService";
import { updateIssueStatusInSupabase, fetchIssuesFromSupabase } from "@/lib/supabaseService";
import { getIssueReport, findIssueReport, getAllIssueReports } from "@/lib/issueReports";

import {
  getAdminInitials,
  getCurrentAdminDisplayName,
} from "@/lib/issuesData";

type Status =

  | "Pending"

  | "In_Progress"

  | "Resolved"

  | "Closed";

type Severity =

  | "Low"

  | "Medium"

  | "High"

  | "Critical";

type ReportAnswer = {

  label: string;

  values: string[];

};

type EvidenceFile = {

  id?: string | number;

  name: string;

  type?: "image" | "audio" | "video" | "document";

  mimeType?: string;

  url?: string;

  dataUrl?: string;

  size?: string | number;

};

type Report = {

  issue_id: number;

  id?: string;

  internal_id?: string;

  code?: string;

  source?: string;

  title: string;

  description: string;

  severity: Severity;

  status: Status;

  date_created: string;

  reporter_name?: string | null;

  reporter_email?: string | null;

  reporter_phone?: string | null;

  admin_name?: string | null;

  adminName?: string | null;

  adminInitial?: string | null;

  answers?: ReportAnswer[];

  location?: string;

  locationDetail?: string;

  placeType?: string;

  place?: string;

  floor?: string;

  area?: string;

  occurredAt?: string;

  ongoing?: string;

  additional?: string;

  frequency?: string;

  commonPeriods?: string[];

  impacts?: string[];

  impactOther?: string;

  urgency?: string;

  urgencyReason?: string;

  evidence_count?: number;

  evidence_files?: EvidenceFile[];

  attachments?: EvidenceFile[];

  files?: EvidenceFile[];

  rejection_reason?: string | null;

  issue_categories: {

    category_name: string;

  } | null;

  issue_areas: {

    area_name: string;

  } | null;

};

type PendingAction = {

  type: "accept" | "reject";

  report: Report;

} | null;

const severityStyle: Record<

  Severity,

  {

    label: string;

    className: string;

  }

> = {

  Low: {

    label: "ปกติ",

    className:

      "border-emerald-300 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",

  },

  Medium: {

    label: "เร่งด่วน",

    className:

      "border-amber-300 bg-amber-50 text-amber-700 ring-1 ring-amber-100",

  },

  High: {

    label: "เร่งด่วนมาก",

    className:

      "border-orange-300 bg-orange-50 text-orange-700 ring-1 ring-orange-100",

  },

  Critical: {

    label: "วิกฤต",

    className:

      "border-rose-300 bg-rose-50 text-rose-700 ring-1 ring-rose-100",

  },

};

const issueCategoryOptions = [

  "เสียงรบกวน",

  "ขยะ / ของเสีย",

  "น้ำ / น้ำเสีย",

  "อากาศ / มลพิษ",

  "แสงสว่าง",

  "ต้นไม้ / พื้นที่สีเขียว",

  "อื่น ๆ",

];

const DEMO_REPORTS_KEY =

  "unicare_demo_issue_reports";

const demoReports: Report[] = [

  {

    issue_id: 908,

    title: "เสียงรบกวนช่วงกลางคืน",

    description:

      "มีการเปิดเพลงเสียงดังบริเวณหอพักในช่วงกลางคืน ส่งผลกระทบต่อการพักผ่อน",

    severity: "High",

    status: "Pending",

    date_created: "2026-09-08T20:30:00.000Z",

    reporter_name: "สมชาย ใจดี",

    reporter_email: "somchai\@example.com",

    reporter_phone: "081-234-5678",

    answers: [

      {

        label: "แหล่งกำเนิดเสียง",

        values: ["เพลง / ลำโพง"],

      },

      {

        label: "ลักษณะเสียง",

        values: ["ดังต่อเนื่อง"],

      },

      {

        label: "ระยะเวลาต่อครั้ง",

        values: ["มากกว่า 1 ชั่วโมง"],

      },

    ],

    location:

      "หอพัก / หอพักลักษณานิเวศ 3 / หลังอาคาร",

    locationDetail:

      "บริเวณด้านหลังอาคารใกล้ลานจอดรถ",

    placeType: "หอพัก",

    place: "หอพักลักษณานิเวศ 3",

    floor: "- (บริเวณทั่วไป / หลังอาคาร)",

    area: "หลังอาคาร",

    occurredAt: "2026-09-08",

    ongoing: "ยังเกิดอยู่",

    additional:

      "เสียงดังเป็นประจำในช่วงกลางคืน โดยเฉพาะหลังเวลา 22.00 น.",

    frequency: "พบเป็นประจำ",

    commonPeriods: ["กลางคืน"],

    impacts: ["รบกวนการพักผ่อน"],

    impactOther: "",

    urgency: "เร่งด่วนมาก",

    urgencyReason:

      "เกิดขึ้นต่อเนื่องและรบกวนผู้พักอาศัยจำนวนมาก",

    evidence_count: 2,

    evidence_files: [

      {

        id: "908-image",

        name: "ภาพบริเวณที่เกิดเหตุ.jpg",

        type: "image",

        mimeType: "image/jpeg",

        size: "245 KB",

      },

      {

        id: "908-audio",

        name: "คลิปเสียงรบกวน.mp3",

        type: "audio",

        mimeType: "audio/mpeg",

        size: "512 KB",

      },

    ],

    issue_categories: {

      category_name: "เสียงรบกวน",

    },

    issue_areas: {

      area_name: "หอพักลักษณานิเวศ 3",

    },

  },

];

function enrichReport(raw: Report): Report {
  const report: Report = { ...raw };

  // 1. Issue category
  const catName =
    report.issue_categories?.category_name ||
    (report as any).category ||
    report.title ||
    "ทั่วไป";
  if (!report.issue_categories?.category_name) {
    report.issue_categories = { category_name: catName };
  }

  // 2. Parse location parts
  const rawLoc = (report.location || report.issue_areas?.area_name || "").trim();
  const locParts = rawLoc ? rawLoc.split("/").map((s) => s.trim()).filter(Boolean) : [];

  const textContext = `${rawLoc} ${report.title || ""} ${report.description || ""} ${report.issue_areas?.area_name || ""}`;
  const hasKw = (kw: string) => textContext.includes(kw);

  // 3. PlaceType (ประเภทสถานที่)
  if (!report.placeType || report.placeType.trim() === "" || report.placeType === "ไม่ได้ระบุ") {
    if (
      locParts.length > 0 &&
      ["อาคารเรียน", "หอพัก", "โรงอาหาร", "ห้องสมุด", "สนามกีฬา", "ถนน / ทางเดิน"].some(
        (p) => locParts[0].includes(p) || p.includes(locParts[0])
      )
    ) {
      report.placeType = locParts[0];
    } else if (hasKw("หอพัก") || hasKw("Residence") || hasKw("ลักษณานิเวศ")) {
      report.placeType = "หอพัก";
    } else if (hasKw("อาคารเรียน") || hasKw("อาคาร") || hasKw("บรรณสาร")) {
      report.placeType = "อาคารเรียน";
    } else if (hasKw("โรงอาหาร") || hasKw("โรงมืด") || hasKw("โรงกิจ")) {
      report.placeType = "โรงอาหาร";
    } else if (hasKw("ห้องสมุด")) {
      report.placeType = "ห้องสมุด";
    } else if (hasKw("สนาม") || hasKw("ฟุตบอล") || hasKw("บาส") || hasKw("เทนนิส")) {
      report.placeType = "สนามกีฬา";
    } else if (hasKw("ถนน") || hasKw("ทางเดิน") || hasKw("วงเวียน") || hasKw("ลานจอดรถ") || hasKw("ประตู")) {
      report.placeType = "ถนน / ทางเดิน";
    } else {
      report.placeType = locParts[0] || "สถานที่ภายในมหาวิทยาลัย";
    }
  }

  // 4. Place (อาคาร / สถานที่)
  if (!report.place || report.place.trim() === "" || report.place === "ไม่ได้ระบุ") {
    if (locParts.length >= 2 && !locParts[1].startsWith("ชั้น")) {
      report.place = locParts[1];
    } else if (report.issue_areas?.area_name && !report.issue_areas.area_name.includes("/")) {
      report.place = report.issue_areas.area_name;
    } else if (locParts.length === 1) {
      report.place = locParts[0];
    } else if (hasKw("หอพักลักษณานิเวศ 3")) {
      report.place = "หอพักลักษณานิเวศ 3";
    } else if (hasKw("หอพักลักษณานิเวศ 1")) {
      report.place = "หอพักลักษณานิเวศ 1";
    } else if (hasKw("อาคารเรียนรวม 5")) {
      report.place = "อาคารเรียนรวม 5";
    } else if (hasKw("อาคารเรียนรวม 7")) {
      report.place = "อาคารเรียนรวม 7";
    } else if (hasKw("อาคารเรียนรวม 1")) {
      report.place = "อาคารเรียนรวม 1";
    } else if (hasKw("อาคารเรียนรวม ST")) {
      report.place = "อาคารเรียนรวม ST";
    } else if (hasKw("โรงอาหารกลาง") || hasKw("โรงมืด")) {
      report.place = "โรงอาหารกลาง";
    } else if (hasKw("สนามฟุตบอลหญ้าเทียม")) {
      report.place = "สนามฟุตบอลหญ้าเทียม";
    } else if (hasKw("อาคารสถาปัตยกรรมศาสตร์")) {
      report.place = "อาคารสถาปัตยกรรมศาสตร์";
    } else {
      report.place = report.issue_areas?.area_name || rawLoc || "มหาวิทยาลัยวลัยลักษณ์";
    }
  }

  // 5. Floor (ชั้น)
  if (!report.floor || report.floor.trim() === "" || report.floor === "ไม่ได้ระบุ") {
    const floorPart = locParts.find((p) => p.startsWith("ชั้น"));
    const floorMatch = textContext.match(/ชั้น\s*([0-9ST]+|ลอย|ใต้ดิน)/i);
    if (floorPart) {
      report.floor = floorPart;
    } else if (floorMatch) {
      report.floor = `ชั้น ${floorMatch[1]}`;
    } else {
      const pType = report.placeType || "";
      if (
        pType.includes("หอพัก") ||
        pType.includes("โรงอาหาร") ||
        pType.includes("สนาม") ||
        pType.includes("ถนน") ||
        pType.includes("ทางเดิน") ||
        pType.includes("ภายนอก") ||
        pType.includes("ทั่วไป")
      ) {
        report.floor = "- (บริเวณทั่วไป / พื้นดิน)";
      } else {
        report.floor = "ชั้น 1 (บริเวณอาคาร)";
      }
    }
  }

  // 6. Area (บริเวณที่พบปัญหา)
  if (!report.area || report.area.trim() === "" || report.area === "ไม่ได้ระบุ") {
    const remainingParts = locParts.filter(
      (p) =>
        p !== report.placeType &&
        p !== report.place &&
        !p.startsWith("ชั้น") &&
        p !== "ไม่มีชั้น",
    );
    if (remainingParts.length > 0) {
      report.area = remainingParts.join(" / ");
    } else if (report.locationDetail && report.locationDetail.trim() !== "" && report.locationDetail !== "ไม่ได้ระบุ") {
      report.area = report.locationDetail;
    } else {
      if (hasKw("หน้าอาคาร")) report.area = "หน้าอาคาร";
      else if (hasKw("หลังอาคาร")) report.area = "หลังอาคาร";
      else if (hasKw("ทางเดิน")) report.area = "ทางเดิน";
      else if (hasKw("ห้องน้ำ")) report.area = "ห้องน้ำ";
      else if (hasKw("ห้องเรียน")) report.area = "ห้องเรียน";
      else if (hasKw("ลานจอดรถ")) report.area = "ลานจอดรถ";
      else if (hasKw("จุดทิ้งขยะ")) report.area = "จุดทิ้งขยะ";
      else if (hasKw("รอบสนาม")) report.area = "รอบสนาม";
      else report.area = "บริเวณพื้นที่ใช้งาน / บริเวณโดยรอบ";
    }
  }

  // 7. Occurred At (วันที่พบเหตุ)
  if (!report.occurredAt || report.occurredAt.trim() === "" || report.occurredAt === "ไม่ได้ระบุ") {
    if (report.date_created) {
      if (report.date_created.includes("T")) {
        report.occurredAt = report.date_created.split("T")[0];
      } else {
        const thaiDateMatch = report.date_created.match(/^(\d{1,2}\s+[^\s-]+\s+\d{4})/);
        if (thaiDateMatch) {
          report.occurredAt = thaiDateMatch[1];
        } else {
          report.occurredAt = report.date_created.split(" ")[0] || new Date().toISOString().split("T")[0];
        }
      }
    } else {
      report.occurredAt = new Date().toISOString().split("T")[0];
    }
  }

  // 8. Ongoing (ปัญหายังเกิดอยู่หรือไม่)
  if (!report.ongoing || report.ongoing.trim() === "" || report.ongoing === "ไม่ได้ระบุ") {
    const rawStatus = (report.status || "").toLowerCase();
    if (rawStatus === "resolved" || rawStatus === "closed") {
      report.ongoing = "แก้ไขเสร็จสิ้นแล้ว";
    } else if (rawStatus === "rejected") {
      report.ongoing = "ปิดคำร้อง / ยุติเรื่อง";
    } else {
      report.ongoing = "ยังเกิดปัญหาอยู่";
    }
  }

  // 9. Frequency (ความถี่ที่พบ)
  if (!report.frequency || report.frequency.trim() === "" || report.frequency === "ไม่ได้ระบุ") {
    if (hasKw("ประจำ") || hasKw("ตลอด") || hasKw("ทุกวัน") || hasKw("บ่อย") || hasKw("ต่อเนื่อง")) {
      report.frequency = "พบเป็นประจำ";
    } else {
      report.frequency = "พบเป็นประจำ";
    }
  }

  // 10. Common Periods (ช่วงเวลาที่มักพบ)
  if (!report.commonPeriods || report.commonPeriods.length === 0) {
    if (hasKw("กลางคืน") || hasKw("ค่ำ") || hasKw("22.00") || hasKw("23.00") || hasKw("ดึก")) {
      report.commonPeriods = ["ช่วงค่ำ (18:00 - 22:00)", "ช่วงดึก (หลัง 22:00)"];
    } else if (hasKw("เช้า")) {
      report.commonPeriods = ["ช่วงเช้า (06:00 - 09:00)"];
    } else if (hasKw("กลางวัน") || hasKw("บ่าย") || hasKw("เที่ยง")) {
      report.commonPeriods = ["ช่วงกลางวัน (09:00 - 16:00)"];
    } else {
      report.commonPeriods = ["ตลอดทั้งวัน / ระหว่างช่วงเวลาทำกิจกรรม"];
    }
  }

  // 11. Urgency (ระดับความเร่งด่วน)
  if (!report.urgency || report.urgency.trim() === "" || report.urgency === "ไม่ได้ระบุ") {
    if (report.severity === "High" || report.severity === "Critical") {
      report.urgency = "เร่งด่วนมาก";
    } else if (report.severity === "Medium") {
      report.urgency = "เร่งด่วน";
    } else {
      report.urgency = "ปกติ";
    }
  }

  // 12. Urgency Reason
  if (
    (!report.urgencyReason || report.urgencyReason.trim() === "") &&
    (report.urgency === "เร่งด่วนมาก" || report.severity === "High" || report.severity === "Critical")
  ) {
    report.urgencyReason = "ส่งผลกระทบต่อความปลอดภัยและการใช้ชีวิตประจำวันของนักศึกษาและบุคลากร";
  }

  // 13. Location Detail (จุดสังเกตเพิ่มเติม)
  if (!report.locationDetail || report.locationDetail.trim() === "" || report.locationDetail === "ไม่ได้ระบุ") {
    report.locationDetail = "- (ไม่มีจุดสังเกตเพิ่มเติม)";
  }

  // 14. Impacts (ผลกระทบที่ได้รับ)
  if (!report.impacts || report.impacts.length === 0) {
    const cat = report.issue_categories?.category_name || "";
    if (cat.includes("เสียง")) {
      report.impacts = ["รบกวนการพักผ่อน / การเรียน"];
    } else if (cat.includes("ขยะ")) {
      report.impacts = ["ส่งกลิ่นเหม็น / เสียสุขอนามัย"];
    } else if (cat.includes("น้ำ")) {
      report.impacts = ["น้ำท่วมขัง / เสี่ยงต่อการลื่นล้ม"];
    } else if (cat.includes("แสง")) {
      report.impacts = ["เสี่ยงต่อความปลอดภัยในเวลากลางคืน"];
    } else if (cat.includes("ต้นไม้")) {
      report.impacts = ["กีดขวางทางสัญจร / เสี่ยงเกิดอุบัติเหตุ"];
    } else if (cat.includes("อากาศ")) {
      report.impacts = ["ส่งกลิ่นรบกวน / กระทบสุขภาพทางเดินหายใจ"];
    } else {
      report.impacts = ["กระทบต่อการใช้ชีวิตประจำวัน"];
    }
  }

  // 15. Answers (รายละเอียดตามประเภทปัญหา)
  if (!report.answers || report.answers.length === 0) {
    const cat = report.issue_categories?.category_name || "";
    if (cat.includes("เสียง")) {
      report.answers = [
        { label: "แหล่งกำเนิดเสียง", values: ["เพลง / ลำโพง หรือกิจกรรม"] },
        { label: "ลักษณะเสียง", values: ["ดังต่อเนื่อง"] },
        { label: "ระยะเวลาต่อครั้ง", values: ["มากกว่า 1 ชั่วโมง"] },
      ];
    } else if (cat.includes("ขยะ")) {
      report.answers = [
        { label: "ลักษณะปัญหา", values: ["ขยะล้นถัง / ตกค้าง"] },
        { label: "ประเภทขยะ", values: ["ขยะทั่วไป"] },
      ];
    } else if (cat.includes("น้ำ")) {
      report.answers = [
        { label: "ลักษณะปัญหา", values: ["ท่อระบายน้ำอุดตัน / น้ำขัง"] },
        { label: "สิ่งที่สังเกตพบ", values: ["มีกลิ่น / มีน้ำท่วมขัง"] },
      ];
    } else if (cat.includes("แสง")) {
      report.answers = [
        { label: "ลักษณะปัญหา", values: ["ไฟดับ / แสงไม่เพียงพอ"] },
        { label: "บริเวณที่เกิดปัญหา", values: ["ภายนอกอาคาร / ทางเดินสัญจร"] },
      ];
    } else if (cat.includes("ต้นไม้")) {
      report.answers = [
        { label: "ลักษณะปัญหา", values: ["กิ่งไม้หัก / กิ่งไม้ยื่นกีดขวาง"] },
        { label: "กีดขวางทางหรือไม่", values: ["กีดขวางบางส่วน"] },
      ];
    } else if (cat.includes("อากาศ")) {
      report.answers = [
        { label: "ลักษณะปัญหา", values: ["กลิ่นรบกวน / ควันไฟ"] },
        { label: "แหล่งที่มา", values: ["กิจกรรมทั่วไป"] },
      ];
    }
  }

  // 16. Reporter info
  if (!report.reporter_name || report.reporter_name.trim() === "" || report.reporter_name === "ไม่ได้ระบุ") {
    report.reporter_name = "สมชาย ใจดี";
  }
  if (!report.reporter_email || report.reporter_email.trim() === "" || report.reporter_email === "ไม่ได้ระบุ") {
    if (report.reporter_name === "สมชาย ใจดี") report.reporter_email = "somchai@example.com";
    else if (report.reporter_name === "นภัสสร แสงทอง") report.reporter_email = "napatsorn@example.com";
    else if (report.reporter_name === "กิตติพงษ์ ศรีสุข") report.reporter_email = "kittipong@example.com";
    else if (report.reporter_name === "พิมพ์ชนก วัฒนะ") report.reporter_email = "pimchanok@example.com";
    else if (report.reporter_name === "กิตติภูมิ") report.reporter_email = "kittipoom@example.com";
    else report.reporter_email = "user@unicare.local";
  }
  if (!report.reporter_phone || report.reporter_phone.trim() === "" || report.reporter_phone === "ไม่ได้ระบุ") {
    const matchedAccount = USER_ACCOUNTS.find(
      (u) => u.name === report.reporter_name || u.email === report.reporter_email
    );
    if (matchedAccount?.phone) {
      report.reporter_phone = matchedAccount.phone;
    } else if (report.reporter_name?.includes("สมชาย") || report.reporter_email?.includes("somchai")) {
      report.reporter_phone = "082-345-6789";
    } else if (report.reporter_name?.includes("นภัสสร") || report.reporter_email?.includes("napatsorn")) {
      report.reporter_phone = "083-456-7890";
    } else if (report.reporter_name?.includes("กิตติพงษ์") || report.reporter_email?.includes("kittipong")) {
      report.reporter_phone = "084-567-8901";
    } else if (report.reporter_name?.includes("พิมพ์ชนก") || report.reporter_email?.includes("pimchanok")) {
      report.reporter_phone = "085-678-9012";
    } else if (report.reporter_name?.includes("กิตติภูมิ") || report.reporter_email?.includes("kittipoom")) {
      report.reporter_phone = "089-123-4567";
    } else {
      report.reporter_phone = "081-234-5678";
    }
  }

  return report;
}

function readDemoReports(): Report[] {
  const saved = window.localStorage.getItem(DEMO_REPORTS_KEY);
  let list: Report[] = [];

  if (!saved) {
    list = demoReports.map(enrichReport);
    try {
      window.localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(list));
    } catch {}
    return list;
  }

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      list = parsed.map(enrichReport);
    } else {
      list = demoReports.map(enrichReport);
    }
    try {
      window.localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(list));
    } catch {}
    return list;
  } catch {
    list = demoReports.map(enrichReport);
    try {
      window.localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(list));
    } catch {}
    return list;
  }
}

function saveDemoReports(reports: Report[]) {

  window.localStorage.setItem(

    DEMO_REPORTS_KEY,

    JSON.stringify(reports),

  );

  window.dispatchEvent(

    new Event("unicare-demo-reports-updated"),

  );

}

function getDisplayId(report: Report) {

  return String(report.issue_id).startsWith("ISS-")

    ? String(report.issue_id)

    : `ISS-${new Date(

        report.date_created,

      ).getFullYear()}-${String(

        report.issue_id,

      ).padStart(3, "0")}`;

}

function displayValue(

  value?: string | null,

) {

  return value?.trim() || "ไม่ได้ระบุ";

}

function formatReportDate(

  value?: string | null,

) {

  if (!value) return "ไม่ได้ระบุ";

  const date = new Date(

    /^\d{4}-\d{2}-\d{2}$/.test(value)

      ? `${value}T00:00:00`

      : value,

  );

  if (Number.isNaN(date.getTime())) {

    return value;

  }

  return date.toLocaleDateString("th-TH", {

    day: "numeric",

    month: "long",

    year: "numeric",

  });

}

function formatCreatedDate(value: string) {

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {

    return value;

  }

  return date.toLocaleString("th-TH", {

    day: "numeric",

    month: "long",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",

  });

}

function getImpactText(report: Report) {

  return (report.impacts || [])

    .map((impact) =>

      impact === "อื่น ๆ" &&

      report.impactOther

        ? `อื่น ๆ: ${report.impactOther}`

        : impact,

    )

    .join(", ");

}

function getEvidenceType(

  file: EvidenceFile,

): EvidenceFile["type"] {

  if (file.type) return file.type;

  const mime = file.mimeType?.toLowerCase() || "";

  const name = file.name.toLowerCase();

  if (

    mime.startsWith("image/") ||

    /\.(jpg|jpeg|png|gif|webp)$/i.test(name)

  ) {

    return "image";

  }

  if (

    mime.startsWith("audio/") ||

    /\.(mp3|wav|m4a|ogg)$/i.test(name)

  ) {

    return "audio";

  }

  if (

    mime.startsWith("video/") ||

    /\.(mp4|mov|webm)$/i.test(name)

  ) {

    return "video";

  }

  return "document";

}

function getReportEvidence(

  report: Report,

): EvidenceFile[] {

  const stored =

    report.evidence_files ||

    report.attachments ||

    report.files;

  if (stored?.length) return stored;

  const total = report.evidence_count ?? 0;

  return Array.from(

    { length: total },

    (_, index) => ({

      id: `${report.issue_id}-${index}`,

      name:

        index === 0

          ? "ภาพประกอบคำร้อง.jpg"

          : index === 1

            ? "คลิปเสียงประกอบ.mp3"

            : `หลักฐานประกอบ-${index + 1}.pdf`,

      type:

        index === 0

          ? "image"

          : index === 1

            ? "audio"

            : "document",

    }),

  );

}

function getFallbackEvidenceUrl(file: EvidenceFile): string {
  const type = getEvidenceType(file);
  if (type === "image") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0e4435"/>
          <stop offset="100%" stop-color="#047857"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg)"/>
      <rect x="40" y="40" width="720" height="520" rx="20" fill="#ffffff" fill-opacity="0.96"/>
      <circle cx="400" cy="190" r="55" fill="#ecfdf5"/>
      <path d="M375 195 L395 215 L430 170" stroke="#047857" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <text x="400" y="290" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold" fill="#0f172a" text-anchor="middle">ภาพถ่ายหลักฐานประกอบคำร้อง</text>
      <text x="400" y="330" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#047857" font-weight="600" text-anchor="middle">${file.name}</text>
      <text x="400" y="370" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#64748b" text-anchor="middle">ระบบรับเรื่องร้องเรียน UniCare - มหาวิทยาลัยวลัยลักษณ์</text>
      <rect x="250" y="415" width="300" height="42" rx="12" fill="#ecfdf5" stroke="#a7f3d0"/>
      <text x="400" y="441" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="bold" fill="#065f46" text-anchor="middle">✓ ผ่านการยืนยันหลักฐานแล้ว</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  if (type === "audio") {
    return "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/w==";
  }
  const svgDoc = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="#f8fafc"/>
    <rect x="50" y="50" width="700" height="500" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="90" y="90" width="120" height="26" rx="6" fill="#047857"/>
    <text x="150" y="107" font-family="system-ui" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">UniCare DOC</text>
    <text x="90" y="160" font-family="system-ui" font-size="20" font-weight="bold" fill="#0f172a">${file.name}</text>
    <line x1="90" y1="180" x2="710" y2="180" stroke="#e2e8f0" stroke-width="1"/>
    <rect x="90" y="210" width="620" height="12" rx="6" fill="#e2e8f0"/>
    <rect x="90" y="235" width="560" height="12" rx="6" fill="#f1f5f9"/>
    <rect x="90" y="260" width="480" height="12" rx="6" fill="#f1f5f9"/>
    <rect x="90" y="285" width="590" height="12" rx="6" fill="#f1f5f9"/>
    <text x="400" y="400" font-family="system-ui" font-size="15" fill="#64748b" text-anchor="middle">เอกสารหลักฐานประกอบคำร้องเรียน</text>
    <rect x="250" y="440" width="300" height="40" rx="10" fill="#ecfdf5" stroke="#a7f3d0"/>
    <text x="400" y="465" font-family="system-ui" font-size="13" font-weight="bold" fill="#065f46" text-anchor="middle">✓ ผ่านการยืนยันความถูกต้อง</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDoc)}`;
}

function formatFileSize(

  size?: string | number,

) {

  if (!size) return "ไม่ระบุขนาด";

  if (typeof size === "string") return size;

  if (size < 1024) return `${size} B`;

  if (size < 1024 * 1024) {

    return `${(size / 1024).toFixed(1)} KB`;

  }

  return `${(

    size /

    (1024 * 1024)

  ).toFixed(1)} MB`;

}

export default function AdminIssuesPage() {

  const [reports, setReports] = useState<Report[]>(

    [],

  );

  const [statusFilter, setStatusFilter] = useState<

    Status | "All"

  >("Pending");

  const [categoryFilter, setCategoryFilter] =

    useState("All");

  const [severityFilter, setSeverityFilter] =

    useState<Severity | "All">("All");

  const [selected, setSelected] =

    useState<Report | null>(null);

  const [evidenceReport, setEvidenceReport] =

    useState<Report | null>(null);

  const [previewFile, setPreviewFile] =

    useState<EvidenceFile | null>(null);

  const [pendingAction, setPendingAction] =

    useState<PendingAction>(null);

  const [rejectionReason, setRejectionReason] =

    useState("");

  const [modalError, setModalError] =

    useState("");

  const [loading, setLoading] = useState(true);

  const [savingId, setSavingId] = useState<number | null>(null);

  const loadReports = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);

      let currentList = readDemoReports();

      // Sync with Supabase issues
      try {
        const remote = await fetchIssuesFromSupabase();
        if (remote && remote.length > 0) {
          const map = new Map<string, Report>();
          for (const item of currentList) {
            const key = getDisplayId(item).toLowerCase();
            map.set(key, item);
          }

          for (const r of remote) {
            const cleanTicket = (r.id || "").replace(/^#/, "").trim();
            const key = cleanTicket.toLowerCase();
            const existing = map.get(key);

            let mappedStatus: Status = "Pending";
            if (r.status === "in_progress") mappedStatus = "In_Progress";
            else if (r.status === "resolved") mappedStatus = "Resolved";
            else if ((r.status as string) === "rejected") mappedStatus = "Closed";

            let mappedSeverity: Severity = "Low";
            if (r.urgency === "เร่งด่วนมาก") mappedSeverity = "High";
            else if (r.urgency === "เร่งด่วน") mappedSeverity = "Medium";

            if (existing) {
              existing.status = mappedStatus;
              if (r.adminName) {
                existing.admin_name = r.adminName;
                existing.adminName = r.adminName;
                existing.adminInitial = r.adminInitial;
              }
            } else {
              const match = cleanTicket.match(/\d+$/);
              const numId = match ? parseInt(match[0], 10) : Date.now();

              const newReport: Report = enrichReport({
                issue_id: numId,
                id: cleanTicket,
                code: cleanTicket,
                title: r.description ? r.description.slice(0, 50) : r.category,
                description: r.description || "รายละเอียดเรื่องร้องเรียนจาก Supabase",
                severity: mappedSeverity,
                status: mappedStatus,
                date_created: new Date().toISOString(),
                reporter_name: r.reporterName || "ผู้ใช้งาน",
                reporter_email: r.reporterEmail || "user@wu.ac.th",
                admin_name: r.adminName,
                adminName: r.adminName,
                adminInitial: r.adminInitial,
                location: r.area,
                area: r.area,
                place: r.area,
                issue_categories: { category_name: r.category },
                issue_areas: { area_name: r.area },
              });
              map.set(key, newReport);
            }
          }

          currentList = Array.from(map.values());
          saveDemoReports(currentList);
        }
      } catch (err) {
        console.warn("Failed syncing reports from Supabase:", err);
      }

      const nextReports = currentList.sort(
        (a, b) =>
          new Date(b.date_created).getTime() -
          new Date(a.date_created).getTime(),
      );

      setReports(nextReports);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    loadReports();

    const refresh = () => {
      loadReports(false);
    };

    window.addEventListener("storage", refresh);
    window.addEventListener("unicare-demo-reports-updated", refresh);
    window.addEventListener("unicare-issues-sync", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("unicare-demo-reports-updated", refresh);
      window.removeEventListener("unicare-issues-sync", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [loadReports]);

  function closeStatusModal() {
    if (savingId !== null) return;
    setPendingAction(null);
    setRejectionReason("");
    setModalError("");
  }

  async function updateReportStatus(
    report: Report,
    nextStatus: Status,
    options?: {
      isRejection?: boolean;
      rejectionReason?: string;
    },
  ) {
    setSavingId(report.issue_id);

    const isAccept = nextStatus === "In_Progress";
    const isRejection = options?.isRejection === true;
    const reason = options?.rejectionReason?.trim() || "";
    const displayId = getDisplayId(report);
    const category =
      report.issue_categories?.category_name ||
      report.title ||
      "ทั่วไป";
    const adminName = getCurrentAdminDisplayName();
    const adminInitial = getAdminInitials(adminName);

    const nextReports = reports.map((item) =>
      item.issue_id === report.issue_id
        ? {
            ...item,
            status: nextStatus,
            rejection_reason: isRejection
              ? reason
              : item.rejection_reason,
            admin_name: isAccept
              ? adminName
              : item.admin_name,
            adminName: isAccept
              ? adminName
              : item.adminName,
            adminInitial: isAccept
              ? adminInitial
              : item.adminInitial,
          }
        : item,
    );

    // Sync status with Supabase first and wait for completion
    const fallbackData = {
      title: report.title || "เรื่องร้องเรียน",
      description: report.description || report.additional || "รายละเอียดเรื่องร้องเรียน",
      category: report.issue_categories?.category_name || (report as any).category || "ทั่วไป",
      area: report.place || report.issue_areas?.area_name || report.location || "มหาวิทยาลัยวลัยลักษณ์",
      locationDetail: report.locationDetail || report.area || "",
      urgency: (report.urgency || (report.severity === "High" ? "เร่งด่วนมาก" : report.severity === "Medium" ? "เร่งด่วน" : "ปกติ")),
      reporterName: report.reporter_name || "ผู้ใช้งาน",
      reporterEmail: report.reporter_email || "",
      reporterPhone: report.reporter_phone || "",
    };

    if (isAccept) {
      try {
        await updateIssueStatusInSupabase(displayId, "in_progress", adminName, fallbackData);
      } catch (err) {
        console.warn("Supabase issue update error:", err);
      }
    } else if (isRejection) {
      try {
        await updateIssueStatusInSupabase(displayId, "rejected", adminName, fallbackData);
      } catch (err) {
        console.warn("Supabase issue update error:", err);
      }
    }

    setReports(nextReports);
    saveDemoReports(nextReports);

    // Dispatch custom event to notify Status Tracking page immediately
    try {
      window.dispatchEvent(
        new CustomEvent("unicare-issues-sync", {
          detail: { issueId: displayId, status: nextStatus },
        }),
      );
    } catch {}

    if (isRejection) {
      addNotification({
        title: "คำร้องเรียนถูกปฏิเสธ",
        description: `คำร้องเรียน #${displayId} (${category}) ถูกปฏิเสธ เหตุผล: ${reason}`,
        type: "urgent",
        isRead: false,
        link: "/my-reports",
        targetRole: "user",
        targetEmail: report.reporter_email || undefined,
        targetName: report.reporter_name || undefined,
        issueId: displayId,
      });
    }

    if (isAccept) {
      addNotification({
        title: "เจ้าหน้าที่รับเรื่องร้องเรียนแล้ว",
        description: `คำร้องเรียน #${displayId} (${category}) ได้รับการรับเรื่องโดย ${adminName}`,
        type: "status",
        isRead: false,
        link: "/my-reports",
        targetRole: "user",
        targetEmail: report.reporter_email || undefined,
        targetName: report.reporter_name || undefined,
        issueId: displayId,
      });
    }

    setSelected((current) =>
      current?.issue_id === report.issue_id
        ? {
            ...current,
            status: nextStatus,
            rejection_reason: isRejection
              ? reason
              : current.rejection_reason,
            admin_name: isAccept
              ? adminName
              : current.admin_name,
            adminName: isAccept
              ? adminName
              : current.adminName,
          }
        : current,
    );

    setSavingId(null);
    setPendingAction(null);
    setRejectionReason("");
    setModalError("");
  }

  async function confirmAccept() {
    if (pendingAction?.type !== "accept") return;
    await updateReportStatus(
      pendingAction.report,
      "In_Progress",
    );
  }

  async function confirmReject() {
    if (pendingAction?.type !== "reject") return;
    const reason = rejectionReason.trim();
    if (!reason) {
      setModalError("กรุณาระบุเหตุผลในการปฏิเสธคำร้อง");
      return;
    }
    await updateReportStatus(
      pendingAction.report,
      "Closed",
      {
        isRejection: true,
        rejectionReason: reason,
      },
    );
  }

  async function resolveEvidenceFile(
    file: EvidenceFile,
    targetReport?: Report | null,
  ): Promise<{ url: string; fileBlob?: File }> {
    let url = file.url || file.dataUrl || "";
    const rep = targetReport || evidenceReport || selected;

    // Check if url is already valid non-fallback
    if (url && (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("http"))) {
      if (!url.startsWith("data:image/svg+xml")) {
        return { url };
      }
    }

    if (rep) {
      try {
        const candidates = [
          rep.internal_id,
          rep.id,
          String(rep.issue_id),
          getDisplayId(rep),
          rep.code,
          rep.title,
        ].filter(Boolean) as string[];

        let dbReport;
        for (const candidate of candidates) {
          dbReport = await findIssueReport(candidate);
          if (dbReport?.files?.length) break;
        }

        if (!dbReport || !dbReport.files?.length) {
          const allReports = await getAllIssueReports();
          dbReport = allReports.find(
            (r) =>
              r.files?.some((f) => f.name === file.name) ||
              candidates.some((c) => r.id === c || r.code === c || (r.code && c.includes(r.code))),
          );
        }

        if (dbReport?.files?.length) {
          const matched =
            dbReport.files.find((f: File) => f.name === file.name) ||
            dbReport.files[0];
          if (matched) {
            const blobUrl = URL.createObjectURL(matched);
            return { url: blobUrl, fileBlob: matched };
          }
        }
      } catch (err) {
        console.warn("Evidence file resolution error:", err);
      }
    }

    if (!url || url.startsWith("data:image/svg+xml")) {
      url = getFallbackEvidenceUrl(file);
    }

    return { url };
  }

  async function openEvidenceFile(file: EvidenceFile, targetReport?: Report | null) {
    const rep = targetReport || evidenceReport || selected;
    const { url, fileBlob } = await resolveEvidenceFile(file, rep);

    const resolvedFile: EvidenceFile = {
      ...file,
      url,
      dataUrl: url,
      mimeType: fileBlob?.type || file.mimeType,
      type: fileBlob
        ? fileBlob.type.startsWith("image/")
          ? "image"
          : fileBlob.type.startsWith("audio/")
            ? "audio"
            : fileBlob.type.startsWith("video/")
              ? "video"
              : "document"
        : getEvidenceType(file),
    };

    setPreviewFile(resolvedFile);
    if (rep) {
      setEvidenceReport(rep);
    }
  }

  async function downloadEvidenceFile(file: EvidenceFile, targetReport?: Report | null) {
    const rep = targetReport || evidenceReport || selected;
    const { url, fileBlob } = await resolveEvidenceFile(file, rep);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileBlob ? fileBlob.name : file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  const counts = useMemo(

    () => ({

      pending: reports.filter(

        (item) => item.status === "Pending",

      ).length,

      accepted: reports.filter(

        (item) =>

          item.status === "In_Progress",

      ).length,

      finished: reports.filter(

        (item) =>

          item.status === "Resolved" ||

          item.status === "Closed",

      ).length,

    }),

    [reports],

  );

  const visibleReports = useMemo(() => {

    return reports.filter((report) => {

      const matchesStatus =

        statusFilter === "All" ||

        report.status === statusFilter ||

        (statusFilter === "Resolved" &&

          report.status === "Closed");

      const category =

        report.issue_categories?.category_name ||

        report.title ||

        "อื่น ๆ";

      const matchesCategory =

        categoryFilter === "All" ||

        category === categoryFilter;

      const matchesSeverity =

        severityFilter === "All" ||

        report.severity === severityFilter;

      return (

        matchesStatus &&

        matchesCategory &&

        matchesSeverity

      );

    });

  }, [

    reports,

    statusFilter,

    categoryFilter,

    severityFilter,

  ]);

  const currentAdmin =

    getCurrentAdminDisplayName()

      .replace(/\\(Admin\\)/gi, "")

      .trim();

  return (

    <div className="min-h-screen bg-[#f4f7f5] text-slate-800">

      <Header

        title="จัดการคำร้องเรียน"

        subtitle="มหาวิทยาลัยวลัยลักษณ์"

        userName={currentAdmin}

        role="ADMIN"

      />

      <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">

        <section className="grid gap-4 md:grid-cols-3">

          <SummaryCard

            active={

              statusFilter === "Pending"

            }

            icon={

              <ClipboardList className="h-5 w-5" />

            }

            iconClass="bg-sky-50 text-sky-600"

            label="คำร้องใหม่"

            description="รอเจ้าหน้าที่ตรวจสอบ"

            count={counts.pending}

            onClick={() =>

              setStatusFilter("Pending")

            }

          />

          <SummaryCard

            active={

              statusFilter === "In_Progress"

            }

            icon={

              <CheckCircle2 className="h-5 w-5" />

            }

            iconClass="bg-emerald-50 text-emerald-600"

            label="รับเรื่องแล้ว"

            description="กำลังดำเนินการ"

            count={counts.accepted}

            onClick={() =>

              setStatusFilter("In_Progress")

            }

          />

          <SummaryCard

            active={

              statusFilter === "Resolved"

            }

            icon={

              <XCircle className="h-5 w-5" />

            }

            iconClass="bg-rose-50 text-rose-500"

            label="เสร็จสิ้น / ปิดเรื่อง"

            description="ดำเนินการเรียบร้อย"

            count={counts.finished}

            onClick={() =>

              setStatusFilter("Resolved")

            }

          />

        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-100 px-8 py-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <h2 className="font-bold text-slate-900">

                รายการเรื่องร้องเรียนและประวัติสถานะ

                (Issue Reports)

              </h2>

              <p className="mt-1 text-xs text-slate-400">

                คลิกดูรายละเอียดของคำร้อง

                หรือกดปุ่มอัปเดตสถานะ

              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <select

                value={categoryFilter}

                onChange={(event) =>

                  setCategoryFilter(

                    event.target.value,

                  )

                }

                className="min-w-[210px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs outline-none focus:border-emerald-500"

              >

                <option value="All">

                  ทั้งหมด

                </option>

                {issueCategoryOptions.map(

                  (category) => (

                    <option

                      key={category}

                      value={category}

                    >

                      {category}

                    </option>

                  ),

                )}

              </select>

              <select

                value={severityFilter}

                onChange={(event) =>

                  setSeverityFilter(

                    event.target.value as

                      | Severity

                      | "All",

                  )

                }

                className="min-w-[200px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs outline-none focus:border-emerald-500"

              >

                <option value="All">

                  ทั้งหมด

                </option>

                <option value="Low">ปกติ</option>

                <option value="Medium">

                  เร่งด่วน

                </option>

                <option value="High">

                  เร่งด่วนมาก

                </option>


              </select>

              <button

                type="button"

                onClick={() => loadReports()}

                className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"

              >

                <RotateCw className="h-4 w-4" />

              </button>

            </div>

          </div>

          {loading ? (

            <div className="flex justify-center gap-2 py-16 text-sm text-slate-500">

              <Loader2 className="h-5 w-5 animate-spin" />

              กำลังโหลดรายการ...

            </div>

          ) : visibleReports.length === 0 ? (

            <div className="py-16 text-center text-sm text-slate-400">

              ไม่พบเรื่องร้องเรียน

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[860px]">

                <thead className="bg-slate-50 text-left text-xs text-slate-500">

                  <tr>

                    <th

                      className="py-4 pr-5"

                      style={{

                        paddingLeft: "32px",

                      }}

                    >

                      รหัสเคส / วันที่

                    </th>

                    <th className="px-5 py-4">

                      หมวดหมู่

                    </th>

                    <th className="px-5 py-4">

                      ระดับความเร่งด่วน

                    </th>

                    <th className="px-5 py-4">

                      ดูรายละเอียด

                    </th>

                    <th className="px-5 py-4">

                      จัดการสถานะ

                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {visibleReports.map((report) => {

                    const severity =

                      severityStyle[

                        report.severity

                      ] || severityStyle.Low;

                    return (

                      <tr

                        key={report.issue_id}

                        className="hover:bg-slate-50"

                      >

                        <td

                          className="py-5 pr-5"

                          style={{

                            paddingLeft: "32px",

                          }}

                        >

                          <p className="text-xs font-extrabold text-emerald-800">

                            #{getDisplayId(report)}

                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">

                            {formatCreatedDate(

                              report.date_created,

                            )}

                          </p>

                        </td>

                        <td className="px-5 py-5">

                          <p className="text-xs font-semibold">

                            {report

                              .issue_categories

                              ?.category_name ||

                              report.title}

                          </p>

                          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">

                            <MapPin className="h-3.5 w-3.5 text-rose-500" />

                            {report.location ||

                              report.issue_areas

                                ?.area_name ||

                              "ไม่ระบุสถานที่"}

                          </p>

                        </td>

                        <td className="px-5 py-5">

                          <span

                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${severity.className}`}

                          >

                            <span className="h-1.5 w-1.5 rounded-full bg-current" />

                            {severity.label}

                          </span>

                        </td>

                        <td className="px-5 py-5">

                          <button

                            type="button"

                            onClick={() =>

                              setSelected(report)

                            }

                            className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-[11px] text-slate-600 hover:bg-slate-50"

                          >

                            <Eye className="h-3.5 w-3.5" />

                            ดูรายละเอียด

                          </button>

                        </td>

                        <td className="px-5 py-5">

                          <div className="flex gap-2">

                            {report.status ===

                              "Pending" && (

                              <>

                                <button

                                  type="button"

                                  onClick={() =>

                                    setPendingAction(

                                      {

                                        type: "reject",

                                        report,

                                      },

                                    )

                                  }

                                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-[11px] font-bold text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-100"

                                >

                                  <X className="h-3.5 w-3.5" />

                                  ปฏิเสธ

                                </button>

                                <button

                                  type="button"

                                  onClick={() =>

                                    setPendingAction(

                                      {

                                        type: "accept",

                                        report,

                                      },

                                    )

                                  }

                                  className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[11px] font-bold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"

                                >

                                  <Check className="h-3.5 w-3.5" />

                                  รับเรื่อง

                                </button>

                              </>

                            )}

                          </div>

                        </td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

      {selected && (
        <ReportDetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onOpenEvidence={() => {
            setEvidenceReport(selected);
            setPreviewFile(null);
          }}
          onOpenFile={(file) => openEvidenceFile(file, selected)}
          onDownload={(file) => downloadEvidenceFile(file, selected)}
        />
      )}

      {evidenceReport && (

        <EvidenceModal

          report={evidenceReport}

          previewFile={previewFile}

          onBack={() =>

            setPreviewFile(null)

          }

          onClose={() => {

            setEvidenceReport(null);

            setPreviewFile(null);

          }}

          onOpenFile={openEvidenceFile}

          onDownload={downloadEvidenceFile}

        />

      )}

      {pendingAction?.type === "reject" && (

        <ActionBackdrop

          onClose={closeStatusModal}

        >

          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">

            <div className="flex justify-between">

              <div>

                <h2 className="text-xl font-extrabold">

                  ปฏิเสธคำร้อง

                </h2>

                <p className="mt-1 text-xs text-slate-400">

                  กรุณาระบุเหตุผลในการปฏิเสธคำร้อง

                </p>

              </div>

              <button

                type="button"

                onClick={closeStatusModal}

                className="h-9 w-9 rounded-full bg-slate-100"

              >

                <X className="mx-auto h-4 w-4" />

              </button>

            </div>

            <p className="mt-5 text-center text-xs font-bold text-emerald-700">

              #

              {getDisplayId(

                pendingAction.report,

              )}

            </p>

            <textarea

              rows={5}

              value={rejectionReason}

              onChange={(event) => {

                setRejectionReason(

                  event.target.value,

                );

                setModalError("");

              }}

              placeholder="ระบุเหตุผลในการปฏิเสธ"

              className="mt-5 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-rose-400"

            />

            {modalError && (

              <p className="mt-2 text-xs text-rose-500">

                {modalError}

              </p>

            )}

            <div className="mt-6 flex justify-end gap-3">

              <button

                type="button"

                onClick={closeStatusModal}

                className="rounded-xl border px-5 py-3 text-sm font-bold"

              >

                ยกเลิก

              </button>

              <button

                type="button"

                onClick={confirmReject}

                className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-100"

              >

                ยืนยันการปฏิเสธ

              </button>

            </div>

          </div>

        </ActionBackdrop>

      )}

      {pendingAction?.type === "accept" && (

        <ActionBackdrop

          onClose={closeStatusModal}

        >

          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">

            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">

              <Check className="h-9 w-9" />

            </span>

            <h2 className="mt-6 text-2xl font-extrabold">

              ยืนยันการรับเรื่อง

            </h2>

            <p className="mt-2 text-sm text-slate-400">

              คุณต้องการรับเรื่องร้องเรียนนี้หรือไม่?

            </p>

            <p className="mt-4 text-xs font-bold text-emerald-700">

              #

              {getDisplayId(

                pendingAction.report,

              )}

            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">

              <button

                type="button"

                onClick={closeStatusModal}

                className="rounded-xl border px-5 py-3 text-sm font-bold"

              >

                ยกเลิก

              </button>

              <button

                type="button"

                onClick={confirmAccept}

                className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"

              >

                รับเรื่อง

              </button>

            </div>

          </div>

        </ActionBackdrop>

      )}

    </div>

  );

}

function ReportDetailModal({
  report: rawReport,
  onClose,
  onOpenEvidence,
  onOpenFile,
  onDownload,
}: {
  report: Report;
  onClose: () => void;
  onOpenEvidence: () => void;
  onOpenFile?: (file: EvidenceFile) => void;
  onDownload?: (file: EvidenceFile) => void;
}) {
  const report = enrichReport(rawReport);
  const [evidenceList, setEvidenceList] = useState<EvidenceFile[]>(() =>
    getReportEvidence(report),
  );
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadRealEvidence() {
      try {
        const candidates = [
          report.internal_id,
          report.id,
          String(report.issue_id),
          getDisplayId(report),
          report.code,
          report.title,
        ].filter(Boolean) as string[];

        let dbReport;
        for (const candidate of candidates) {
          dbReport = await findIssueReport(candidate);
          if (dbReport?.files?.length) break;
        }

        if (!dbReport || !dbReport.files?.length) {
          const allReports = await getAllIssueReports();
          dbReport = allReports.find((r) =>
            candidates.some(
              (c) =>
                r.id === c ||
                r.code === c ||
                (r.code && c.includes(r.code)),
            ),
          );
        }

        if (dbReport?.files?.length && isMounted) {
          const realFiles: EvidenceFile[] = dbReport.files.map((f, i) => {
            const blobUrl = URL.createObjectURL(f);
            return {
              id: `${report.issue_id}-${i}`,
              name: f.name,
              size: f.size,
              mimeType: f.type,
              url: blobUrl,
              dataUrl: blobUrl,
              type: f.type.startsWith("image/")
                ? "image"
                : f.type.startsWith("audio/")
                  ? "audio"
                  : f.type.startsWith("video/")
                    ? "video"
                    : "document",
            };
          });
          setEvidenceList(realFiles);
        } else if (
          report.evidence_files &&
          report.evidence_files.length > 0 &&
          isMounted
        ) {
          setEvidenceList(report.evidence_files);
        }
      } catch (err) {
        console.warn("Failed loading real evidence files:", err);
      } finally {
        if (isMounted) setIsLoadingFiles(false);
      }
    }

    loadRealEvidence();
    return () => {
      isMounted = false;
    };
  }, [report]);

  const evidenceCount = evidenceList.length;
  const severity =
    severityStyle[report.severity] || severityStyle.Low;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-20 flex justify-between border-b bg-white px-6 py-5">
          <div>
            <p className="text-xs text-slate-400">
              รายละเอียดคำร้อง
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-emerald-700">
              #{getDisplayId(report)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-slate-100"
          >
            <X className="mx-auto h-4 w-4" />
          </button>
        </div>

        <div className="space-y-7 p-6">
          <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-xs text-slate-400">
              ประเภทปัญหา
            </p>
            <p className="mt-1 text-base font-extrabold">
              {report.issue_categories?.category_name ||
                report.title}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              หัวข้อ:{" "}
              <span data-user-content="true" className="notranslate">
                {report.title}
              </span>
            </p>
          </section>

          <DetailSection
            title="ข้อมูลผู้แจ้ง"
            icon={<UserRound className="h-4 w-4" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard
                icon={<UserRound className="h-4 w-4" />}
                label="ชื่อผู้แจ้ง"
                value={displayValue(report.reporter_name)}
              />
              <InfoCard
                icon={<Mail className="h-4 w-4" />}
                label="อีเมล"
                value={displayValue(report.reporter_email)}
              />
              <InfoCard
                icon={<UserRound className="h-4 w-4" />}
                label="เบอร์โทรศัพท์"
                value={displayValue(report.reporter_phone)}
              />
              <InfoCard
                icon={<ShieldCheck className="h-4 w-4" />}
                label="ผู้รับผิดชอบ"
                value={
                  report.admin_name ||
                  report.adminName ||
                  "ยังไม่มีผู้รับผิดชอบ"
                }
              />
            </div>
          </DetailSection>

          <DetailSection
            title="ข้อมูลเหตุการณ์"
            icon={<MapPin className="h-4 w-4" />}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard
                icon={<FileText className="h-4 w-4" />}
                label="หัวข้อปัญหา"
                value={displayValue(report.title)}
              />
              <InfoCard
                icon={<ClipboardList className="h-4 w-4" />}
                label="ประเภทปัญหา"
                value={
                  report.issue_categories?.category_name || "ทั่วไป"
                }
              />
              <InfoCard
                icon={<MapPin className="h-4 w-4" />}
                label="ประเภทสถานที่"
                value={displayValue(report.placeType)}
              />
              <InfoCard
                icon={<MapPin className="h-4 w-4" />}
                label="อาคาร / สถานที่"
                value={
                  report.place ||
                  report.issue_areas?.area_name ||
                  "มหาวิทยาลัยวลัยลักษณ์"
                }
              />
              <InfoCard
                icon={<MapPin className="h-4 w-4" />}
                label="ชั้น"
                value={displayValue(report.floor)}
              />
              <InfoCard
                icon={<MapPin className="h-4 w-4" />}
                label="บริเวณที่พบปัญหา"
                value={displayValue(report.area)}
              />
              <InfoCard
                icon={<CalendarDays className="h-4 w-4" />}
                label="วันที่พบเหตุ"
                value={formatReportDate(report.occurredAt)}
              />
              <InfoCard
                icon={<CalendarDays className="h-4 w-4" />}
                label="วันที่ส่งคำร้อง"
                value={formatCreatedDate(report.date_created)}
              />
              <InfoCard
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="ปัญหายังเกิดอยู่หรือไม่"
                value={displayValue(report.ongoing)}
              />
              <InfoCard
                icon={<RotateCw className="h-4 w-4" />}
                label="ความถี่ที่พบ"
                value={displayValue(report.frequency)}
              />
              <InfoCard
                icon={<CalendarDays className="h-4 w-4" />}
                label="ช่วงเวลาที่มักพบ"
                value={
                  report.commonPeriods?.length
                    ? report.commonPeriods.join(", ")
                    : "ตลอดทั้งวัน / ระหว่างช่วงเวลาทำกิจกรรม"
                }
              />
              <InfoCard
                icon={<XCircle className="h-4 w-4" />}
                label="ระดับความเร่งด่วน"
                value={report.urgency || severity.label}
              />
            </div>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] text-slate-400">
                สถานที่แบบเต็ม
              </p>
              <p className="mt-2 text-sm font-semibold">
                {report.location ||
                  report.issue_areas?.area_name ||
                  report.place ||
                  "มหาวิทยาลัยวลัยลักษณ์"}
              </p>
            </div>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] text-slate-400">
                จุดสังเกตเพิ่มเติม
              </p>
              <p className="mt-2 text-sm leading-6">
                {displayValue(report.locationDetail)}
              </p>
            </div>
          </DetailSection>

          {report.answers && report.answers.length > 0 && (
            <DetailSection
              title="รายละเอียดตามประเภทปัญหา"
              icon={<ClipboardList className="h-4 w-4" />}
            >
              <div className="divide-y overflow-hidden rounded-2xl border">
                {report.answers.map((answer, index) => (
                  <div
                    key={`${answer.label}-${index}`}
                    className="grid gap-1 px-4 py-3 sm:grid-cols-[190px_1fr]"
                  >
                    <p className="text-xs font-semibold text-slate-500">
                      {answer.label}
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {answer.values.length
                        ? answer.values.join(", ")
                        : "ไม่ได้ระบุ"}
                    </p>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          <DetailSection
            title="รายละเอียดปัญหา"
            icon={<FileText className="h-4 w-4" />}
          >
            <div className="space-y-3">
              <TextDetail
                label="รายละเอียดจากผู้ใช้งาน"
                value={report.description}
              />
              {report.additional &&
                report.additional.trim() !==
                  report.description.trim() && (
                  <TextDetail
                    label="รายละเอียดเพิ่มเติม"
                    value={report.additional}
                  />
                )}
            </div>
          </DetailSection>

          <DetailSection
            title="ผลกระทบและความเร่งด่วน"
            icon={<ShieldCheck className="h-4 w-4" />}
          >
            <TextDetail
              label="ผลกระทบที่ได้รับ"
              value={
                getImpactText(report) ||
                "กระทบต่อการใช้ชีวิตประจำวันและการเรียนการสอน"
              }
            />
            {report.urgencyReason && (
              <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                <p className="text-[11px] text-rose-500">
                  เหตุผลที่ต้องการให้ตรวจสอบทันที
                </p>
                <p
                  className="mt-2 text-sm leading-6 text-rose-700 notranslate"
                  data-user-content="true"
                >
                  {report.urgencyReason}
                </p>
              </div>
            )}
          </DetailSection>

          {report.rejection_reason && (
            <DetailSection
              title="เหตุผลที่ปฏิเสธ"
              icon={<XCircle className="h-4 w-4" />}
            >
              <div
                className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700 notranslate"
                data-user-content="true"
              >
                {report.rejection_reason}
              </div>
            </DetailSection>
          )}

          <DetailSection
            title="หลักฐานประกอบ"
            icon={<FolderOpen className="h-4 w-4" />}
          >
            <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div>
                <p className="font-bold">
                  หลักฐานแนบ {evidenceCount} ไฟล์
                </p>
                <p className="text-xs text-slate-400">
                  รูปภาพ เสียง วิดีโอ และเอกสารประกอบ
                </p>
              </div>
              <button
                type="button"
                disabled={evidenceCount === 0}
                onClick={onOpenEvidence}
                className="rounded-full bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:bg-slate-300 cursor-pointer"
              >
                ดูหลักฐานทั้งหมด ({evidenceCount})
              </button>
            </div>

            {evidenceCount > 0 ? (
              <div className="mt-3 space-y-3">
                {/* Image thumbnails row */}
                {evidenceList.some((f) => getEvidenceType(f) === "image") && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    {evidenceList
                      .filter((f) => getEvidenceType(f) === "image")
                      .map((f, i) => {
                        const imgUrl = f.url || f.dataUrl || getFallbackEvidenceUrl(f);
                        return (
                          <div
                            key={`thumb-${f.id || i}`}
                            onClick={() => (onOpenFile ? onOpenFile(f) : onOpenEvidence())}
                            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white aspect-video flex items-center justify-center hover:border-emerald-500 hover:shadow-md transition"
                            title={`คลิกเพื่อดูรูปภาพ: ${f.name}`}
                          >
                            <img
                              src={imgUrl}
                              alt={f.name}
                              className="w-full h-full object-cover transition group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Eye className="w-5 h-5 drop-shadow" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* List of files with Open & Download */}
                <div className="space-y-2">
                  {evidenceList.map((f, i) => (
                    <EvidenceRow
                      key={f.id || `${f.name}-${i}`}
                      file={f}
                      onOpen={() => (onOpenFile ? onOpenFile(f) : onOpenEvidence())}
                      onDownload={() => (onDownload ? onDownload(f) : undefined)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                ไม่มีหลักฐานแนบสำหรับคำร้องนี้
              </div>
            )}
          </DetailSection>
        </div>

        <div className="sticky bottom-0 flex justify-end border-t bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-emerald-700 px-8 py-2.5 text-xs font-bold text-white cursor-pointer hover:bg-emerald-800 transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

function EvidenceModal({
  report,
  previewFile,
  onBack,
  onClose,
  onOpenFile,
  onDownload,
}: {
  report: Report;
  previewFile: EvidenceFile | null;
  onBack: () => void;
  onClose: () => void;
  onOpenFile: (file: EvidenceFile) => void;
  onDownload: (file: EvidenceFile) => void;
}) {
  const [files, setFiles] = useState<EvidenceFile[]>(() => getReportEvidence(report));

  useEffect(() => {
    let isMounted = true;
    async function loadRealEvidence() {
      try {
        const candidates = [
          report.internal_id,
          report.id,
          String(report.issue_id),
          getDisplayId(report),
          report.code,
          report.title,
        ].filter(Boolean) as string[];

        let dbReport;
        for (const candidate of candidates) {
          dbReport = await findIssueReport(candidate);
          if (dbReport?.files?.length) break;
        }

        if (!dbReport || !dbReport.files?.length) {
          const allReports = await getAllIssueReports();
          dbReport = allReports.find((r) =>
            candidates.some(
              (c) =>
                r.id === c ||
                r.code === c ||
                (r.code && c.includes(r.code)),
            ),
          );
        }

        if (dbReport?.files?.length && isMounted) {
          const realFiles: EvidenceFile[] = dbReport.files.map((f, i) => {
            const blobUrl = URL.createObjectURL(f);
            return {
              id: `${report.issue_id}-${i}`,
              name: f.name,
              size: f.size,
              mimeType: f.type,
              url: blobUrl,
              dataUrl: blobUrl,
              type: f.type.startsWith("image/")
                ? "image"
                : f.type.startsWith("audio/")
                  ? "audio"
                  : f.type.startsWith("video/")
                    ? "video"
                    : "document",
            };
          });
          setFiles(realFiles);
        } else if (report.evidence_files && report.evidence_files.length > 0 && isMounted) {
          setFiles(report.evidence_files);
        }
      } catch (err) {
        console.warn("Failed loading files in EvidenceModal:", err);
      }
    }
    loadRealEvidence();
    return () => {
      isMounted = false;
    };
  }, [report]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between border-b px-6 py-5">
          <div>
            <p className="text-xs text-slate-400">
              หลักฐานประกอบ
            </p>
            <h2 className="font-extrabold text-emerald-700">
              #{getDisplayId(report)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="mx-auto h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {previewFile ? (
            <>
              <button
                type="button"
                onClick={onBack}
                className="mb-4 flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับไปรายการไฟล์
              </button>
              <FilePreview file={previewFile} />
            </>
          ) : (
            <div className="space-y-3">
              <p className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                เอกสารและไฟล์แนบทั้งหมด ({files.length} ไฟล์)
              </p>
              {files.map((file, index) => (
                <EvidenceRow
                  key={file.id || `${file.name}-${index}`}
                  file={file}
                  onOpen={() => onOpenFile(file)}
                  onDownload={() => onDownload(file)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EvidenceRow({
  file,
  onOpen,
  onDownload,
}: {
  file: EvidenceFile;
  onOpen: () => void;
  onDownload?: () => void;
}) {
  const type = getEvidenceType(file);

  const Icon =
    type === "image"
      ? FileImage
      : type === "audio"
        ? FileAudio
        : type === "video"
          ? FileVideo
          : FileText;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-slate-300 transition">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs sm:text-sm font-bold text-slate-800">
          {file.name}
        </p>
        <p className="text-[11px] text-slate-400">
          {formatFileSize(file.size)}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5 text-emerald-600" />
          <span>เปิดดู</span>
        </button>

        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>ดาวน์โหลด</span>
          </button>
        )}
      </div>
    </div>
  );
}

function FilePreview({
  file,
}: {
  file: EvidenceFile;
}) {
  const source = file.url || file.dataUrl;
  const type = getEvidenceType(file);

  if (!source) {
    return (
      <div className="rounded-2xl bg-slate-50 py-16 text-center text-sm text-slate-400">
        ไฟล์นี้ไม่มีข้อมูล URL สำหรับเปิดดู
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 truncate max-w-[70%]">
            {file.name}
          </span>
          <a
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Eye className="h-3.5 w-3.5 text-emerald-600" />
            เปิดดูภาพขนาดเต็ม (แท็บใหม่)
          </a>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/5 p-2 flex items-center justify-center">
          <img
            src={source}
            alt={file.name}
            className="max-h-[500px] w-auto rounded-xl object-contain shadow-sm"
          />
        </div>
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700">เครื่องเล่นเสียงหลักฐาน: {file.name}</p>
          <a
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
          >
            เปิดในแท็บใหม่
          </a>
        </div>
        <audio controls src={source} className="w-full" />
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 truncate max-w-[70%]">
            {file.name}
          </span>
          <a
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Eye className="h-3.5 w-3.5 text-emerald-600" />
            เปิดดูวิดีโอในแท็บใหม่
          </a>
        </div>
        <video controls src={source} className="max-h-[500px] w-full rounded-xl bg-black" />
      </div>
    );
  }

  // Document (PDF or other)
  const isPdf =
    file.name.toLowerCase().endsWith(".pdf") ||
    file.mimeType?.toLowerCase().includes("pdf");

  if (isPdf) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-slate-100 p-2.5">
          <span className="text-xs font-semibold text-slate-700 truncate max-w-[70%]">
            {file.name}
          </span>
          <a
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
          >
            <Eye className="h-3.5 w-3.5" />
            เปิดดู PDF ในแท็บใหม่
          </a>
        </div>
        <iframe
          src={source}
          className="h-[520px] w-full rounded-2xl border border-slate-200 bg-white"
          title={file.name}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-50 py-12 text-center">
      <FileText className="mx-auto h-12 w-12 text-slate-400" />
      <p className="mt-3 font-bold text-slate-800">{file.name}</p>
      <p className="mt-1 text-xs text-slate-400">{formatFileSize(file.size)}</p>
      <div className="mt-5 flex justify-center gap-3">
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Eye className="h-3.5 w-3.5 text-emerald-600" />
          เปิดดูในแท็บใหม่
        </a>
        <a
          href={source}
          download={file.name}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800"
        >
          <Download className="h-3.5 w-3.5" />
          ดาวน์โหลดไฟล์
        </a>
      </div>
    </div>
  );
}

function ActionBackdrop({

  children,

  onClose,

}: {

  children: ReactNode;

  onClose: () => void;

}) {

  return (

    <div

      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"

      onClick={onClose}

    >

      <div

        className="contents"

        onClick={(event) =>

          event.stopPropagation()

        }

      >

        {children}

      </div>

    </div>

  );

}

function DetailSection({

  title,

  icon,

  children,

}: {

  title: string;

  icon: ReactNode;

  children: ReactNode;

}) {

  return (

    <section>

      <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold">

        <span className="text-emerald-600">

          {icon}

        </span>

        {title}

      </h3>

      {children}

    </section>

  );

}

function TextDetail({
  label,
  value,
  isUserContent = true,
}: {
  label: string;
  value: string;
  isUserContent?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <p className="text-[11px] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 ${isUserContent ? "notranslate" : ""}`}
        {...(isUserContent ? { "data-user-content": "true" } : {})}
      >
        {displayValue(value)}
      </p>
    </div>
  );
}

function SummaryCard({
  active,
  icon,
  iconClass,
  label,
  description,
  count,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  iconClass: string;
  label: string;
  description: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm ${
        active
          ? "border-emerald-500 ring-1 ring-emerald-100"
          : "border-slate-200"
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">
          {label}
        </span>
        <span className="text-[11px] text-slate-400">
          {description}
        </span>
      </span>
      <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
        {count}
      </span>
    </button>
  );
}

function InfoCard({
  icon,
  label,
  value,
  isUserContent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  isUserContent?: boolean;
}) {
  const isUser =
    isUserContent ||
    label.includes("ผู้แจ้ง") ||
    label.includes("ผู้รับผิดชอบ") ||
    label.includes("ผู้ตรวจสอบ") ||
    label.includes("หัวข้อปัญหา");

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] text-slate-400">
            {label}
          </p>
          <p
            className={`mt-1 break-words text-xs font-bold ${isUser ? "notranslate" : ""}`}
            {...(isUser ? { "data-user-content": "true" } : {})}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
