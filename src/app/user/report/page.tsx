"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDemoSession } from "@/lib/demoAuth";
import {
  saveIssueReport,
  type IssueReport,
  type Urgency,
} from "@/lib/issueReports";
import { getDisabledCategoryNames } from "@/lib/issuesData";
import { addNotification } from "@/lib/notifications";
import Header from "@/components/Header";

type Question = {
  key: string;
  label: string;
  options: string[];
  multiple?: boolean;
  exclusive?: string;
};

const QUESTIONS: Record<string, Question[]> = {
  เสียงรบกวน: [
    {
      key: "source",
      label: "แหล่งกำเนิดเสียง",
      options: [
        "เพลง / ลำโพง",
        "ก่อสร้าง",
        "ยานพาหนะ",
        "พูดคุย / กิจกรรม",
        "ไม่ทราบ",
        "อื่น ๆ",
      ],
    },
    {
      key: "nature",
      label: "ลักษณะเสียง",
      options: ["ดังต่อเนื่อง", "ดังเป็นช่วง ๆ", "เสียงกระแทก"],
      multiple: true,
    },
    {
      key: "duration",
      label: "ระยะเวลาต่อครั้ง",
      options: [
        "ไม่เกิน 15 นาที",
        "มากกว่า 15–60 นาที",
        "มากกว่า 1 ชั่วโมง",
        "ไม่แน่ใจ",
      ],
    },
  ],
  "ขยะ / ของเสีย": [
    {
      key: "nature",
      label: "ลักษณะปัญหา",
      options: ["ขยะล้นถัง", "ทิ้งผิดจุด", "ขยะตกค้าง", "อื่น ๆ"],
    },
    {
      key: "kind",
      label: "ประเภทขยะ",
      options: [
        "เศษอาหาร",
        "ขยะทั่วไป",
        "ขยะรีไซเคิล",
        "ขยะอันตราย",
        "ไม่ทราบ",
      ],
      multiple: true,
      exclusive: "ไม่ทราบ",
    },
  ],
  "น้ำ / น้ำเสีย": [
    {
      key: "nature",
      label: "ลักษณะปัญหา",
      options: ["น้ำรั่ว", "น้ำขัง", "น้ำเสีย", "อื่น ๆ"],
    },
    {
      key: "observed",
      label: "สิ่งที่สังเกตพบ",
      options: [
        "มีกลิ่น",
        "สีผิดปกติ",
        "มีเศษขยะ",
        "ไม่พบสิ่งผิดปกติเพิ่มเติม",
      ],
      multiple: true,
      exclusive: "ไม่พบสิ่งผิดปกติเพิ่มเติม",
    },
  ],
  "อากาศ / มลพิษ": [
    {
      key: "nature",
      label: "ลักษณะปัญหา",
      options: ["ฝุ่น", "ควัน", "กลิ่นรบกวน", "อื่น ๆ"],
      multiple: true,
    },
    {
      key: "source",
      label: "แหล่งที่มา",
      options: ["การเผา", "ยานพาหนะ", "ก่อสร้าง", "ไม่ทราบ", "อื่น ๆ"],
    },
  ],
  แสงสว่าง: [
    {
      key: "nature",
      label: "ลักษณะปัญหา",
      options: [
        "ไฟดับ",
        "ไฟกะพริบ",
        "แสงไม่เพียงพอ",
        "แสงส่องรบกวน",
        "อื่น ๆ",
      ],
    },
    {
      key: "position",
      label: "บริเวณที่เกิดปัญหา",
      options: ["ภายในอาคาร", "ภายนอกอาคาร"],
    },
  ],
  "ต้นไม้ / พื้นที่สีเขียว": [
    {
      key: "nature",
      label: "ลักษณะปัญหา",
      options: [
        "กิ่งไม้หัก",
        "ต้นไม้ล้ม",
        "กิ่งไม้ยื่นกีดขวาง",
        "พื้นที่เสียหาย",
        "อื่น ๆ",
      ],
    },
    {
      key: "obstruction",
      label: "กีดขวางทางหรือไม่",
      options: ["ไม่กีดขวาง", "กีดขวางบางส่วน", "ผ่านไม่ได้", "ไม่แน่ใจ"],
    },
  ],
  "อื่น ๆ": [],
};

type PlaceOption = {
  name: string;
  floors?: string[];
};

type PlaceConfig = {
  label: string;
  places: PlaceOption[];
  areas: string[];
};

// ข้อมูลตัวอย่างสำหรับทดสอบ
// เปลี่ยนชื่ออาคาร ชั้น และบริเวณให้ตรงกับสถานที่จริง
const PLACE_CONFIG: Record<string, PlaceConfig> = {
  อาคารเรียน: {
    label: "อาคาร",
    places: [
      {
        name: "อาคารเรียนรวม 1",
        floors: ["ชั้น 1", "ชั้น 2", "ชั้น 3"],
      },
      {
        name: "อาคารเรียนรวม 3",
        floors: ["ชั้น 1", "ชั้น 2", "ชั้น 3"],
      },
      {
        name: "อาคารเรียนรวม 5",
        floors: ["ชั้น 1", "ชั้น 2", "ชั้น 3"],
      },
      {
        name: "อาคารเรียนรวม 7",
        floors: ["ชั้น 1", "ชั้น 2", "ชั้น 3"],
      },
       {
        name: "อาคารเรียนรวม ST",
        floors: ["ชั้น 1", "ชั้น 2", "ชั้น 3", "ชั้น 4"],
      },
    ],
    areas: ["ห้องเรียน", "ห้องน้ำ", "ทางเดิน", "บันได", "หน้าอาคาร"],
  },
  หอพัก: {
    label: "ชื่อหอพัก",
    places: [
      { name: "หอพักลักษณานิเวศ 1" },
      { name: "หอพักลักษณานิเวศ 2" },
      { name: "หอพักลักษณานิเวศ 3" },
      { name: "หอพักลักษณานิเวศ 4" },
      { name: "หอพักลักษณานิเวศ 5" },
      { name: "หอพักลักษณานิเวศ 7" },
      { name: "หอพักลักษณานิเวศ 10" },
      { name: "หอพักลักษณานิเวศ 11" },
      { name: "หอพักลักษณานิเวศ 14" },
      { name: "หอพักลักษณานิเวศ 16" },
      { name: "หอพักลักษณานิเวศ 17" },
      { name: "หอพักลักษณานิเวศ 18" },
      { name: "หอพักลักษณานิเวศ 3" },
      { name: " WU Residence A" },
      { name: " WU Residence B" },
      { name: " WU Residence C" },
      
    ],
    areas: [
      "ภายในอาคาร",
      "หน้าอาคาร",
      "หลังอาคาร",
      "จุดทิ้งขยะ",
      "ลานจอดรถ",
    ],
  },
  โรงอาหาร: {
    label: "ชื่อโรงอาหาร",
    places: [
      { name: "โรงมืด" },
      { name: "โรงกิจ" },
    ],
    areas: ["ที่นั่ง", "จุดคืนจาน", "จุดทิ้งขยะ", "ร้านอาหาร", "ทางเข้า"],
  },
  ห้องสมุด: {
    label: "อาคารหรือชื่อห้องสมุด",
    places: [
      {
        name: "ห้องสมุด",
        floors: ["ชั้น 1", "ชั้น 2", "ชั้น 3"],
      },
    ],
    areas: ["พื้นที่อ่านหนังสือ", "ห้องน้ำ", "ทางเดิน", "ทางเข้า"],
  },
  สนามกีฬา: {
    label: "สนามหรือพื้นที่",
    places: [
      { name: "สนามฟุตซอลในร่มมาตรฐาน" }, 
      { name: "สนามฟุตซอลกลางแจ้ง" },
      { name: "สนามฟุตบอลหญ้าเทียม" },
      { name: "สนามบาสเกตบอล" },
      { name: "สนามเทนนิส" },
      { name: "สนามไดร์ฟกอล์ฟ" },
      { name: "สนามแบดมินตัน" },
      { name: "สนามกีฬาเทนนิส" },
    ],
    areas: ["ภายในสนาม", "อัฒจันทร์", "ทางเข้า", "ห้องน้ำ", "รอบสนาม"],
  },
  "ถนน / ทางเดิน": {
    label: "เส้นทางหรือพื้นที่",
    places: [
      { name: "ทางเดินบริเวณอาคารเรียน" },
      { name: "ทางเดินบริเวณหอพัก" },
      { name: "ถนนบริเวณโรงอาหาร" },
    ],
    areas: [],
  },
};

const OTHER = "อื่น ๆ";

const FREQUENCIES = [
  "พบครั้งแรก",
  "พบเป็นบางครั้ง",
  "พบเป็นประจำ",
];

const PERIODS = ["เช้า", "กลางวัน", "เย็น", "กลางคืน", "ไม่แน่นอน"];

const IMPACTS = [
  "รบกวนการเรียน / การทำงาน",
  "รบกวนการพักผ่อน",
  "ทำให้ใช้พื้นที่ไม่สะดวก",
  OTHER,
];


const URGENCIES: {
  value: Urgency;
  icon: string;
  description: string;
}[] = [
  {
    value: "ปกติ",
    icon: "🟢",
    description: "สามารถรอการตรวจสอบตามลำดับได้",
  },
  {
    value: "เร่งด่วน",
    icon: "🟡",
    description:
      "ควรตรวจสอบโดยเร็ว เพราะปัญหายังเกิดอยู่และหากปล่อยไว้อาจกระทบมากขึ้น",
  },
  {
    value: "เร่งด่วนมาก",
    icon: "🔴",
    description:
      "ต้องการให้ตรวจสอบทันที เพราะมีอันตรายหรือความเสียหายที่กำลังเกิดขึ้น",
  },
];

const STEPS = [
  "ข้อมูลปัญหา",
  "ผลกระทบและความเร่งด่วน",
  "หลักฐาน",
  "ตรวจสอบข้อมูล",
];

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/ogg",
];

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

type ReportForm = {
  title: string;
  category: string;
  categoryOther: string;
  otherProblem: string;
  answers: Record<string, string[]>;
  answerOther: Record<string, string>;

  placeType: string;
  place: string;
  placeOther: string;
  floor: string;
  floorOther: string;
  area: string;
  areaOther: string;
  locationOther: string;
  landmark: string;

  occurredAt: string;
  ongoing: string;
  additional: string;
  frequency: string;
  commonPeriods: string[];
  impacts: string[];
  impactOther: string;
  urgency: Urgency | "";
  urgencyReason: string;
};

function emptyForm(): ReportForm {
  return {
    title: "",
    category: "",
    categoryOther: "",
    otherProblem: "",
    answers: {},
    answerOther: {},
    placeType: "",
    place: "",
    placeOther: "",
    floor: "",
    floorOther: "",
    area: "",
    areaOther: "",
    locationOther: "",
    landmark: "",
    occurredAt: "",
    ongoing: "",
    additional: "",
    frequency: "",
    commonPeriods: [],
    impacts: [],
    impactOther: "",
    urgency: "",
    urgencyReason: "",
  };
}

function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T00:00:00`);
  const [year, month, day] = value.split("-").map(Number);

  if (
    !Number.isFinite(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDate(value: string): string {
  const date = parseDateOnly(value);

  return date
    ? date.toLocaleDateString("th-TH", { dateStyle: "medium" })
    : "ไม่ได้ระบุ";
}

function toggleValues(
  current: string[],
  value: string,
  exclusive?: string,
): string[] {
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }

  if (value === exclusive) return [value];

  return [...current.filter((item) => item !== exclusive), value];
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  disabledOptions = [],
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  disabledOptions?: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">กรุณาเลือก</option>
        {options.map((option) => {
          const isDisabled = disabledOptions.includes(option);
          return (
            <option
              key={option}
              value={option}
              disabled={isDisabled}
              style={
                isDisabled
                  ? { color: "#94a3b8", backgroundColor: "#f8fafc" }
                  : undefined
              }
            >
              {option} {isDisabled ? "(ปิดรับแจ้งชั่วคราว)" : ""}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 200,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <Field label={label}>
      <input
        className={inputClass}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function Choices({
  label,
  name,
  options,
  selected,
  multiple = false,
  onSelect,
}: {
  label: string;
  name: string;
  options: string[];
  selected: string[];
  multiple?: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-sm font-semibold">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${
              selected.includes(option)
                ? "border-emerald-600 bg-emerald-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              checked={selected.includes(option)}
              onChange={() => onSelect(option)}
              className="mt-1 accent-emerald-700"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function EvidencePreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 p-4">
      {url && file.type.startsWith("image/") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={file.name}
          className="mb-3 h-36 w-full rounded-lg object-contain"
        />
      )}

      {url && file.type.startsWith("audio/") && (
        <audio controls src={url} className="mb-3 w-full" />
      )}

      {url && file.type === "application/pdf" && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 inline-block text-sm text-emerald-700 underline"
        >
          เปิดดู PDF
        </a>
      )}

      <p className="break-all text-sm font-medium">{file.name}</p>
      <p className="mt-1 text-xs text-slate-500">
        {(file.size / 1024 / 1024).toFixed(2)} MB
      </p>
      <button
        type="button"
        onClick={onRemove}
        className="mt-3 text-sm text-red-600 hover:underline"
      >
        ลบไฟล์
      </button>
    </div>
  );
}

function SuccessModal({
  report,
  onNewReport,
}: {
  report: IssueReport;
  onNewReport: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const oldOverflow = document.body.style.overflow;

    if (dialog && !dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog?.close();
      document.body.style.overflow = oldOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="success-title"
      onCancel={(event) => event.preventDefault()}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-3xl border-0 bg-white p-6 text-slate-800 shadow-2xl backdrop:bg-black/50 sm:p-10"
    >
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-5xl text-emerald-700">
          ✓
        </div>
        <h2
          id="success-title"
          className="mt-5 text-2xl font-bold text-emerald-950"
        >
          บันทึกรายงานทดลองเรียบร้อยแล้ว
        </h2>
        <p className="mt-3 text-sm text-slate-500">
          ข้อมูลถูกเก็บในเบราว์เซอร์นี้ ยังไม่ได้ส่งถึงเจ้าหน้าที่
        </p>
        <p className="mt-5 font-semibold text-emerald-700">
          รหัสรายงาน {report.code}
        </p>
      </div>

      <dl className="mt-6 divide-y divide-slate-200 rounded-2xl bg-slate-50 px-5">
        {[
          ["ประเภทปัญหา", report.category],
          ["สถานที่", report.location],
          ["วันที่พบเหตุ", formatDate(report.occurredAt)],
          ["ความเร่งด่วนที่ผู้แจ้งประเมิน", report.urgency ?? "ไม่ได้ระบุ"],
          ["สถานะทดลอง", report.status],
        ].map(([label, value]) => (
          <div key={label} className="grid gap-2 py-4 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className="break-words font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/my-reports"
          className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
        >
          📋 ไปที่รายการของฉัน
        </Link>
        <Link
          href={`/user/report/detail?id=${encodeURIComponent(report.id)}`}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
        >
          ดูรายละเอียดรายงาน
        </Link>
        <button
          type="button"
          onClick={onNewReport}
          className="rounded-xl border border-emerald-300 px-5 py-3 text-sm text-emerald-800 hover:bg-emerald-50 transition"
        >
          + แจ้งปัญหาเพิ่มเติม
        </button>
        <Link
          href="/user/dashboard"
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 transition"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </dialog>
  );
}

export default function UserReportPage() {
  const router = useRouter();
  const [reporter, setReporter] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ReportForm>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savedReport, setSavedReport] = useState<IssueReport | null>(null);
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);

  const busyRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const session = getDemoSession();

    if (!session || session.role !== "user") {
      router.replace("/login");
      return;
    }

    setReporter(session.name);
  }, [router]);

  // Synchronize disabled categories from admin settings in real-time
  useEffect(() => {
    const syncDisabled = () => {
      setDisabledCategories(getDisabledCategoryNames());
    };

    syncDisabled();

    window.addEventListener("storage", syncDisabled);
    window.addEventListener("unicare-category-metadata-updated", syncDisabled);
    window.addEventListener("focus", syncDisabled);

    return () => {
      window.removeEventListener("storage", syncDisabled);
      window.removeEventListener("unicare-category-metadata-updated", syncDisabled);
      window.removeEventListener("focus", syncDisabled);
    };
  }, []);

  // Preselect from URL query param (?category=...) if valid and not disabled
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get("category");
      if (catParam && Object.keys(QUESTIONS).includes(catParam)) {
        const disabled = getDisabledCategoryNames();
        if (!disabled.includes(catParam)) {
          patch({ category: catParam });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // If currently selected category becomes disabled by admin, clear selection and alert
  useEffect(() => {
    if (form.category && disabledCategories.includes(form.category)) {
      patch({
        category: "",
        categoryOther: "",
        otherProblem: "",
        answers: {},
        answerOther: {},
      });
      setError(`หมวดหมู่ "${form.category}" ถูกปิดรับแจ้งชั่วคราวโดยผู้ดูแลระบบ`);
    }
  }, [disabledCategories, form.category]);

  useEffect(() => {
    if (reporter !== null && !savedReport) {
      headingRef.current?.focus();
    }
  }, [step, reporter, savedReport]);

  function patch(values: Partial<ReportForm>) {
    setForm((previous) => ({ ...previous, ...values }));
    setConfirmed(false);
    setError("");
  }

  function update<K extends keyof ReportForm>(
    key: K,
    value: ReportForm[K],
  ) {
    patch({ [key]: value } as Pick<ReportForm, K>);
  }

  function changeCategory(category: string) {
    if (disabledCategories.includes(category)) {
      setError(`หมวดหมู่ "${category}" ปิดรับแจ้งชั่วคราว ไม่สามารถเลือกได้`);
      return;
    }
    patch({
      category,
      categoryOther: "",
      otherProblem: "",
      answers: {},
      answerOther: {},
    });
  }

  function changePlaceType(placeType: string) {
    patch({
      placeType,
      place: "",
      placeOther: "",
      floor: "",
      floorOther: "",
      area: "",
      areaOther: "",
      locationOther: "",
      landmark: "",
    });
  }

  function changePlace(place: string) {
    patch({
      place,
      placeOther: "",
      floor: "",
      floorOther: "",
      area: "",
      areaOther: "",
      landmark: "",
    });
  }

  function selectAnswer(question: Question, option: string) {
    setForm((previous) => {
      const current = previous.answers[question.key] ?? [];
      const values = question.multiple
        ? toggleValues(current, option, question.exclusive)
        : [option];

      return {
        ...previous,
        answers: { ...previous.answers, [question.key]: values },
        answerOther: {
          ...previous.answerOther,
          [question.key]: values.includes(OTHER)
            ? previous.answerOther[question.key] ?? ""
            : "",
        },
      };
    });

    setConfirmed(false);
    setError("");
  }

  const config = PLACE_CONFIG[form.placeType];
  const selectedPlace = config?.places.find(
    (item) => item.name === form.place,
  );
  const floors = selectedPlace?.floors ?? [];

  const categoryLabel =
    form.category === OTHER
      ? `อื่น ๆ: ${form.categoryOther.trim()}`
      : form.category;

  const placeLabel =
    form.place === OTHER ? form.placeOther.trim() : form.place;

  const floorLabel =
    form.floor === OTHER ? form.floorOther.trim() : form.floor;

  const areaLabel =
    form.area === OTHER ? form.areaOther.trim() : form.area;

  const locationLabel =
    form.placeType === OTHER
      ? form.locationOther.trim()
      : [form.placeType, placeLabel, floorLabel, areaLabel]
          .filter(Boolean)
          .join(" / ");

  const answerSummary: IssueReport["answers"] =
    form.category === OTHER
      ? [{ label: "ลักษณะปัญหา", values: [form.otherProblem.trim()] }]
      : (QUESTIONS[form.category] ?? []).map((question) => ({
          label: question.label,
          values: (form.answers[question.key] ?? []).map((value) =>
            value === OTHER
              ? `อื่น ๆ: ${form.answerOther[question.key]?.trim() ?? ""}`
              : value,
          ),
        }));

  function validate(targetStep: number): string {
    if (targetStep === 1) {
      if (!form.title.trim()) return "กรุณากรอกหัวข้อปัญหา";
      if (!Object.keys(QUESTIONS).includes(form.category)) {
        return "กรุณาเลือกประเภทปัญหา";
      }

      if (disabledCategories.includes(form.category)) {
        return `หมวดหมู่ "${form.category}" ปิดรับแจ้งชั่วคราว กรุณาเลือกประเภทปัญหาอื่น`;
      }

      if (form.category === OTHER) {
        if (!form.categoryOther.trim()) return "กรุณาระบุประเภทปัญหา";
        if (!form.otherProblem.trim()) return "กรุณาอธิบายลักษณะปัญหา";
      }

      for (const question of QUESTIONS[form.category] ?? []) {
        const values = form.answers[question.key] ?? [];

        if (!values.length) return `กรุณาระบุ: ${question.label}`;

        if (
          values.includes(OTHER) &&
          !form.answerOther[question.key]?.trim()
        ) {
          return `กรุณาระบุเพิ่มเติม: ${question.label}`;
        }
      }

      if (form.placeType === OTHER) {
        if (!form.locationOther.trim()) return "กรุณาระบุสถานที่";
      } else {
        if (!config) return "กรุณาเลือกประเภทสถานที่";
        if (!form.place) return `กรุณาเลือก${config.label}`;

        if (form.place === OTHER && !form.placeOther.trim()) {
          return `กรุณาระบุ${config.label}`;
        }

        if (floors.length && !form.floor) {
          return "กรุณาเลือกชั้น";
        }

        if (form.floor === OTHER && !form.floorOther.trim()) {
          return "กรุณาระบุชั้น";
        }

        if (config.areas.length && !form.area) {
          return "กรุณาเลือกบริเวณที่พบปัญหา";
        }

        if (form.area === OTHER && !form.areaOther.trim()) {
          return "กรุณาระบุบริเวณที่พบปัญหา";
        }
      }

      if (!form.occurredAt) return "กรุณาระบุวันที่พบเหตุ";

      const date = parseDateOnly(form.occurredAt);
      if (!date) return "กรุณาระบุวันที่ให้ถูกต้อง";

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date.getTime() > today.getTime()) {
        return "วันที่พบเหตุต้องไม่อยู่ในอนาคต";
      }

    }

    if (targetStep === 2) {
      if (!FREQUENCIES.includes(form.frequency)) {
        return "กรุณาเลือกความถี่ที่พบ";
      }

      if (form.impacts.includes(OTHER) && !form.impactOther.trim()) {
        return "กรุณาระบุผลกระทบเพิ่มเติม";
      }

      if (!URGENCIES.some((item) => item.value === form.urgency)) {
        return "กรุณาเลือกความเร่งด่วน";
      }

      if (
        form.urgency === "เร่งด่วนมาก" &&
        !form.urgencyReason.trim()
      ) {
        return "กรุณาระบุเหตุผลที่ต้องการให้ตรวจสอบทันที";
      }
    }

    return "";
  }

  function addFiles(selected: FileList | null) {
    if (!selected?.length) return;

    const incoming = Array.from(selected);
    setFileError("");

    if (files.length + incoming.length > MAX_FILES) {
      setFileError(`แนบได้สูงสุด ${MAX_FILES} ไฟล์`);
      return;
    }

    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setFileError(`ไม่รองรับไฟล์ ${file.name}`);
        return;
      }

      if (file.size === 0 || file.size > MAX_SIZE) {
        setFileError(`${file.name} ต้องมีขนาดมากกว่า 0 และไม่เกิน 10 MB`);
        return;
      }
    }

    setFiles((previous) => [...previous, ...incoming]);
    setConfirmed(false);
  }

  const summaryRows: [string, string][] = [
    ["หัวข้อปัญหา", form.title],
    ["ประเภทปัญหา", categoryLabel],
    ...answerSummary.map(
      (answer): [string, string] => [
        answer.label,
        answer.values.join(", "),
      ],
    ),
    ["สถานที่", locationLabel],
    ["จุดสังเกตเพิ่มเติม", form.landmark.trim() || "ไม่ได้ระบุ"],
    ["วันที่พบเหตุ", formatDate(form.occurredAt)],
    ["รายละเอียดเพิ่มเติม", form.additional.trim() || "ไม่ได้ระบุ"],
    ["ความถี่ที่พบ", form.frequency],
    ...(form.frequency === "พบเป็นประจำ"
      ? ([
          ["มักพบช่วงไหน", form.commonPeriods.join(", ") || "ไม่ได้ระบุ"],
        ] as [string, string][])
      : []),
    [
      "ผลกระทบที่ได้รับ",
      form.impacts
        .map((value) =>
          value === OTHER ? `อื่น ๆ: ${form.impactOther.trim()}` : value,
        )
        .join(", ") || "ไม่ได้ระบุ",
    ],
    ["ความเร่งด่วนที่ผู้แจ้งประเมิน", form.urgency],
    ...(form.urgency === "เร่งด่วนมาก"
      ? ([
          ["เหตุผลที่ต้องการให้ตรวจสอบทันที", form.urgencyReason.trim()],
        ] as [string, string][])
      : []),
    [
  "หลักฐานประกอบ",
  files.length > 0
    ? `แนบแล้ว ${files.length} ไฟล์`
    : "ไม่มีไฟล์แนบ",
],
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current || savedReport) return;

    if (step < 4) {
      const message = validate(step);

      if (message) {
        setError(message);
        return;
      }

      setError("");
      setStep((previous) => previous + 1);
      return;
    }

    for (const target of [1, 2]) {
      const message = validate(target);

      if (message) {
        setStep(target);
        setConfirmed(false);
        setError(message);
        return;
      }
    }

    if (!confirmed) {
      setError("กรุณายืนยันความถูกต้องของข้อมูล");
      return;
    }

    const session = getDemoSession();

    if (!session || session.role !== "user") {
      setError("กรุณาเข้าสู่ระบบด้วยบัญชีผู้ใช้อีกครั้ง");
      return;
    }

    if (!form.urgency) {
      setStep(2);
      setError("กรุณาเลือกความเร่งด่วน");
      return;
    }

    busyRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      const id = crypto.randomUUID();

      const report: IssueReport = {
        id,
        code: `DEMO-${id.slice(0, 8).toUpperCase()}`,
        reporter: session.name,
        title: form.title.trim(),
        category: categoryLabel,
        answers: answerSummary,
        location: locationLabel,
        locationDetail: form.landmark.trim(),
        occurredAt: form.occurredAt,
        ongoing: form.ongoing,
        additional: form.additional.trim(),
        frequency: form.frequency,
        commonPeriods:
          form.frequency === "พบเป็นประจำ" ? [...form.commonPeriods] : [],
        impacts: [...form.impacts],
        impactOther: form.impacts.includes(OTHER)
          ? form.impactOther.trim()
          : "",
        urgency: form.urgency,
        urgencyReason:
          form.urgency === "เร่งด่วนมาก" ? form.urgencyReason.trim() : "",
        files: [...files],
        status: "รอรับเรื่อง",
        createdAt: new Date().toISOString(),
      };

      await saveIssueReport(report);

      // บันทึกลง localStorage (unicare_demo_issue_reports) เพื่อให้แสดงในหน้า "รายการของฉัน" และ "จัดการคำขอร้อง" ของแอดมิน
      try {
        const savedReportsStr = window.localStorage.getItem("unicare_demo_issue_reports");
        const existingReports = savedReportsStr ? JSON.parse(savedReportsStr) : [];
        let maxId = 108;
        if (Array.isArray(existingReports)) {
          existingReports.forEach((item: any) => {
            const num = Number(item.issue_id);
            if (!isNaN(num) && num > maxId) maxId = num;
          });
        }
        const nextNumericId = maxId + 1;
        const newReportForAdmin = {
          issue_id: nextNumericId,
          id: String(nextNumericId),
          title: form.title.trim() || categoryLabel,
          description:
            form.additional.trim() ||
            form.otherProblem.trim() ||
            form.title.trim() ||
            "รายละเอียดเรื่องร้องเรียน",
          severity:
            form.urgency === "เร่งด่วนมาก"
              ? "High"
              : form.urgency === "เร่งด่วน"
                ? "Medium"
                : "Low",
          status: "Pending", // รอรับเรื่อง
          date_created: new Date().toISOString(),
          reporter_name: session.name,
          reporter_email: session.email || "",
          evidence_count: files.length,
          issue_categories: {
            category_name: categoryLabel,
          },
          issue_areas: {
            area_name: locationLabel,
          },
          location: locationLabel,
          locationDetail: form.landmark.trim(),
          source: "user_report",
          internal_id: id,
        };

        const updatedList = [
          newReportForAdmin,
          ...(Array.isArray(existingReports) ? existingReports : []),
        ];
        window.localStorage.setItem(
          "unicare_demo_issue_reports",
          JSON.stringify(updatedList)
        );
        window.dispatchEvent(new Event("unicare-demo-reports-updated"));

        // ส่งการแจ้งเตือนแบบแยกกลุ่มผู้รับ
        try {
          // 1. ส่งถึงผู้ใช้ที่รายงานเรื่องนี้โดยเฉพาะ
          addNotification({
            title: "ส่งเรื่องร้องเรียนสำเร็จ",
            description: `คำร้องเรียน #${id} (${categoryLabel}) ได้รับการส่งเข้าระบบเรียบร้อยแล้ว อยู่ระหว่างรอเจ้าหน้าที่รับเรื่อง`,
            type: "status",
            isRead: false,
            link: "/my-reports",
            targetRole: "user",
            targetEmail: session.email || "",
            targetName: session.name,
            issueId: String(id),
          });

          // 2. ส่งถึงผู้ดูแลระบบ (Admin)
          addNotification({
            title: "มีคำร้องเรียนใหม่ส่งเข้ามา",
            description: `คำร้องเรียน #${id} (${categoryLabel} - ${locationLabel}) ส่งโดย ${session.name}`,
            type: form.urgency === "เร่งด่วนมาก" ? "urgent" : "status",
            isRead: false,
            link: "/admin/reports",
            targetRole: "admin",
            issueId: String(id),
          });
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }

      setSavedReport(report);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "บันทึกรายงานไม่สำเร็จ",
      );
    } finally {
      busyRef.current = false;
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSavedReport(null);
    setForm(emptyForm());
    setFiles([]);
    setConfirmed(false);
    setError("");
    setFileError("");
    setStep(1);
  }

  if (reporter === null) {
    return <p className="p-8 text-emerald-900">กำลังตรวจสอบบัญชี...</p>;
  }

  return (
    <div className="min-h-screen bg-[#f3f8f5] text-slate-800">
      <Header
        title="แจ้งปัญหาและข้อเสนอแนะสิ่งแวดล้อม"
        subtitle="ระบบรับแจ้งปัญหาและข้อเสนอแนะ มหาวิทยาลัยวลัยลักษณ์"
        userName={reporter || "กิตติภูมิ"}
        role="USER"
        backHref="/user/dashboard"
      />

      <main className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-emerald-950">
                แจ้งปัญหาใหม่ (Create Issue Report)
              </h1>
              <p className="mt-1 text-xs sm:text-sm font-normal text-slate-600">
                ผู้แจ้ง: <span className="font-semibold text-emerald-900">{reporter}</span>
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold w-fit">
              <span>⚠️</span>
              <span>โหมดทดลอง: บันทึกในเบราว์เซอร์นี้</span>
            </div>
          </header>

        <ol className="grid grid-cols-4 gap-2 rounded-2xl bg-white p-4 shadow-sm">
          {STEPS.map((label, index) => (
            <li
              key={label}
              aria-current={step === index + 1 ? "step" : undefined}
              className="text-center"
            >
              <span
                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs sm:text-sm font-bold ${
                  step >= index + 1
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-500 font-semibold"
                }`}
              >
                {index + 1}
              </span>
              <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-700">{label}</p>
            </li>
          ))}
        </ol>

        <form onSubmit={handleSubmit}>
          <fieldset
            disabled={submitting || savedReport !== null}
            className="min-w-0"
          >
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="mb-6 text-lg sm:text-xl font-bold text-emerald-950 outline-none"
              >
                {STEPS[step - 1]}
              </h2>

              {step === 1 && (
                <div className="space-y-6">
                  <TextField
                    label="หัวข้อปัญหา *"
                    value={form.title}
                    maxLength={150}
                    placeholder="เช่น ขยะล้นถังหลังหอพัก"
                    onChange={(value) => update("title", value)}
                  />

                  <Field label="วันที่พบเหตุ *">
                    <input
                      type="date"
                      className={inputClass}
                      value={form.occurredAt}
                      onChange={(event) =>
                        update("occurredAt", event.target.value)
                      }
                    />
                  </Field>


                  <SelectField
                    label="ประเภทปัญหา *"
                    value={form.category}
                    options={Object.keys(QUESTIONS)}
                    disabledOptions={disabledCategories}
                    onChange={changeCategory}
                  />

                  {disabledCategories.length > 0 && (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                      <span>⚠️</span>
                      <div>
                        <span className="font-semibold">ปิดรับแจ้งชั่วคราว:</span>{" "}
                        {disabledCategories.join(", ")}
                      </div>
                    </div>
                  )}

                  {form.category === OTHER && (
                    <>
                      <TextField
                        label="ระบุประเภทปัญหา *"
                        value={form.categoryOther}
                        onChange={(value) => update("categoryOther", value)}
                      />
                      <Field label="อธิบายลักษณะปัญหาโดยย่อ *">
                        <textarea
                          className={inputClass}
                          rows={3}
                          maxLength={500}
                          value={form.otherProblem}
                          onChange={(event) =>
                            update("otherProblem", event.target.value)
                          }
                        />
                      </Field>
                    </>
                  )}

                  {(QUESTIONS[form.category] ?? []).map((question) => (
                    <div
                      key={`${form.category}-${question.key}`}
                      className="space-y-4 rounded-xl bg-emerald-50/50 p-4"
                    >
                      <Choices
                        label={`${question.label} *${
                          question.multiple ? " (เลือกได้หลายข้อ)" : ""
                        }`}
                        name={`question-${question.key}`}
                        options={question.options}
                        selected={form.answers[question.key] ?? []}
                        multiple={question.multiple}
                        onSelect={(value) => selectAnswer(question, value)}
                      />

                      {form.answers[question.key]?.includes(OTHER) && (
                        <TextField
                          label="ระบุเพิ่มเติม *"
                          value={form.answerOther[question.key] ?? ""}
                          onChange={(value) =>
                            update("answerOther", {
                              ...form.answerOther,
                              [question.key]: value,
                            })
                          }
                        />
                      )}
                    </div>
                  ))}

                  <section className="space-y-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5">
                    <div>
                      <h3 className="font-semibold text-emerald-950">
                        สถานที่พบปัญหา
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        เลือกสถานที่ แล้วระบุตำแหน่งให้ชัดเจน
                      </p>
                    </div>

                    <SelectField
                      label="ประเภทสถานที่ *"
                      value={form.placeType}
                      options={[...Object.keys(PLACE_CONFIG), OTHER]}
                      onChange={changePlaceType}
                    />

                    {form.placeType === OTHER ? (
                      <TextField
                        label="ระบุสถานที่ *"
                        value={form.locationOther}
                        onChange={(value) => update("locationOther", value)}
                      />
                    ) : config ? (
                      <>
                        <SelectField
                          label={`${config.label} *`}
                          value={form.place}
                          options={[
                            ...config.places.map((item) => item.name),
                            OTHER,
                          ]}
                          onChange={changePlace}
                        />

                        {form.place === OTHER && (
                          <TextField
                            label={`ระบุ${config.label} *`}
                            value={form.placeOther}
                            onChange={(value) => update("placeOther", value)}
                          />
                        )}

                        {floors.length > 0 && (
                          <>
                            <SelectField
                              label="ชั้น *"
                              value={form.floor}
                              options={[...floors, OTHER]}
                              onChange={(value) =>
                                patch({
                                  floor: value,
                                  floorOther: "",
                                  area: "",
                                  areaOther: "",
                                  landmark: "",
                                })
                              }
                            />

                            {form.floor === OTHER && (
                              <TextField
                                label="ระบุชั้น *"
                                value={form.floorOther}
                                onChange={(value) =>
                                  update("floorOther", value)
                                }
                              />
                            )}
                          </>
                        )}

                        {form.place &&
                          (!floors.length || form.floor) &&
                          config.areas.length > 0 && (
                            <>
                              <SelectField
                                label="บริเวณที่พบปัญหา *"
                                value={form.area}
                                options={[...config.areas, OTHER]}
                                onChange={(value) =>
                                  patch({
                                    area: value,
                                    areaOther: "",
                                    landmark: "",
                                  })
                                }
                              />

                              {form.area === OTHER && (
                                <TextField
                                  label="ระบุบริเวณที่พบปัญหา *"
                                  value={form.areaOther}
                                  onChange={(value) =>
                                    update("areaOther", value)
                                  }
                                />
                              )}
                            </>
                          )}
                      </>
                    ) : null}

                    {form.placeType && (
                      <TextField
                        label="จุดสังเกตเพิ่มเติม (ไม่บังคับ)"
                        value={form.landmark}
                        placeholder="เช่น ห้อง 1203 ฝั่งประตูหลัง หรือใกล้บันได"
                        onChange={(value) => update("landmark", value)}
                      />
                    )}

                    {locationLabel && (
                      <p className="rounded-xl bg-white p-3 text-sm text-emerald-900">
                        ตำแหน่งที่เลือก: {locationLabel}
                      </p>
                    )}
                  </section>

                  <Field label="รายละเอียดเพิ่มเติม (ไม่บังคับ)">
                    <textarea
                      className={inputClass}
                      rows={3}
                      maxLength={1000}
                      value={form.additional}
                      placeholder="ระบุสิ่งที่เจ้าหน้าที่ควรรู้เพิ่มเติม หรือข้อมูลที่ไม่มีในตัวเลือก"
                      onChange={(event) =>
                        update("additional", event.target.value)
                      }
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-7">
                  <Choices
                    label="ความถี่ที่พบ *"
                    name="frequency"
                    options={FREQUENCIES}
                    selected={[form.frequency]}
                    onSelect={(value) =>
                      patch({ frequency: value, commonPeriods: [] })
                    }
                  />

                  {form.frequency === "พบเป็นประจำ" && (
                    <Choices
                      label="มักพบช่วงไหน (ไม่บังคับ เลือกได้หลายข้อ)"
                      name="periods"
                      options={PERIODS}
                      selected={form.commonPeriods}
                      multiple
                      onSelect={(value) =>
                        update(
                          "commonPeriods",
                          toggleValues(form.commonPeriods, value, "ไม่แน่นอน"),
                        )
                      }
                    />
                  )}

                  <Choices
                    label="ผลกระทบที่ได้รับ (ไม่บังคับ เลือกได้หลายข้อ)"
                    name="impacts"
                    options={IMPACTS}
                    selected={form.impacts}
                    multiple
                    onSelect={(value) => {
                      const next = toggleValues(form.impacts, value);
                      patch({
                        impacts: next,
                        impactOther: next.includes(OTHER)
                          ? form.impactOther
                          : "",
                      });
                    }}
                  />

                  {form.impacts.includes(OTHER) && (
                    <TextField
                      label="ระบุผลกระทบเพิ่มเติม *"
                      value={form.impactOther}
                      maxLength={300}
                      onChange={(value) => update("impactOther", value)}
                    />
                  )}

                  <fieldset>
                    <legend className="mb-3 text-sm font-semibold">
                      ความเร่งด่วนที่ผู้แจ้งประเมิน *
                    </legend>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {URGENCIES.map((item) => (
                        <label
                          key={item.value}
                          className={`cursor-pointer rounded-xl border p-4 ${
                            form.urgency === item.value
                              ? "border-emerald-600 bg-emerald-50"
                              : "border-slate-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="urgency"
                            checked={form.urgency === item.value}
                            onChange={() =>
                              patch({
                                urgency: item.value,
                                urgencyReason: "",
                              })
                            }
                            className="mr-2 accent-emerald-700"
                          />
                          <span className="font-semibold">
                            {item.icon} {item.value}
                          </span>
                          <span className="mt-3 block text-sm text-slate-600">
                            {item.description}
                          </span>
                        </label>
                      ))}
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      เจ้าหน้าที่จะประเมินความเร่งด่วนอีกครั้ง
                      จากรายละเอียดและหลักฐานที่แจ้ง
                    </p>
                  </fieldset>

                  {form.urgency === "เร่งด่วนมาก" && (
                    <div className="space-y-4">
                      <Field label="เหตุผลที่ต้องการให้ตรวจสอบทันที *">
                        <textarea
                          className={inputClass}
                          rows={3}
                          maxLength={500}
                          value={form.urgencyReason}
                          placeholder="เช่น กิ่งไม้หักขวางทางเข้าอาคาร"
                          onChange={(event) =>
                            update("urgencyReason", event.target.value)
                          }
                        />
                      </Field>

                      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        หากมีอันตรายทันที โปรดติดต่อหน่วยฉุกเฉิน
                        หรือเจ้าหน้าที่รักษาความปลอดภัยโดยตรง
                        ไม่ควรรอการตอบกลับผ่านระบบ
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <Field label="หลักฐานประกอบ (ไม่บังคับ)">
                    <div className="mt-3 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-6">
                      <span className="block text-3xl">📁</span>
                      <span className="mt-3 block text-sm text-slate-600">
                        JPG, PNG, WebP, PDF, MP3, WAV, M4A, OGG
                        <br />
                        สูงสุด 5 ไฟล์ ไฟล์ละไม่เกิน 10 MB
                      </span>
                      <input
                        type="file"
                        multiple
                        accept={ACCEPTED_TYPES.join(",")}
                        className="mt-4 block w-full text-sm"
                        onChange={(event) => {
                          addFiles(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </div>
                  </Field>

                  {fileError && (
                    <p role="alert" className="text-sm text-red-700">
                      {fileError}
                    </p>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    {files.map((file, index) => (
                      <EvidencePreview
                        key={`${file.name}-${file.lastModified}-${index}`}
                        file={file}
                        onRemove={() => {
                          setFiles((previous) =>
                            previous.filter((_, itemIndex) => itemIndex !== index),
                          );
                          setConfirmed(false);
                          setFileError("");
                        }}
                      />
                    ))}
                  </div>

                  <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                    สามารถไปขั้นถัดไปได้โดยไม่แนบไฟล์
                  </p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 px-4">
                    {summaryRows.map(([label, value], index) => (
                      <div
                        key={`${label}-${index}`}
                        className="grid gap-2 py-4 text-sm sm:grid-cols-[200px_1fr]"
                      >
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="min-w-0 whitespace-pre-wrap break-words font-medium">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <label className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(event) => {
                        setConfirmed(event.target.checked);
                        setError("");
                      }}
                      className="mt-1 accent-emerald-700"
                    />
                    ฉันตรวจสอบข้อมูลแล้ว และยืนยันว่าข้อมูลที่แจ้งเป็นความจริง
                  </label>
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                  {error}
                </p>
              )}
            </section>

            <div className="mt-5 flex justify-between gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep((previous) => previous - 1);
                    setConfirmed(false);
                    setError("");
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm disabled:opacity-50"
                >
                  ← ย้อนกลับ
                </button>
              ) : (
                <span />
              )}

              <button
                type="submit"
                disabled={submitting || savedReport !== null}
                className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {submitting
                  ? "กำลังบันทึก..."
                  : step === 4
                    ? "บันทึกรายงานทดลอง"
                    : "ถัดไป →"}
              </button>
            </div>
          </fieldset>
        </form>
      </div>

      {savedReport && (
        <SuccessModal report={savedReport} onNewReport={resetForm} />
      )}
      </main>
    </div>
  );
}