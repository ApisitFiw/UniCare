"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sprout,
  User,
  Megaphone,
  ShieldCheck,
  Building2,
  Trees,
  Volume2,
  Recycle,
  Leaf,
  Mail,
  Phone,
  MapPin,
  Newspaper,
  Pin,
  AlertCircle,
  Calendar,
  Tag,
  ArrowRight,
  X,
} from "lucide-react";
import { getAnnouncements, type AnnouncementItem } from "@/lib/announcementsData";
import UniCareLogo from "@/components/UniCareLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  useEffect(() => {
    const syncNews = () => {
      setAnnouncements(getAnnouncements());
    };
    syncNews();

    window.addEventListener("unicare-announcements-updated", syncNews);
    window.addEventListener("storage", syncNews);
    window.addEventListener("focus", syncNews);

    return () => {
      window.removeEventListener("unicare-announcements-updated", syncNews);
      window.removeEventListener("storage", syncNews);
      window.removeEventListener("focus", syncNews);
    };
  }, []);

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [announcements]);

  const handleAuthAction = (actionType: "login" | "register" | "report") => {
    if (actionType === "login") {
      router.push("/login");
    } else if (actionType === "register") {
      router.push("/register");
    } else {
      router.push("/login?redirect=report");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f8f5] text-[#0f3028]">
      {/* ========================= NAVBAR (Public / Guest) ========================= */}
      <header className="h-[76px] bg-white flex items-center justify-between px-[6%] border-b border-[#d4e6dc] sticky top-0 z-50">
        {/* โลโก้ UniCare */}
        <Link href="/" className="flex items-center gap-2.5 min-w-[190px]">
          <UniCareLogo className="w-[42px] h-[42px]" />
          <div>
            <h2 className="text-xl font-bold text-[#15453b] leading-none">
              UniCare
            </h2>
            <p className="text-[10px] text-[#2b8273] font-semibold mt-1">
              {t("มหาวิทยาลัยสีเขียว น่าอยู่ อย่างยั่งยืน")}
            </p>
          </div>
        </Link>

        {/* ปุ่มเปลี่ยนภาษา TH/EN และปุ่มเข้าสู่ระบบ / สมัครสมาชิก */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <button
            type="button"
            onClick={() => handleAuthAction("login")}
            className="flex items-center gap-2 px-4 py-2 border-[1.5px] border-[#217972] rounded-xl text-[13px] text-[#0f3028] bg-white font-semibold transition hover:bg-[#eef8f2] hover:border-[#15453b]"
          >
            <User className="w-4 h-4 text-emerald-800" />
            <span>{t("เข้าสู่ระบบ")}</span>
          </button>
          <button
            type="button"
            onClick={() => handleAuthAction("register")}
            className="px-4 py-2 rounded-xl text-[13px] text-white bg-gradient-to-br from-[#15453b] to-[#0f3028] font-semibold transition hover:from-[#217972] hover:to-[#15453b] shadow-xs"
          >
            {t("สมัครสมาชิก")}
          </button>
        </div>
      </header>

      {/* ========================= HERO SECTION ========================= */}
      <main className="flex-1 min-h-[520px] lg:min-h-[580px] relative overflow-hidden flex items-center border-b border-[#d6e8dc]">
        {/* รูปภาพธรรมชาติพื้นหลัง ปรับให้เห็นภาพชัดเจนขึ้น 50% */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src="/images/hero-campus.jpg"
            alt={t("มหาวิทยาลัยสีเขียว น่าอยู่ อย่างยั่งยืน")}
            className="w-full h-full object-cover object-center"
          />
          {/* เลเยอร์สีขาวโปร่งแสงปรับให้ชัดเจนขึ้น 50% เห็นธรรมชาติสวยงามและอ่านข้อความได้คมชัด */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/50 to-white/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-[#f3f8f5]" />
        </div>

        <div className="w-[88%] max-w-[1250px] mx-auto relative z-10 py-14 sm:py-20">
          {/* เนื้อหาและปุ่ม Call to Action */}
          <div className="max-w-[700px] space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/85 border border-emerald-800/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-950 shadow-xs backdrop-blur-md">
              <Leaf className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t("ระบบบริหารจัดการสิ่งแวดล้อม มหาวิทยาลัยวลัยลักษณ์")}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#0a261f] leading-[1.25]">
              {t("แจ้งปัญหา")}
              <br />
              <span className="text-[#13594e]">{t("เพื่อมหาวิทยาลัยที่น่าอยู่")}</span>
            </h1>

            <p className="text-base sm:text-lg text-[#164235] leading-relaxed max-w-[600px] font-semibold">
              {t(
                "พบปัญหาเสียงรบกวนหรือสิ่งแวดล้อมภายในมหาวิทยาลัย? เข้าสู่ระบบเพื่อแจ้งเรื่องอย่างรวดเร็ว แนบหลักฐานภาพ/เสียง และติดตามผลการดำเนินงานของเจ้าหน้าที่แบบเรียลไทม์"
              )}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => handleAuthAction("report")}
                className="inline-flex items-center gap-2.5 bg-gradient-to-br from-[#15453b] to-[#0f3028] text-white border border-[#0f3028] px-7 py-3.5 rounded-xl text-[15px] font-bold shadow-[0_8px_20px_rgba(15,48,40,0.22)] hover:from-[#217972] hover:to-[#15453b] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,48,40,0.3)] transition-all"
              >
                <Megaphone className="w-4 h-4 text-white" />
                <span>{t("เข้าสู่ระบบเพื่อแจ้งปัญหา")}</span>
              </button>

              <button
                type="button"
                onClick={() => handleAuthAction("register")}
                className="inline-flex items-center gap-2 bg-white/90 hover:bg-white text-[#15453b] border border-[#217972]/30 px-6 py-3.5 rounded-xl text-[14px] font-bold shadow-xs hover:-translate-y-0.5 transition-all backdrop-blur-xs"
              >
                <span>{t("สมัครสมาชิก")}</span>
                <ArrowRight className="w-4 h-4 text-[#217972]" />
              </button>
            </div>

            <div className="pt-2 text-xs font-semibold text-[#2b5949] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {t("ข้อมูลของผู้แจ้งได้รับการคุ้มครองความปลอดภัยตามมาตรฐานมหาวิทยาลัย")}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ========================= ข่าวสาร / ประกาศ ========================= */}
      {sortedAnnouncements.length > 0 && (
        <section id="news" className="bg-white py-12 px-[6%] border-b border-[#d4e6dc]">
          <div className="max-w-[1250px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-2xs">
                  <Newspaper className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0f3028]">
                    {t("ข่าวสารและประกาศ")}
                  </h2>
                  <p className="text-xs text-[#285445] mt-0.5">
                    {t("ประกาศ กิจกรรม และมาตรการล่าสุดจากทางมหาวิทยาลัยวลัยลักษณ์")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAuthAction("login")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
              >
                <span>{t("เข้าสู่ระบบเพื่อดูทั้งหมด")}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedAnnouncements.slice(0, 3).map((item) => {
                const isUrgent = item.urgency === "urgent";
                return (
                  <article
                    key={item.id}
                    onClick={() => setSelectedAnnouncement(item)}
                    className={`rounded-2xl border p-5 transition hover:shadow-md cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] ${
                      item.isPinned
                        ? "border-amber-200 bg-gradient-to-br from-amber-50/30 via-white to-white"
                        : "border-slate-200/90 bg-[#f8faf9]/60 hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-[10px]">
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800">
                          <Pin className="h-2.5 w-2.5" />
                          <span>{t("ปักหมุด")}</span>
                        </span>
                      )}
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 font-bold">
                          <AlertCircle className="h-2.5 w-2.5" />
                          <span>{t("เร่งด่วน")}</span>
                        </span>
                      )}
                      <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800">
                        {item.category}
                      </span>
                      {item.tag && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 announcement-content" data-no-translate="true" translate="no">
                          {item.tag}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-800 leading-snug line-clamp-2 announcement-content" data-no-translate="true" translate="no">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3 announcement-content" data-no-translate="true" translate="no">
                      {item.content}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="announcement-content" data-no-translate="true" translate="no">{item.author}</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{item.date}</span>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

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
                    {t("รายละเอียดประกาศ")}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    มหาวิทยาลัยวลัยลักษณ์ · UniCare
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
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
                    <span>{t("ปักหมุด")}</span>
                  </span>
                )}
                {selectedAnnouncement.urgency === "urgent" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 font-bold text-rose-700">
                    <AlertCircle className="h-3 w-3" />
                    <span>{t("เร่งด่วน")}</span>
                  </span>
                )}
                <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800">
                  {selectedAnnouncement.category}
                </span>
                {selectedAnnouncement.tag && (
                  <span
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600 announcement-content"
                    data-no-translate="true"
                    translate="no"
                  >
                    {selectedAnnouncement.tag}
                  </span>
                )}
              </div>

              <h2
                className="text-base sm:text-lg font-black text-slate-800 leading-snug announcement-content"
                data-no-translate="true"
                translate="no"
              >
                {selectedAnnouncement.title}
              </h2>

              <p
                className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100 announcement-content max-h-60 overflow-y-auto"
                data-no-translate="true"
                translate="no"
              >
                {selectedAnnouncement.content}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span
                  className="inline-flex items-center gap-1.5 font-medium text-slate-600 announcement-content"
                  data-no-translate="true"
                  translate="no"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span data-no-translate="true" translate="no">
                    {selectedAnnouncement.author}
                  </span>
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
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 cursor-pointer"
              >
                {t("ปิด")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= FOOTER ========================= */}
      <footer
        id="about"
        className="bg-[#0f3028] border-t border-[#1c5e52] px-[6%] pt-11 pb-6 text-[#e2f2e9]"
      >
        <div className="max-w-[1250px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* คอลัมน์ 1: Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <UniCareLogo variant="dark" className="w-[38px] h-[38px]" />
              <h2 className="text-xl font-bold text-white">UniCare</h2>
            </div>
            <p className="text-xs text-[#92b5a5] leading-relaxed max-w-[260px]">
              {t("ระบบแจ้งปัญหาเสียงรบกวนและสิ่งแวดล้อม เพื่อการยกระดับคุณภาพชีวิตในมหาวิทยาลัย")}
            </p>
          </div>

          {/* คอลัมน์ 2: เมนูด่วน */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-[#a8e6b1]">{t("เมนูด่วน")}</h4>
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                className="text-[#b7d5c7] hover:text-white transition-colors"
              >
                {t("หน้าหลัก")}
              </Link>
              <a
                href="#about"
                className="text-[#b7d5c7] hover:text-white transition-colors"
              >
                {t("เกี่ยวกับเรา")}
              </a>
            </div>
          </div>

          {/* คอลัมน์ 3: เกี่ยวกับระบบ */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-[#a8e6b1]">{t("เกี่ยวกับระบบ")}</h4>
            <div className="flex flex-col space-y-2">
              <Link
                href="/privacy"
                className="text-[#b7d5c7] hover:text-white transition-colors"
              >
                {t("นโยบายความเป็นส่วนตัว")}
              </Link>
              <Link
                href="/terms"
                className="text-[#b7d5c7] hover:text-white transition-colors"
              >
                {t("เงื่อนไขการใช้งาน")}
              </Link>
              <Link
                href="/user/help"
                className="text-[#b7d5c7] hover:text-white transition-colors"
              >
                {t("ศูนย์ความช่วยเหลือ")}
              </Link>
            </div>
          </div>

          {/* คอลัมน์ 4: ติดต่อเรา */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-[#a8e6b1]">{t("ติดต่อเรา")}</h4>
            <div className="space-y-2 text-[#b7d5c7]">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>unicare@university.ac.th</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>02-123-4567</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{t("อาคารสำนักงานอธิการบดี ชั้น 2")}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ลิขสิทธิ์ด้านล่าง */}
        <div className="max-w-[1250px] mx-auto mt-8 pt-4 border-t border-[#1d4d40] text-[11px] text-[#799e8e]">
          © 2026 UniCare. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
