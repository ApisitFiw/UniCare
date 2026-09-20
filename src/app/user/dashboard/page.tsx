"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NotificationDropdown from "@/components/NotificationDropdown";

interface IssueCategory {
  category_id: number;
  category_name: string;
}

interface IssueReportSummary {
  status: "Pending" | "In_Progress" | "Resolved" | "Closed";
}

// ==========================================
// 1. ฟังก์ชันคอมโพเนนต์: ข่าวสาร / ประกาศ
// ==========================================
function NewsSection() {
  const newsItems = [
    {
      id: 1,
      title: "มาตรการลดเสียงรบกวนในช่วงสอบปลายภาค",
      date: "28 พ.ค. 2026",
      icon: "📢",
      tag: "ประกาศสำคัญ",
      desc: "ขอความร่วมมือผู้พักอาศัยในหอพักและบริเวณโดยรอบ งดกิจกรรมที่ใช้เสียงดังหลังเวลา 21.00 น.",
    },
    {
      id: 2,
      title: "กิจกรรม Big Cleaning Day มหาวิทยาลัยวลัยลักษณ์",
      date: "15 มิ.ย. 2026",
      icon: "🌱",
      tag: "กิจกรรม",
      desc: "ร่วมแรงร่วมใจทำความสะอาดและคัดแยกขยะตามจุดต่าง ๆ รอบมหาวิทยาลัยเพื่อสิ่งแวดล้อมที่ยั่งยืน",
    },
    {
      id: 3,
      title: "แผนปรับปรุงระบบไฟส่องสว่างบริเวณสนามกีฬา",
      date: "20 มิ.ย. 2026",
      icon: "💡",
      tag: "บำรุงรักษา",
      desc: "เจ้าหน้าที่จะเข้าดำเนินการเปลี่ยนหลอดไฟ LED ในระหว่างวันที่ 22-25 มิ.ย. 2026",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          📰 ข่าวสารและประกาศทั้งหมด
        </h2>
        <p className="text-xs text-slate-500">
          อัปเดตข้อมูลข่าวสาร กิจกรรม และมาตรการด้านสิ่งแวดล้อม
        </p>
      </div>
      <div className="grid gap-3">
        {newsItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{item.icon}</span>
                <h3 className="text-sm font-bold text-slate-800">
                  {item.title}
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-100">
                {item.tag}
              </span>
            </div>
            <p className="text-xs text-slate-600 pl-7">{item.desc}</p>
            <p className="text-[10px] text-slate-400 pl-7">{item.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 2. ฟังก์ชันคอมโพเนนต์: คำถามที่พบบ่อย (FAQ)
// ==========================================
function FaqSection() {
  const [openId, setOpenId] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      category: "การแจ้งปัญหา",
      question:
        "หลังจากส่งเรื่องแจ้งปัญหาแล้ว จะมีเจ้าหน้าที่ดำเนินการภายในกี่วัน?",
      answer:
        "เจ้าหน้าที่ส่วนงานสิ่งแวดล้อมและความปลอดภัยจะเข้าตรวจสอบเบื้องต้นภายใน 24 ชั่วโมง และหากเป็นกรณีเร่งด่วนจะประสานเวรตรวจเข้าดำเนินการทันที",
    },
    {
      id: 2,
      category: "ความเป็นส่วนตัว",
      question: "ผู้ถูกร้องเรียนจะทราบตัวตนของผู้แจ้งหรือไม่?",
      answer:
        "ระบบ UniCare รักษาความลับของผู้แจ้งอย่างเคร่งครัด ข้อมูลผู้แจ้งจะมองเห็นได้เฉพาะผู้ดูแลระบบส่วนกลางเท่านั้น และไม่มีการเปิดเผยต่อสาธารณะ",
    },
    {
      id: 3,
      category: "การติดตามสถานะ",
      question: "สามารถตรวจสอบสถานะการแก้ไขปัญหาได้จากที่ไหน?",
      answer:
        'สามารถเข้าไปที่เมนู "รายการของฉัน" บนแถบนำทางด้านซ้าย เพื่อตรวจสอบขั้นตอนการดำเนินงานและบันทึกข้อความจากเจ้าหน้าที่',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          ❓ คำถามที่พบบ่อย (FAQ)
        </h2>
        <p className="text-xs text-slate-500">
          คำถามและข้อสงสัยทั่วไปเกี่ยวกับการใช้งานระบบ UniCare
        </p>
      </div>
      <div className="space-y-2.5">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {faq.category}
                  </span>
                  <h3 className="text-xs font-semibold text-slate-800 mt-1">
                    {faq.question}
                  </h3>
                </div>
                <span
                  className={`text-slate-400 text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                >
                  ▼
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-3.5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 3. ฟังก์ชันคอมโพเนนต์: ช่องทางการติดต่อ
// ==========================================
function ContactSection() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          💬 ติดต่อเจ้าหน้าที่ / ศูนย์ประสานงาน
        </h2>
        <p className="text-xs text-slate-500">
          แจ้งข้อเสนอแนะหรือติดต่อหน่วยงานที่ดูแลสิ่งแวดล้อมโดยตรง
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-xl">🏢</span>
            <h3 className="text-xs font-bold text-slate-800">
              ศูนย์ประสานงานสิ่งแวดล้อม
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              มหาวิทยาลัยวลัยลักษณ์ 222 ต.ไทยบุรี อ.ท่าศาลา จ.นครศรีธรรมราช
              80160
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-2 text-xs">
            <p>
              📞 โทรศัพท์ภายใน:{" "}
              <span className="font-semibold text-slate-700">0-7567-3000</span>
            </p>
            <p>
              🚨 เหตุฉุกเฉิน 24 ชม.:{" "}
              <span className="font-bold text-rose-600">0-7567-3111</span>
            </p>
            <p>
              ✉️ อีเมล:{" "}
              <span className="font-semibold text-slate-700">
                unicare@wu.ac.th
              </span>
            </p>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          {submitted ? (
            <div className="text-center py-8 space-y-2">
              <span className="text-3xl">✅</span>
              <h3 className="text-sm font-bold text-slate-800">
                ส่งข้อความเรียบร้อยแล้ว
              </h3>
              <p className="text-xs text-slate-500">
                เจ้าหน้าที่จะตรวจสอบและติดต่อกลับโดยเร็วที่สุด
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-2 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs cursor-pointer"
              >
                ส่งข้อความใหม่
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 border-b pb-2">
                ส่งข้อความ / ข้อเสนอแนะ
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  หัวข้อเรื่อง
                </label>
                <input
                  type="text"
                  required
                  placeholder="ระบุหัวข้อ..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  ข้อความ
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="พิมพ์ข้อความที่ต้องการติดต่อ..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-[#1b5e4a] hover:bg-[#154c3c] text-white font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                ส่งข้อความ
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. Main Page Component
// ==========================================
export default function UserDashboardPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<
    "main" | "news" | "faq" | "contact"
  >("main");
  const [userName, setUserName] = useState<string>("กิตติภูมิ ปราชญนคร");
  const [reports, setReports] = useState<IssueReportSummary[]>([]);
  const [categories, setCategories] = useState<IssueCategory[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.user_metadata?.full_name) {
        setUserName(authData.user.user_metadata.full_name);
      }

      const { data: reportsData } = await supabase
        .from("issue_reports")
        .select("status");
      if (reportsData) setReports(reportsData as IssueReportSummary[]);

      const { data: catData } = await supabase
        .from("issue_categories")
        .select("category_id, category_name");
      if (catData && catData.length > 0) {
        setCategories(catData);
      } else {
        setCategories([
          { category_id: 1, category_name: "เสียงรบกวน" },
          { category_id: 2, category_name: "ขยะ / ของเสีย" },
          { category_id: 3, category_name: "น้ำ / น้ำเสีย" },
          { category_id: 4, category_name: "อากาศ / มลพิษ" },
          { category_id: 5, category_name: "แสงสว่าง" },
          { category_id: 6, category_name: "ต้นไม้ / พื้นที่เขียว" },
          { category_id: 7, category_name: "อื่น ๆ" },
        ]);
      }
    }
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = reports.length || 128;
    const inProgress =
      reports.filter((r) => r.status === "In_Progress").length || 24;
    const resolved =
      reports.filter((r) => r.status === "Resolved" || r.status === "Closed")
        .length || 96;
    const pending = reports.filter((r) => r.status === "Pending").length || 8;
    return { total, inProgress, resolved, pending };
  }, [reports]);

  const handleLogout = async () => {
    if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
      await supabase.auth.signOut();
      router.push("/");
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex font-['Prompt',sans-serif]">
      {/* Sidebar */}
      <aside
        className="w-64 text-white flex-shrink-0 sticky top-0 h-screen overflow-y-auto p-5 hidden md:flex flex-col justify-between border-r border-[#103e31]"
        style={{
          background:
            "linear-gradient(180deg, #2b8273 0%, #1c5e52 40%, #15453b 70%, #0f3028 100%)",
        }}
      >
        <div className="space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-white/15">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold border border-white/30 shadow-xs">
              🌱
            </div>
            <h1 className="text-xl font-extrabold uppercase tracking-wider text-white">
              UniCare
            </h1>
          </div>

          <nav className="space-y-1.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setCurrentTab("main")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                currentTab === "main"
                  ? "bg-[#a8e6b1] text-[#0f3028] font-bold shadow-md border border-white/40"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              }`}
            >
              <span className="text-base">🏠</span>
              <span>หน้าหลัก</span>
            </button>

            <Link
              href="/report"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-white/90 hover:bg-white/15 hover:text-white transition"
            >
              <span className="text-base">📢</span>
              <span>แจ้งปัญหา</span>
            </Link>

            <Link
              href="/my-reports"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-white/90 hover:bg-white/15 hover:text-white transition"
            >
              <span className="text-base">📋</span>
              <span>รายการของฉัน</span>
            </Link>

            <button
              type="button"
              onClick={() => setCurrentTab("news")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                currentTab === "news"
                  ? "bg-[#a8e6b1] text-[#0f3028] font-bold shadow-md border border-white/40"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              }`}
            >
              <span className="text-base">📰</span>
              <span>ข่าวสาร / ประกาศ</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab("faq")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                currentTab === "faq"
                  ? "bg-[#a8e6b1] text-[#0f3028] font-bold shadow-md border border-white/40"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              }`}
            >
              <span className="text-base">❓</span>
              <span>คำถามที่พบบ่อย</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab("contact")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                currentTab === "contact"
                  ? "bg-[#a8e6b1] text-[#0f3028] font-bold shadow-md border border-white/40"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              }`}
            >
              <span className="text-base">💬</span>
              <span>ติดต่อเรา</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-rose-200 hover:text-white border border-white/15 text-xs font-semibold transition mt-4 shadow-xs cursor-pointer"
            >
              <span className="text-base">🚪</span>
              <span>ออกจากระบบ</span>
            </button>
          </nav>
        </div>

        <div className="bg-black/20 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center shadow-inner">
          <p className="text-xs text-emerald-100 font-medium">
            ร่วมสร้างมหาวิทยาลัยน่าอยู่ไปด้วยกัน 🌱
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar พร้อม NotificationDropdown */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-emerald-950 leading-tight">
              ระบบแจ้งปัญหาเสียงรบกวนและสิ่งแวดล้อม
            </h1>
            <p className="text-xs text-slate-500">มหาวิทยาลัยวลัยลักษณ์</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* ปุ่มแจ้งเตือนแบบ Dropdown */}
            <NotificationDropdown />

            {/* โปรไฟล์ผู้ใช้ */}
            <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full text-xs shadow-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[12px]">
                👤
              </div>
              <span className="font-medium text-slate-800 hidden sm:inline-block">
                {userName}
              </span>
              <span className="bg-[#1b5e4a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                User
              </span>
            </div>
          </div>
        </header>

        {/* ส่วนแสดงผลข้อมูล */}
        <main className="p-6 space-y-6 overflow-y-auto max-w-7xl">
          {currentTab === "news" && <NewsSection />}
          {currentTab === "faq" && <FaqSection />}
          {currentTab === "contact" && <ContactSection />}

          {currentTab === "main" && (
            <>
              {/* Hero Banner */}
              <section className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#065f46] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="relative z-10 space-y-2 max-w-lg text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    ร่วมกันดูแล มหาวิทยาลัยวลัยลักษณ์
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-100 font-light">
                    เพื่อสิ่งแวดล้อมที่ดีและคุณภาพชีวิตที่ดีของทุกคน
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/report"
                      className="inline-flex items-center space-x-2 bg-white text-emerald-900 font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs hover:bg-emerald-50 transition transform hover:-translate-y-0.5"
                    >
                      <span>📢</span>
                      <span>แจ้งปัญหาใหม่</span>
                    </Link>
                  </div>
                </div>
                <div className="relative z-10 hidden sm:flex w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 items-center justify-center text-4xl shadow-inner">
                  🌱
                </div>
              </section>

              {/* การ์ดสถิติ 4 ใบ และ ข่าวสารย่อ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    ภาพรวมการดำเนินการ
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex items-center space-x-3">
                      <span className="text-2xl">📢</span>
                      <div>
                        <p className="text-[11px] text-emerald-700 font-medium">
                          ทั้งหมด
                        </p>
                        <p className="text-xl font-bold text-emerald-950">
                          {stats.total}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          เรื่อง
                        </span>
                      </div>
                    </div>
                    <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 flex items-center space-x-3">
                      <span className="text-2xl">⏳</span>
                      <div>
                        <p className="text-[11px] text-amber-700 font-medium">
                          กำลังดำเนินการ
                        </p>
                        <p className="text-xl font-bold text-amber-900">
                          {stats.inProgress}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          เรื่อง
                        </span>
                      </div>
                    </div>
                    <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-3.5 flex items-center space-x-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="text-[11px] text-teal-700 font-medium">
                          ดำเนินการแล้ว
                        </p>
                        <p className="text-xl font-bold text-teal-950">
                          {stats.resolved}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          เรื่อง
                        </span>
                      </div>
                    </div>
                    <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3.5 flex items-center space-x-3">
                      <span className="text-2xl">🔍</span>
                      <div>
                        <p className="text-[11px] text-rose-700 font-medium">
                          รอรับการตรวจสอบ
                        </p>
                        <p className="text-xl font-bold text-rose-900">
                          {stats.pending}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          เรื่อง
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <h3 className="text-sm font-bold text-slate-800">
                      ข่าวสาร / ประกาศ
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCurrentTab("news")}
                      className="text-[11px] text-emerald-700 font-semibold hover:underline cursor-pointer"
                    >
                      ดูทั้งหมด
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-9 rounded-lg bg-emerald-50 border border-emerald-100 shrink-0 flex items-center justify-center text-xs text-emerald-700">
                        📢
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          มาตรการลดเสียงรบกวนในช่วงสอบปลายภาค
                        </p>
                        <p className="text-[10px] text-slate-400">
                          28 พ.ค. 2026
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-9 rounded-lg bg-emerald-50 border border-emerald-100 shrink-0 flex items-center justify-center text-xs text-emerald-700">
                        🌱
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          กิจกรรม Big Cleaning Day มหาวิทยาลัย
                        </p>
                        <p className="text-[10px] text-slate-400">
                          15 มิ.ย. 2026
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* หมวดหมู่ปัญหา */}
              <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    ประเภทปัญหาที่พบบ่อย
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    เลือกประเภทเพื่อเริ่มแจ้งเรื่อง
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-center">
                  {categories.map((cat) => (
                    <button
                      key={cat.category_id}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/report?category=${encodeURIComponent(cat.category_name)}`,
                        )
                      }
                      className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition cursor-pointer flex flex-col items-center group"
                    >
                      <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                        🏷️
                      </span>
                      <span className="text-xs font-medium text-slate-700 group-hover:text-emerald-900">
                        {cat.category_name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
