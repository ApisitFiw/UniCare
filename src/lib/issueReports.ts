export type ReportAnswer = {
  label: string;
  values: string[];
};

export type Urgency = "ปกติ" | "เร่งด่วน" | "เร่งด่วนมาก";

export type IssueReport = {
  id: string;
  code: string;
  reporter: string;
  title: string;
  category: string;
  answers: ReportAnswer[];

  location: string;
  locationDetail: string;

  // รายงานใหม่เก็บเป็น YYYY-MM-DD
  occurredAt: string;
  additional: string;

  frequency: string;
  impacts: string[];
  impactOther: string;

  // ช่องใหม่เป็น optional เพื่อให้อ่านรายงานเก่าได้
  ongoing?: string;
  commonPeriods?: string[];
  urgency?: Urgency;
  urgencyReason?: string;

  // ระดับผลกระทบของรายงานเก่า
  level?: string;

  files: File[];
  status: "รอรับเรื่อง";
  createdAt: string;
};

const DB_NAME = "unicare-demo-reports";
const DB_VERSION = 1;
const STORE_NAME = "reports";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (
      typeof window === "undefined" ||
      typeof window.indexedDB === "undefined"
    ) {
      reject(new Error("เบราว์เซอร์นี้ไม่รองรับการเก็บข้อมูลทดลอง"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    let blocked = false;

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      if (blocked) {
        db.close();
        return;
      }

      db.onversionchange = () => db.close();
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("เปิดที่เก็บข้อมูลไม่ได้"));
    };

    request.onblocked = () => {
      blocked = true;
      reject(
        new Error("กรุณาปิดแท็บ UniCare อื่น แล้วลองทำรายการอีกครั้ง"),
      );
    };
  });
}

export async function saveIssueReport(
  report: IssueReport,
): Promise<void> {
  if (!report.id.trim()) {
    throw new Error("ไม่พบรหัสประจำรายงาน");
  }

  const db = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      let writeError: DOMException | null = null;

      transaction.oncomplete = () => resolve();

      transaction.onabort = () => {
        const error = writeError ?? transaction.error;

        if (error?.name === "ConstraintError") {
          reject(new Error("รหัสรายงานนี้ถูกบันทึกแล้ว"));
          return;
        }

        if (error?.name === "QuotaExceededError") {
          reject(
            new Error("พื้นที่เก็บข้อมูลไม่เพียงพอ กรุณาลดขนาดไฟล์แนบ"),
          );
          return;
        }

        reject(error ?? new Error("บันทึกรายงานไม่สำเร็จ"));
      };

      const request = transaction.objectStore(STORE_NAME).add(report);

      request.onerror = () => {
        writeError = request.error;
      };
    });
  } finally {
    db.close();
  }
}

export async function getIssueReport(
  id: string,
): Promise<IssueReport | undefined> {
  if (!id.trim()) return undefined;

  const db = await openDatabase();

  try {
    return await new Promise<IssueReport | undefined>(
      (resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        let report: IssueReport | undefined;
        let readError: DOMException | null = null;

        transaction.oncomplete = () => resolve(report);

        transaction.onabort = () => {
          reject(
            readError ??
              transaction.error ??
              new Error("อ่านรายงานไม่สำเร็จ"),
          );
        };

        const request = transaction.objectStore(STORE_NAME).get(id);

        request.onsuccess = () => {
          report = request.result as IssueReport | undefined;
        };

        request.onerror = () => {
          readError = request.error;
        };
      },
    );
  } finally {
    db.close();
  }
}

// รองรับชื่อที่หน้าเดิมอาจยังใช้อยู่
export type DemoReport = IssueReport;
export type issueReport = IssueReport;
export const saveDemoReport = saveIssueReport;
export const getDemoReport = getIssueReport;