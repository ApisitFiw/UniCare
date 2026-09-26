import { supabase } from "@/lib/supabaseClient";
import { addNotification } from "@/lib/notifications";

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

/**
 * Fetch announcements from Supabase table `announcements`, sync to localStorage, and notify.
 */
export async function fetchAnnouncementsFromSupabase(): Promise<AnnouncementItem[]> {
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      const mapped: AnnouncementItem[] = data.map((row: any) => {
        const pubDate = row.published_date || row.created_at;
        const formattedDate = pubDate
          ? new Date(pubDate).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "วันนี้";

        const isUrgent =
          row.category?.includes("ด่วน") ||
          row.category?.includes("มาตรการ") ||
          row.title?.includes("ด่วน") ||
          row.title?.includes("มาตรการ");

        return {
          id: String(row.id),
          title: row.title || "ประกาศ",
          content: row.content || "",
          category: row.category || "ทั่วไป",
          author: row.author || "ฝ่ายสวัสดิการและสิ่งแวดล้อม (Admin)",
          date: formattedDate,
          isPinned: Boolean(row.pinned),
          urgency: isUrgent ? "urgent" : "normal",
          tag: row.category,
          createdAt: row.created_at || new Date().toISOString(),
        };
      });

      saveAnnouncements(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn("fetchAnnouncementsFromSupabase error:", err);
  }
  return getAnnouncements();
}

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

  // Sync to Supabase in background
  (async () => {
    try {
      const { data: inserted, error } = await supabase
        .from("announcements")
        .insert({
          title: newItem.title,
          category: newItem.category,
          content: newItem.content,
          published_date: new Date().toISOString().split("T")[0],
          pinned: newItem.isPinned,
          author: newItem.author,
        })
        .select();

      if (error) {
        console.warn("createAnnouncement in Supabase error:", error.message);
      } else if (inserted && Array.isArray(inserted) && (inserted[0] as any)?.id) {
        const updatedList = getAnnouncements().map((a) =>
          a.id === newId ? { ...a, id: String((inserted[0] as any).id) } : a
        );
        saveAnnouncements(updatedList);
      }
    } catch (err) {
      console.warn("createAnnouncement sync error:", err);
    }
  })();

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

  // Sync to Supabase in background
  (async () => {
    try {
      const sbUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.title !== undefined) sbUpdates.title = updates.title;
      if (updates.category !== undefined) sbUpdates.category = updates.category;
      if (updates.content !== undefined) sbUpdates.content = updates.content;
      if (updates.isPinned !== undefined) sbUpdates.pinned = updates.isPinned;
      if (updates.author !== undefined) sbUpdates.author = updates.author;

      const { error } = await supabase
        .from("announcements")
        .update(sbUpdates)
        .eq("id", id);
      if (error) console.warn("updateAnnouncement in Supabase error:", error.message);
    } catch (err) {
      console.warn("updateAnnouncement sync error:", err);
    }
  })();

  return updated;
}

export function deleteAnnouncement(id: string): boolean {
  const current = getAnnouncements();
  const next = current.filter((item) => item.id !== id);
  if (next.length !== current.length) {
    saveAnnouncements(next);

    // Sync deletion to Supabase in background
    (async () => {
      try {
        const { error } = await supabase
          .from("announcements")
          .delete()
          .eq("id", id);
        if (error) console.warn("deleteAnnouncement in Supabase error:", error.message);
      } catch (err) {
        console.warn("deleteAnnouncement sync error:", err);
      }
    })();

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

  // Sync pin state to Supabase in background
  (async () => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ pinned: target.isPinned, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) console.warn("togglePinAnnouncement in Supabase error:", error.message);
    } catch (err) {
      console.warn("togglePinAnnouncement sync error:", err);
    }
  })();

  return true;
}
