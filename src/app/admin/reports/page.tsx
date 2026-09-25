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

    floor: "",

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

function readDemoReports(): Report[] {

  const saved =

    window.localStorage.getItem(DEMO_REPORTS_KEY);

  if (!saved) {

    window.localStorage.setItem(

      DEMO_REPORTS_KEY,

      JSON.stringify(demoReports),

    );

    return demoReports;

  }

  try {

    const parsed = JSON.parse(saved) as Report[];

    return Array.isArray(parsed)

      ? parsed

      : demoReports;

  } catch {

    window.localStorage.setItem(

      DEMO_REPORTS_KEY,

      JSON.stringify(demoReports),

    );

    return demoReports;

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

  const [savingId, setSavingId] =

    useState<number | null>(null);

  const loadReports = useCallback(

    (showLoading = true) => {

      if (showLoading) setLoading(true);

      const nextReports = readDemoReports().sort(

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

    const refresh = () => loadReports(false);

    window.addEventListener("storage", refresh);

    window.addEventListener(

      "unicare-demo-reports-updated",

      refresh,

    );

    return () => {

      window.removeEventListener(

        "storage",

        refresh,

      );

      window.removeEventListener(

        "unicare-demo-reports-updated",

        refresh,

      );

    };

  }, [loadReports]);

  function closeStatusModal() {

    if (savingId !== null) return;

    setPendingAction(null);

    setRejectionReason("");

    setModalError("");

  }

  function updateReportStatus(

    report: Report,

    nextStatus: Status,

    options?: {

      isRejection?: boolean;

      rejectionReason?: string;

    },

  ) {

    setSavingId(report.issue_id);

    const isAccept =

      nextStatus === "In_Progress";

    const isRejection =

      options?.isRejection === true;

    const reason =

      options?.rejectionReason?.trim() || "";

    const displayId = getDisplayId(report);

    const category =

      report.issue_categories?.category_name ||

      report.title ||

      "ทั่วไป";

    const adminName =

      getCurrentAdminDisplayName();

    const adminInitial =

      getAdminInitials(adminName);

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

    setReports(nextReports);

    saveDemoReports(nextReports);

    if (isRejection) {

      addNotification({

        title: "คำร้องเรียนถูกปฏิเสธ",

        description: `คำร้องเรียน #${displayId} (${category}) ถูกปฏิเสธ เหตุผล: ${reason}`,

        type: "urgent",

        isRead: false,

        link: "/my-reports",

        targetRole: "user",

        targetEmail:

          report.reporter_email || undefined,

        targetName:

          report.reporter_name || undefined,

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

        targetEmail:

          report.reporter_email || undefined,

        targetName:

          report.reporter_name || undefined,

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

  function confirmAccept() {

    if (pendingAction?.type !== "accept") return;

    updateReportStatus(

      pendingAction.report,

      "In_Progress",

    );

  }

  function confirmReject() {

    if (pendingAction?.type !== "reject") return;

    const reason = rejectionReason.trim();

    if (!reason) {

      setModalError(

        "กรุณาระบุเหตุผลในการปฏิเสธคำร้อง",

      );

      return;

    }

    updateReportStatus(

      pendingAction.report,

      "Closed",

      {

        isRejection: true,

        rejectionReason: reason,

      },

    );

  }

  function openEvidenceFile(file: EvidenceFile) {

    const url = file.url || file.dataUrl;

    if (!url) {

      window.alert(

        "ไฟล์นี้เป็นข้อมูลทดลอง จึงยังไม่มีไฟล์จริงสำหรับเปิดดู",

      );

      return;

    }

    setPreviewFile(file);

  }

  function downloadEvidenceFile(

    file: EvidenceFile,

  ) {

    const url = file.url || file.dataUrl;

    if (!url) {

      window.alert(

        "ไฟล์นี้เป็นข้อมูลทดลอง จึงยังไม่สามารถดาวน์โหลดได้",

      );

      return;

    }

    const link = document.createElement("a");

    link.href = url;

    link.download = file.name;

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

  report,

  onClose,

  onOpenEvidence,

}: {

  report: Report;

  onClose: () => void;

  onOpenEvidence: () => void;

}) {

  const evidenceCount =

    getReportEvidence(report).length;

  const severity =

    severityStyle[report.severity] ||

    severityStyle.Low;

  return (

    <div

      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"

      onClick={onClose}

    >

      <div

        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"

        onClick={(event) =>

          event.stopPropagation()

        }

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

              {report.issue_categories

                ?.category_name ||

                report.title}

            </p>

            <p className="mt-2 text-sm text-slate-600">

              หัวข้อ: {report.title}

            </p>

          </section>

          <DetailSection

            title="ข้อมูลผู้แจ้ง"

            icon={

              <UserRound className="h-4 w-4" />

            }

          >

            <div className="grid gap-3 sm:grid-cols-2">

              <InfoCard

                icon={

                  <UserRound className="h-4 w-4" />

                }

                label="ชื่อผู้แจ้ง"

                value={displayValue(

                  report.reporter_name,

                )}

              />

              <InfoCard

                icon={

                  <Mail className="h-4 w-4" />

                }

                label="อีเมล"

                value={displayValue(

                  report.reporter_email,

                )}

              />

              <InfoCard

                icon={

                  <UserRound className="h-4 w-4" />

                }

                label="เบอร์โทรศัพท์"

                value={displayValue(

                  report.reporter_phone,

                )}

              />

              <InfoCard

                icon={

                  <ShieldCheck className="h-4 w-4" />

                }

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

            icon={

              <MapPin className="h-4 w-4" />

            }

          >

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

              <InfoCard

                icon={

                  <FileText className="h-4 w-4" />

                }

                label="หัวข้อปัญหา"

                value={displayValue(

                  report.title,

                )}

              />

              <InfoCard

                icon={

                  <ClipboardList className="h-4 w-4" />

                }

                label="ประเภทปัญหา"

                value={

                  report.issue_categories

                    ?.category_name ||

                  "ไม่ได้ระบุ"

                }

              />

              <InfoCard

                icon={

                  <MapPin className="h-4 w-4" />

                }

                label="ประเภทสถานที่"

                value={displayValue(

                  report.placeType,

                )}

              />

              <InfoCard

                icon={

                  <MapPin className="h-4 w-4" />

                }

                label="อาคาร / สถานที่"

                value={

                  report.place ||

                  report.issue_areas

                    ?.area_name ||

                  "ไม่ได้ระบุ"

                }

              />

              <InfoCard

                icon={

                  <MapPin className="h-4 w-4" />

                }

                label="ชั้น"

                value={displayValue(

                  report.floor,

                )}

              />

              <InfoCard

                icon={

                  <MapPin className="h-4 w-4" />

                }

                label="บริเวณที่พบปัญหา"

                value={displayValue(

                  report.area,

                )}

              />

              <InfoCard

                icon={

                  <CalendarDays className="h-4 w-4" />

                }

                label="วันที่พบเหตุ"

                value={formatReportDate(

                  report.occurredAt,

                )}

              />

              <InfoCard

                icon={

                  <CalendarDays className="h-4 w-4" />

                }

                label="วันที่ส่งคำร้อง"

                value={formatCreatedDate(

                  report.date_created,

                )}

              />

              <InfoCard

                icon={

                  <CheckCircle2 className="h-4 w-4" />

                }

                label="ปัญหายังเกิดอยู่หรือไม่"

                value={displayValue(

                  report.ongoing,

                )}

              />

              <InfoCard

                icon={

                  <RotateCw className="h-4 w-4" />

                }

                label="ความถี่ที่พบ"

                value={displayValue(

                  report.frequency,

                )}

              />

              <InfoCard

                icon={

                  <CalendarDays className="h-4 w-4" />

                }

                label="ช่วงเวลาที่มักพบ"

                value={

                  report.commonPeriods?.length

                    ? report.commonPeriods.join(

                        ", ",

                      )

                    : "ไม่ได้ระบุ"

                }

              />

              <InfoCard

                icon={

                  <XCircle className="h-4 w-4" />

                }

                label="ระดับความเร่งด่วน"

                value={

                  report.urgency ||

                  severity.label

                }

              />

            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

              <p className="text-[11px] text-slate-400">

                สถานที่แบบเต็ม

              </p>

              <p className="mt-2 text-sm font-semibold">

                {report.location ||

                  report.issue_areas

                    ?.area_name ||

                  "ไม่ได้ระบุ"}

              </p>

            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

              <p className="text-[11px] text-slate-400">

                จุดสังเกตเพิ่มเติม

              </p>

              <p className="mt-2 text-sm leading-6">

                {displayValue(

                  report.locationDetail,

                )}

              </p>

            </div>

          </DetailSection>

          {report.answers &&

            report.answers.length > 0 && (

              <DetailSection

                title="รายละเอียดตามประเภทปัญหา"

                icon={

                  <ClipboardList className="h-4 w-4" />

                }

              >

                <div className="divide-y overflow-hidden rounded-2xl border">

                  {report.answers.map(

                    (answer, index) => (

                      <div

                        key={`${answer.label}-${index}`}

                        className="grid gap-1 px-4 py-3 sm:grid-cols-[190px_1fr]"

                      >

                        <p className="text-xs font-semibold text-slate-500">

                          {answer.label}

                        </p>

                        <p className="text-xs font-bold text-slate-700">

                          {answer.values.length

                            ? answer.values.join(

                                ", ",

                              )

                            : "ไม่ได้ระบุ"}

                        </p>

                      </div>

                    ),

                  )}

                </div>

              </DetailSection>

            )}

          <DetailSection

            title="รายละเอียดปัญหา"

            icon={

              <FileText className="h-4 w-4" />

            }

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

            icon={

              <ShieldCheck className="h-4 w-4" />

            }

          >

            <TextDetail

              label="ผลกระทบที่ได้รับ"

              value={

                getImpactText(report) ||

                "ไม่ได้ระบุ"

              }

            />

            {report.urgencyReason && (

              <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">

                <p className="text-[11px] text-rose-500">

                  เหตุผลที่ต้องการให้ตรวจสอบทันที

                </p>

                <p className="mt-2 text-sm leading-6 text-rose-700">

                  {report.urgencyReason}

                </p>

              </div>

            )}

          </DetailSection>

          {report.rejection_reason && (

            <DetailSection

              title="เหตุผลที่ปฏิเสธ"

              icon={

                <XCircle className="h-4 w-4" />

              }

            >

              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">

                {report.rejection_reason}

              </div>

            </DetailSection>

          )}

          <DetailSection

            title="หลักฐานประกอบ"

            icon={

              <FolderOpen className="h-4 w-4" />

            }

          >

            <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

              <div>

                <p className="font-bold">

                  หลักฐานแนบ {evidenceCount} ไฟล์

                </p>

                <p className="text-xs text-slate-400">

                  รูปภาพ เสียง และเอกสารประกอบ

                </p>

              </div>

              <button

                type="button"

                disabled={evidenceCount === 0}

                onClick={onOpenEvidence}

                className="rounded-full bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white disabled:bg-slate-300"

              >

                ดูหลักฐานทั้งหมด

              </button>

            </div>

          </DetailSection>

        </div>

        <div className="sticky bottom-0 flex justify-end border-t bg-white px-6 py-4">

          <button

            type="button"

            onClick={onClose}

            className="rounded-xl bg-emerald-700 px-8 py-2.5 text-xs font-bold text-white"

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

  const files = getReportEvidence(report);

  return (

    <div

      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4"

      onClick={onClose}

    >

      <div

        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"

        onClick={(event) =>

          event.stopPropagation()

        }

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

            className="h-9 w-9 rounded-full bg-slate-100"

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

                className="mb-4 flex items-center gap-1 text-xs font-bold text-emerald-700"

              >

                <ArrowLeft className="h-4 w-4" />

                กลับไปรายการไฟล์

              </button>

              <FilePreview file={previewFile} />

            </>

          ) : (

            <div className="space-y-3">

              <p className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">

                {files.length} ไฟล์

              </p>

              {files.map((file, index) => (

                <EvidenceRow

                  key={

                    file.id ||

                    `${file.name}-${index}`

                  }

                  file={file}

                  onOpen={() =>

                    onOpenFile(file)

                  }

                  onDownload={() =>

                    onDownload(file)

                  }

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

  onDownload: () => void;

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

    <div className="flex items-center gap-3 rounded-2xl border p-4">

      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">

        <Icon className="h-5 w-5" />

      </span>

      <div className="min-w-0 flex-1">

        <p className="truncate text-sm font-bold">

          {file.name}

        </p>

        <p className="text-[10px] text-slate-400">

          {formatFileSize(file.size)}

        </p>

      </div>

      <button

        type="button"

        onClick={onOpen}

        className="rounded-lg border px-3 py-2 text-xs"

      >

        เปิดดู

      </button>

      <button

        type="button"

        onClick={onDownload}

        className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs text-white"

      >

        <Download className="h-3.5 w-3.5" />

        ดาวน์โหลด

      </button>

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

        ไฟล์ทดลองนี้ยังไม่มี URL สำหรับเปิดดู

      </div>

    );

  }

  if (type === "image") {

    return (

      <img

        src={source}

        alt={file.name}

        className="mx-auto max-h-[500px] rounded-xl"

      />

    );

  }

  if (type === "audio") {

    return (

      <audio

        controls

        src={source}

        className="w-full"

      />

    );

  }

  if (type === "video") {

    return (

      <video

        controls

        src={source}

        className="max-h-[500px] w-full rounded-xl"

      />

    );

  }

  return (

    <div className="rounded-2xl bg-slate-50 py-16 text-center">

      <FileText className="mx-auto h-12 w-12 text-slate-300" />

      <p className="mt-3 font-bold">{file.name}</p>

      <p className="text-xs text-slate-400">

        กรุณาดาวน์โหลดเพื่อเปิดดู

      </p>

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

}: {

  label: string;

  value: string;

}) {

  return (

    <div className="rounded-2xl border bg-slate-50 p-4">

      <p className="text-[11px] text-slate-400">

        {label}

      </p>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">

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

}: {

  icon: ReactNode;

  label: string;

  value: string;

}) {

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

          <p className="mt-1 break-words text-xs font-bold">

            {value}

          </p>

        </div>

      </div>

    </div>

  );

}
