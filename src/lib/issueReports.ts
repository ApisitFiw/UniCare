import { supabase } from "@/lib/supabaseClient";

export type IssueStatus =
  | "Pending"
  | "In_Progress"
  | "Resolved"
  | "Closed";

export type IssueSeverity =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

export type IssueReport = {
  issue_id: number;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  date_created: string;
  category_id: number | null;
  area_id: number | null;
  category_name: string;
  area_name: string;
};

export type NewIssueReport = {
  title: string;
  description: string;
  severity: IssueSeverity;
  category_id: number;
  area_id: number;
};

type IssueReportRow = {
  issue_id: number;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  date_created: string;
  category_id: number | null;
  area_id: number | null;
  issue_categories: {
    category_name: string;
  } | null;
  issue_areas: {
    area_name: string;
  } | null;
};

function formatReport(row: IssueReportRow): IssueReport {
  return {
    issue_id: row.issue_id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    date_created: row.date_created,
    category_id: row.category_id,
    area_id: row.area_id,
    category_name:
      row.issue_categories?.category_name ?? "ไม่ระบุประเภท",
    area_name:
      row.issue_areas?.area_name ?? "ไม่ระบุสถานที่",
  };
}

/**
 * ดึงรายงานทั้งหมดสำหรับหน้า Admin
 * ต้องกำหนด RLS ให้บัญชี Admin อ่านข้อมูลได้
 */
export async function getIssueReports(): Promise<IssueReport[]> {
  const { data, error } = await supabase
    .from("issue_reports")
    .select(`
      issue_id,
      title,
      description,
      severity,
      status,
      date_created,
      category_id,
      area_id,
      issue_categories ( category_name ),
      issue_areas ( area_name )
    `)
    .order("issue_id", { ascending: false });

  if (error) {
    throw new Error(`ดึงรายการแจ้งปัญหาไม่สำเร็จ: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    formatReport(row as unknown as IssueReportRow)
  );
}

/**
 * ดึงรายงาน 1 รายการจากเลข issue_id
 */
export async function getIssueReportById(
  issueId: number
): Promise<IssueReport | null> {
  const { data, error } = await supabase
    .from("issue_reports")
    .select(`
      issue_id,
      title,
      description,
      severity,
      status,
      date_created,
      category_id,
      area_id,
      issue_categories ( category_name ),
      issue_areas ( area_name )
    `)
    .eq("issue_id", issueId)
    .maybeSingle();

  if (error) {
    throw new Error(`ดึงรายละเอียดไม่สำเร็จ: ${error.message}`);
  }

  return data
    ? formatReport(data as unknown as IssueReportRow)
    : null;
}

/**
 * ให้ User ส่งเรื่องใหม่
 */
export async function addIssueReport(
  input: NewIssueReport
): Promise<IssueReport> {
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("กรุณาเข้าสู่ระบบก่อนแจ้งปัญหา");
  }

  const { data, error } = await supabase
    .from("issue_reports")
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      severity: input.severity,
      status: "Pending",
      category_id: input.category_id,
      area_id: input.area_id,
    })
    .select(`
      issue_id,
      title,
      description,
      severity,
      status,
      date_created,
      category_id,
      area_id,
      issue_categories ( category_name ),
      issue_areas ( area_name )
    `)
    .single();

  if (error) {
    throw new Error(`ส่งเรื่องไม่สำเร็จ: ${error.message}`);
  }

  return formatReport(data as unknown as IssueReportRow);
}

/**
 * ให้ Admin เปลี่ยนสถานะ
 */
export async function updateIssueStatus(
  issueId: number,
  status: IssueStatus
): Promise<void> {
  const { error } = await supabase
    .from("issue_reports")
    .update({ status })
    .eq("issue_id", issueId);

  if (error) {
    throw new Error(`เปลี่ยนสถานะไม่สำเร็จ: ${error.message}`);
  }
}

export function getStatusLabel(status: IssueStatus): string {
  const labels: Record<IssueStatus, string> = {
    Pending: "รอเจ้าหน้าที่รับเรื่อง",
    In_Progress: "กำลังดำเนินการ",
    Resolved: "แก้ไขแล้ว",
    Closed: "ปิดเรื่อง",
  };

  return labels[status];
}

export function getSeverityLabel(
  severity: IssueSeverity
): string {
  const labels: Record<IssueSeverity, string> = {
    Low: "เบา",
    Medium: "ปานกลาง",
    High: "มาก",
    Critical: "เร่งด่วน",
  };

  return labels[severity];
}