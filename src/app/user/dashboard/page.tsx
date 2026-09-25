"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getDemoSession,
  type DemoSession,
} from "@/lib/authService";
import { getAllCurrentIssues, getDisabledCategoryNames } from "@/lib/issuesData";
import {
  getAnnouncements,
  type AnnouncementItem,
} from "@/lib/announcementsData";
import AccountBar from "@/components/AccountBar";
import UniCareLogo from "@/components/UniCareLogo";
import {
  Sprout,
  Megaphone,
  ClipboardList,
  Clock,
  CheckCircle2,
  Star,
  ArrowRight,
  AlertTriangle,
  Tag,
  Newspaper,
  Pin,
  AlertCircle,
  Calendar,
  User,
  Volume2,
  Trash,
  Droplets,
  Wind,
  Lightbulb,
  Trees,
  Layers,
  Sparkles,
  X,
} from "lucide-react";

const categories = [
  "เสียงรบกวน",
  "ขยะ / ของเสีย",
  "น้ำ / น้ำเสีย",
  "อากาศ / มลพิษ",
  "แสงสว่าง",
  "ต้นไม้ / พื้นที่สีเขียว",
  "อื่น ๆ",
];

function getCategoryIcon(cat: string) {
  if (cat.includes("เสียง")) return <Volume2 className="h-4 w-4 text-emerald-700" />;
  if (cat.includes("ขยะ")) return <Trash className="h-4 w-4 text-emerald-700" />;
  if (cat.includes("น้ำ")) return <Droplets className="h-4 w-4 text-emerald-700" />;
  if (cat.includes("อากาศ") || cat.includes("มลพิษ")) return <Wind className="h-4 w-4 text-emerald-700" />;
  if (cat.includes("แสง")) return <Lightbulb className="h-4 w-4 text-emerald-700" />;
  if (cat.includes("ต้นไม้")) return <Trees className="h-4 w-4 text-emerald-700" />;
  if (cat.includes("กิจกรรม")) return <Sparkles className="h-4 w-4 text-emerald-700" />;
  if (cat.includes("มาตรการ")) return <Megaphone className="h-4 w-4 text-emerald-700" />;
  return <Layers className="h-4 w-4 text-emerald-700" />;
}

export default function UserDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, resolved: 0 });
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [highlightNews, setHighlightNews] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const triggerHighlight = () => {
      const el = document.getElementById("news");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setHighlightNews(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setHighlightNews(false), 4000);
    };

    const checkHash = () => {
      if (typeof window !== "undefined" && window.location.hash === "#news") {
        setTimeout(triggerHighlight, 200);
      }
    };

    const handleCustomHighlight = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.target === "news") {
        triggerHighlight();
      }
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);
    window.addEventListener("unicare-highlight-section", handleCustomHighlight);

    return () => {
      window.removeEventListener("hashchange", checkHash);
      window.removeEventListener("unicare-highlight-section", handleCustomHighlight);
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const updateSession = () => {
      const currentSession = getDemoSession();
      if (!currentSession || currentSession.role !== "user") {
        router.replace("/login");
        return;
      }
      setSession(currentSession);
    };

    updateSession();

    window.addEventListener("unicare-profile-updated", updateSession);
    window.addEventListener("storage", updateSession);

    return () => {
      window.removeEventListener("unicare-profile-updated", updateSession);
      window.removeEventListener("storage", updateSession);
    };
  }, [router]);

  useEffect(() => {
    const syncData = () => {
      setDisabledCategories(getDisabledCategoryNames());
      setAnnouncements(getAnnouncements());

      const currentSession = getDemoSession();
      if (!currentSession) return;

      const issues = getAllCurrentIssues();
      const currentName = (currentSession.name || "").trim().toLowerCase();
      const currentEmail = (currentSession.email || "").trim().toLowerCase();

      const myIssues = issues.filter((i) => {
        const rName = (i.reporterName || "").trim().toLowerCase();
        const rEmail = (i.reporterEmail || "").trim().toLowerCase();
        if (currentEmail && rEmail && currentEmail === rEmail) return true;
        if (currentEmail === "user@unicare.local" && (rEmail === "kittipoom@example.com" || rName.includes("กิตติภูมิ"))) return true;
        if (currentName && rName && currentName === rName) return true;
        return false;
      });

      const total = myIssues.length;
      const inProgress = myIssues.filter(
        (i) => i.status === "in_progress" || i.status === "pending",
      ).length;
      const resolved = myIssues.filter((i) => i.status === "resolved").length;

      setStats({ total, inProgress, resolved });
    };

    syncData();

    window.addEventListener("storage", syncData);
    window.addEventListener("unicare-demo-reports-updated", syncData);
    window.addEventListener("unicare-category-metadata-updated", syncData);
    window.addEventListener("unicare-announcements-updated", syncData);
    window.addEventListener("unicare-profile-updated", syncData);
    window.addEventListener("focus", syncData);

    return () => {
      window.removeEventListener("storage", syncData);
      window.removeEventListener("unicare-demo-reports-updated", syncData);
      window.removeEventListener("unicare-category-metadata-updated", syncData);
      window.removeEventListener("unicare-announcements-updated", syncData);
      window.removeEventListener("unicare-profile-updated", syncData);
      window.removeEventListener("focus", syncData);
    };
  }, []);

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [announcements]);

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-emerald-900">
        กำลังตรวจสอบบัญชี...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f8f5] text-slate-800">
      {/* แถบด้านบน */}
      <header className="bg-white border-b border-slate-200/80 px-6 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <Link href="/user/dashboard" className="flex items-center gap-2.5 text-base font-extrabold text-emerald-900">
          <UniCareLogo className="w-8 h-8" />
          <span>UniCare</span>
          <span className="hidden sm:inline-block text-xs font-normal text-slate-400 ml-1">
            · มหาวิทยาลัยวลัยลักษณ์
          </span>
        </Link>

        <AccountBar role="USER" userName={session.name} />
      </header>

      {/* เนื้อหา Dashboard */}
      <main className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        {/* Banner ร่วมกันดูแลมหาวิทยาลัย */}
        <section className="rounded-2xl bg-gradient-to-r from-[#15453b] via-[#1c5e52] to-[#2b8273] p-7 text-white shadow-md">
          <h2 className="text-xl sm:text-2xl font-bold">
            ร่วมกันดูแลมหาวิทยาลัยของเรา
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 max-w-xl">
            แจ้งปัญหาและติดตามการดำเนินงานของเจ้าหน้าที่ได้แบบเรียลไทม์จากระบบ UniCare
          </p>
          <Link
            href="/user/report"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-emerald-900 hover:bg-emerald-50 transition shadow-sm"
          >
            <Megaphone className="h-4 w-4 text-emerald-700" />
            <span>แจ้งปัญหาใหม่</span>
          </Link>
        </section>

        {/* สรุปสถานะ 3 การ์ด */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <ClipboardList className="h-4 w-4" />
              </span>
              <span>รายงานของฉัน</span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-emerald-950">{stats.total}</p>
            <p className="mt-1 text-xs text-slate-400">
              {stats.total > 0 ? "เรื่องร้องเรียนทั้งหมดที่คุณแจ้งไว้" : "ยังไม่มีข้อมูลรายงาน"}
            </p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Clock className="h-4 w-4" />
              </span>
              <span>กำลังดำเนินการ / รอรับเรื่อง</span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-amber-600">{stats.inProgress}</p>
            <p className="mt-1 text-xs text-slate-400">
              {stats.inProgress > 0 ? "เจ้าหน้าที่กำลังเร่งดำเนินการแก้ไข" : "ไม่มีเคสค้าง"}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span>ดำเนินการแล้ว</span>
                </div>
                {stats.resolved > 0 && (
                  <Link
                    href="/user/feedback"
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition"
                  >
                    <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                    <span>ประเมินผล</span>
                  </Link>
                )}
              </div>
              <p className="mt-3 text-3xl font-extrabold text-emerald-600">{stats.resolved}</p>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {stats.resolved > 0 ? "แก้ไขและดำเนินการสำเร็จแล้ว" : "ยังไม่มีเคสที่เสร็จสิ้น"}
            </p>
          </div>
        </section>

        {/* แถบแจ้งเตือนประเมินผลเมื่อมีเคสเสร็จสิ้น */}
        {stats.resolved > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-amber-50/40 to-emerald-50/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                <Star className="h-6 w-6 fill-amber-400 text-amber-500" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  มีปัญหาที่ได้รับการแก้ไขเสร็จสิ้นแล้ว ({stats.resolved} รายการ)
                </h3>
                <p className="text-xs text-slate-500">
                  ร่วมส่งผลประเมินความพึงพอใจ เพื่อให้เจ้าหน้าที่นำไปพัฒนาคุณภาพการบริการ
                </p>
              </div>
            </div>
            <Link
              href="/user/feedback"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1b5e4a] hover:bg-[#144738] text-white text-xs font-bold rounded-xl transition shadow-xs shrink-0"
            >
              <span>ทำแบบประเมินความพึงพอใจ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* หมวดหมู่ปัญหา */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              ประเภทปัญหาที่แจ้งได้
            </h2>
            {disabledCategories.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>มี {disabledCategories.length} หมวดหมู่ปิดรับแจ้งชั่วคราว</span>
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => {
              const isDisabled = disabledCategories.includes(category);
              if (isDisabled) {
                return (
                  <div
                    key={category}
                    title="หมวดหมู่นี้ปิดรับแจ้งชั่วคราว"
                    className="cursor-not-allowed rounded-xl border border-dashed border-slate-300 bg-slate-100 p-4 text-center text-xs sm:text-sm text-slate-400 select-none opacity-80"
                  >
                    <div className="flex items-center justify-center gap-1.5 line-through">
                      <Tag className="h-3.5 w-3.5" />
                      <span>{category}</span>
                    </div>
                    <span className="mt-1 block text-xs font-semibold text-rose-500">
                      (ปิดรับแจ้งชั่วคราว)
                    </span>
                  </div>
                );
              }
              return (
                <Link
                  key={category}
                  href={`/user/report?category=${encodeURIComponent(category)}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs sm:text-sm font-semibold text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-900 transition"
                >
                  <Tag className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>{category}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ข่าวสารและประกาศ (อัปเดตแบบเรียลไทม์จากฝั่ง Admin) */}
        <section
          id="news"
          className={`scroll-mt-24 rounded-2xl bg-white p-6 shadow-sm transition-all duration-500 ${
            highlightNews
              ? "border-2 border-emerald-500 ring-4 ring-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.35)] scale-[1.01]"
              : "border border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Newspaper className="h-5 w-5" />
              </span>

              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  ข่าวสารและประกาศ
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  ข่าวสาร กิจกรรม และมาตรการล่าสุดจากทางมหาวิทยาลัย
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400">
              <span>ทั้งหมด {sortedAnnouncements.length} รายการ</span>
            </span>
          </div>

          <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
            {sortedAnnouncements.map((item) => {
              const isUrgent = item.urgency === "urgent";
              return (
                <article
                  key={item.id}
                  onClick={() => setSelectedAnnouncement(item)}
                  className={`cursor-pointer rounded-2xl border p-4.5 transition hover:shadow-md hover:border-emerald-300 ${
                    item.isPinned
                      ? "border-amber-200 bg-gradient-to-br from-amber-50/40 via-white to-white"
                      : "border-slate-100 bg-slate-50/70 hover:bg-emerald-50/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs ${
                        isUrgent
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : item.isPinned
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-white text-emerald-700 border-slate-100"
                      }`}
                    >
                      {item.isPinned ? (
                        <Pin className="h-4 w-4" />
                      ) : (
                        getCategoryIcon(item.category)
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1 text-[10px]">
                        {item.isPinned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
                            <Pin className="h-2.5 w-2.5" />
                            <span>ปักหมุด</span>
                          </span>
                        )}
                        {isUrgent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 font-bold text-rose-700">
                            <AlertCircle className="h-2.5 w-2.5" />
                            <span>เร่งด่วน</span>
                          </span>
                        )}
                        <span className="rounded-full bg-slate-200/70 px-2 py-0.5 font-medium text-slate-600">
                          {item.category}
                        </span>
                        {item.tag && (
                          <span className="rounded-full bg-emerald-100/60 px-2 py-0.5 font-medium text-emerald-800">
                            {item.tag}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug hover:text-emerald-800 transition">
                        {item.title}
                      </h3>

                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {item.content}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{item.author}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{item.date}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* ================= Announcement Detail Modal ================= */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-700" />

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Newspaper className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    รายละเอียดประกาศ
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    มหาวิทยาลัยวลัยลักษณ์ · UniCare
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {selectedAnnouncement.isPinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800">
                    <Pin className="h-3 w-3" />
                    <span>ปักหมุด</span>
                  </span>
                )}
                {selectedAnnouncement.urgency === "urgent" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 font-bold text-rose-700">
                    <AlertCircle className="h-3 w-3" />
                    <span>เร่งด่วน / มาตรการ</span>
                  </span>
                )}
                <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800">
                  {selectedAnnouncement.category}
                </span>
                {selectedAnnouncement.tag && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                    {selectedAnnouncement.tag}
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
                {selectedAnnouncement.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {selectedAnnouncement.content}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedAnnouncement.author}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedAnnouncement.date}</span>
                </span>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3.5 text-right border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}