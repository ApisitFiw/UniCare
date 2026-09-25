export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  date: string;
  isPinned: boolean;
  urgency: "normal" | "urgent";
  tag?: string;
  createdAt: string;
};

const STORAGE_KEY = "unicare_announcements";

export const initialAnnouncements: AnnouncementItem[] = [
  {
    id: "ANN-2026-001",
    title: "มาตรการลดเสียงรบกวนในช่วงสอบปลายภาค 2/2568",
    content:
      "ขอความร่วมมือนักศึกษาและบุคลากรงดจัดกิจกรรมที่ใช้เครื่องขยายเสียง หรือก่อให้เกิดเสียงดังรบกวนหลังเวลา 21.00 น. บริเวณรอบเขตหอพักลักษณานิเวศ เพื่อสนับสนุนบรรยากาศการอ่านหนังสือเตรียมสอบ",
    category: "เสียงรบกวน",
    author: "นัฐกรณ์ (Admin)",
    date: "25 ก.ย. 2568",
    isPinned: true,
    urgency: "urgent",
    tag: "มาตรการมหาวิทยาลัย",
    createdAt: "2026-09-25T09:00:00.000Z",
  },
  {
    id: "ANN-2026-002",
    title: "กิจกรรม Big Cleaning Day ประจำภาคการศึกษา ร่วมคัดแยกขยะ",
    content:
      "ขอเชิญชวนชาววลัยลักษณ์ร่วมกิจกรรม Big Cleaning Day ทำความสะอาดและคัดแยกขยะรีไซเคิล ณ บริเวณลานกิจกรรมและโรงอาหารกลาง เริ่มเวลา 09.00 - 15.00 น.",
    category: "ขยะ / ของเสีย",
    author: "Chanokporn (Admin)",
    date: "24 ก.ย. 2568",
    isPinned: false,
    urgency: "normal",
    tag: "กิจกรรมเพื่อสิ่งแวดล้อม",
    createdAt: "2026-09-24T10:30:00.000Z",
  },
  {
    id: "ANN-2026-003",
    title: "แจ้งปรับปรุงระบบไฟส่องสว่างทางเดินหอพักและถนนสายหลัก",
    content:
      "ฝ่ายอาคารและสถานที่กำลังเร่งดำเนินการเปลี่ยนหลอดไฟ LED บริเวณทางเดินหอพักและถนนสายหลัก เพื่อความปลอดภัยของผู้สัญจรในเวลากลางคืน คาดว่าจะแล้วเสร็จภายในสัปดาห์นี้",
    category: "แสงสว่าง",
    author: "Apisit (Admin)",
    date: "22 ก.ย. 2568",
    isPinned: false,
    urgency: "normal",
    tag: "งานซ่อมบำรุง",
    createdAt: "2026-09-22T14:15:00.000Z",
  },
];

export function getAnnouncements(): AnnouncementItem[] {
  if (typeof window === "undefined") return initialAnnouncements;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  // Default seed
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAnnouncements));
  return initialAnnouncements;
}

export function saveAnnouncements(items: AnnouncementItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("unicare-announcements-updated"));
}

import { addNotification } from "@/lib/notifications";

export function createAnnouncement(
  data: Omit<AnnouncementItem, "id" | "createdAt">,
): AnnouncementItem {
  const current = getAnnouncements();
  const nextNum = current.length + 1;
  const newId = `ANN-2026-${String(nextNum).padStart(3, "0")}`;

  const newItem: AnnouncementItem = {
    ...data,
    id: newId,
    createdAt: new Date().toISOString(),
  };

  const nextList = [newItem, ...current];
  saveAnnouncements(nextList);

  // Send a real-time notification to all users
  try {
    addNotification({
      title: `ประกาศข่าวสาร: ${newItem.title}`,
      description: newItem.content.slice(0, 120) + (newItem.content.length > 120 ? "..." : ""),
      type: newItem.urgency === "urgent" ? "urgent" : "news",
      isRead: false,
      link: "/user/dashboard#news",
      targetRole: "all",
    });
  } catch {}

  return newItem;
}

export function updateAnnouncement(
  id: string,
  updates: Partial<Omit<AnnouncementItem, "id" | "createdAt">>,
): AnnouncementItem | null {
  const current = getAnnouncements();
  const index = current.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const updated: AnnouncementItem = {
    ...current[index],
    ...updates,
  };

  current[index] = updated;
  saveAnnouncements(current);
  return updated;
}

export function deleteAnnouncement(id: string): boolean {
  const current = getAnnouncements();
  const next = current.filter((item) => item.id !== id);
  if (next.length !== current.length) {
    saveAnnouncements(next);
    return true;
  }
  return false;
}

export function togglePinAnnouncement(id: string): boolean {
  const current = getAnnouncements();
  const target = current.find((item) => item.id === id);
  if (!target) return false;

  target.isPinned = !target.isPinned;
  saveAnnouncements(current);
  return true;
}
