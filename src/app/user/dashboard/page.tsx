"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getDemoSession,
  type DemoSession,
} from "@/lib/demoAuth";

import {
  getAllCurrentIssues,
  getDisabledCategoryNames,
} from "@/lib/issuesData";

import AccountBar from "@/components/AccountBar";

const categories = [
  "เสียงรบกวน",
  "ขยะ / ของเสีย",
  "น้ำ / น้ำเสีย",
  "อากาศ / มลพิษ",
  "แสงสว่าง",
  "ต้นไม้ / พื้นที่สีเขียว",
  "อื่น ๆ",
];

const news = [
  {
    icon: "📢",
    title:
      "มาตรการลดเสียงรบกวนในช่วงสอบปลายภาค",
    description:
      "ขอความร่วมมืองดกิจกรรมที่ใช้เสียงดังหลังเวลา 21.00 น.",
  },
  {
    icon: "🌱",
    title: "กิจกรรม Big Cleaning Day",
    description:
      "ร่วมกันทำความสะอาดและคัดแยกขยะภายในมหาวิทยาลัย",
  },
];

export default function UserDashboardPage() {
  const router = useRouter();

  const [session, setSession] =
    useState<DemoSession | null>(null);

  const [
    disabledCategories,
    setDisabledCategories,
  ] = useState<string[]>([]);

  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    resolved: 0,
  });

  /*
   * ตรวจสอบบัญชีผู้ใช้งาน
   */
  useEffect(() => {
    function updateSession() {
      const currentSession =
        getDemoSession();

      if (
        !currentSession ||
        currentSession.role !== "user"
      ) {
        router.replace("/login");
        return;
      }

      setSession(currentSession);
    }

    updateSession();

    window.addEventListener(
      "unicare-profile-updated",
      updateSession,
    );

    window.addEventListener(
      "storage",
      updateSession,
    );

    return () => {
      window.removeEventListener(
        "unicare-profile-updated",
        updateSession,
      );

      window.removeEventListener(
        "storage",
        updateSession,
      );
    };
  }, [router]);

  /*
   * เลื่อนไปยังตำแหน่งที่ระบุใน URL
   * หลังจาก Session และหน้าแสดงเสร็จแล้ว
   *
   * ตัวอย่าง URL:
   * /user/dashboard#news
   */
  useEffect(() => {
    if (!session) return;

    let scrollTimer: ReturnType<
      typeof setTimeout
    > | null = null;

    function scrollToCurrentHash() {
      const hash =
        window.location.hash;

      if (!hash) return;

      const elementId =
        decodeURIComponent(
          hash.substring(1),
        );

      /*
       * ยกเลิก Timer เดิม
       * ป้องกันการเลื่อนซ้ำ
       */
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }

      /*
       * รอ 250ms ให้หน้าและข้อมูล
       * แสดงเรียบร้อยก่อนเริ่มเลื่อน
       */
      scrollTimer = setTimeout(() => {
        const target =
          document.getElementById(
            elementId,
          );

        if (!target) return;

        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 250);
    }

    scrollToCurrentHash();

    window.addEventListener(
      "hashchange",
      scrollToCurrentHash,
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        scrollToCurrentHash,
      );

      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [session]);

  /*
   * ดึงข้อมูลหมวดหมู่และสถิติคำร้อง
   */
  useEffect(() => {
    function syncData() {
      setDisabledCategories(
        getDisabledCategoryNames(),
      );

      const currentSession =
        getDemoSession();

      if (!currentSession) return;

      const issues =
        getAllCurrentIssues();

      const currentName = (
        currentSession.name || ""
      )
        .trim()
        .toLowerCase();

      const currentEmail = (
        currentSession.email || ""
      )
        .trim()
        .toLowerCase();

      const myIssues = issues.filter(
        (issue) => {
          const reporterName = (
            issue.reporterName || ""
          )
            .trim()
            .toLowerCase();

          const reporterEmail = (
            issue.reporterEmail || ""
          )
            .trim()
            .toLowerCase();

          /*
           * ตรวจสอบคำร้องจากอีเมล
           */
          if (
            currentEmail &&
            reporterEmail &&
            currentEmail === reporterEmail
          ) {
            return true;
          }

          /*
           * รองรับบัญชีผู้ใช้ทดลองเดิม
           */
          if (
            currentEmail ===
              "user@unicare.local" &&
            (reporterEmail ===
              "kittipoom@example.com" ||
              reporterName.includes(
                "กิตติภูมิ",
              ))
          ) {
            return true;
          }

          /*
           * ตรวจสอบคำร้องจากชื่อ
           */
          if (
            currentName &&
            reporterName &&
            currentName === reporterName
          ) {
            return true;
          }

          return false;
        },
      );

      const total =
        myIssues.length;

      const inProgress =
        myIssues.filter(
          (issue) =>
            issue.status ===
              "in_progress" ||
            issue.status === "pending",
        ).length;

      const resolved =
        myIssues.filter(
          (issue) =>
            issue.status === "resolved",
        ).length;

      setStats({
        total,
        inProgress,
        resolved,
      });
    }

    syncData();

    window.addEventListener(
      "storage",
      syncData,
    );

    window.addEventListener(
      "unicare-demo-reports-updated",
      syncData,
    );

    window.addEventListener(
      "unicare-category-metadata-updated",
      syncData,
    );

    window.addEventListener(
      "unicare-profile-updated",
      syncData,
    );

    window.addEventListener(
      "focus",
      syncData,
    );

    return () => {
      window.removeEventListener(
        "storage",
        syncData,
      );

      window.removeEventListener(
        "unicare-demo-reports-updated",
        syncData,
      );

      window.removeEventListener(
        "unicare-category-metadata-updated",
        syncData,
      );

      window.removeEventListener(
        "unicare-profile-updated",
        syncData,
      );

      window.removeEventListener(
        "focus",
        syncData,
      );
    };
  }, []);

  /*
   * ระหว่างตรวจสอบ Session
   */
  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-emerald-900">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />

          <p className="mt-4 text-sm font-semibold">
            กำลังตรวจสอบบัญชี...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f8f5] text-slate-800">
      {/* แถบด้านบน */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white px-6 py-3.5 shadow-xs lg:px-8">
        <Link
          href="/user/dashboard"
          className="flex items-center gap-2 text-base font-extrabold text-emerald-900"
        >
          <span className="text-xl">
            🌱
          </span>

          <span>UniCare</span>

          <span className="ml-1 hidden text-xs font-normal text-slate-400 sm:inline-block">
            · มหาวิทยาลัยวลัยลักษณ์
          </span>
        </Link>

        <AccountBar
          role="USER"
          userName={session.name}
        />
      </header>

      {/* เนื้อหา Dashboard */}
      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        {/* Banner */}
        <section className="rounded-2xl bg-gradient-to-r from-emerald-900 to-emerald-600 p-7 text-white shadow-md">
          <h1 className="text-2xl font-bold">
            ร่วมกันดูแลมหาวิทยาลัยของเรา
          </h1>

          <p className="mt-2 text-sm text-emerald-100">
            แจ้งปัญหาและติดตามการดำเนินงานได้จากระบบ
            UniCare
          </p>

          <Link
            href="/user/report"
            className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
          >
            📢 แจ้งปัญหาใหม่
          </Link>
        </section>

        {/* สถิติคำร้อง */}
        <section className="grid gap-4 sm:grid-cols-3">
          {/* รายงานทั้งหมด */}
          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-semibold text-slate-600">
              📋 รายงานของฉัน
            </p>

            <p className="mt-2 text-3xl font-extrabold text-emerald-950">
              {stats.total}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {stats.total > 0
                ? "เรื่องร้องเรียนทั้งหมดที่คุณแจ้งไว้"
                : "ยังไม่มีข้อมูลรายงาน"}
            </p>
          </div>

          {/* กำลังดำเนินการ */}
          <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-semibold text-slate-600">
              ⏳ กำลังดำเนินการ /
              รอรับเรื่อง
            </p>

            <p className="mt-2 text-3xl font-extrabold text-amber-600">
              {stats.inProgress}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {stats.inProgress > 0
                ? "เจ้าหน้าที่กำลังเร่งดำเนินการแก้ไข"
                : "ไม่มีเคสค้าง"}
            </p>
          </div>

          {/* ดำเนินการแล้ว */}
          <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-semibold text-slate-600">
              ✅ ดำเนินการแล้ว
            </p>

            <p className="mt-2 text-3xl font-extrabold text-emerald-600">
              {stats.resolved}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {stats.resolved > 0
                ? "แก้ไขและดำเนินการสำเร็จแล้ว"
                : "ยังไม่มีเคสที่เสร็จสิ้น"}
            </p>
          </div>
        </section>

        {/* ประเภทปัญหา */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-emerald-950">
              ประเภทปัญหาที่แจ้งได้
            </h2>

            {disabledCategories.length >
              0 && (
              <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                ⚠️ มี{" "}
                {
                  disabledCategories.length
                }{" "}
                หมวดหมู่ปิดรับแจ้งชั่วคราว
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map(
              (category) => {
                const isDisabled =
                  disabledCategories.includes(
                    category,
                  );

                if (isDisabled) {
                  return (
                    <div
                      key={category}
                      title="หมวดหมู่นี้ปิดรับแจ้งชั่วคราว"
                      className="cursor-not-allowed select-none rounded-xl border border-dashed border-slate-300 bg-slate-100 p-4 text-center text-sm text-slate-400 opacity-80"
                    >
                      <span className="line-through">
                        🏷️ {category}
                      </span>

                      <span className="mt-1 block text-xs font-semibold text-rose-500">
                        (ปิดรับแจ้งชั่วคราว)
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={category}
                    href={`/user/report?category=${encodeURIComponent(
                      category,
                    )}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-medium transition hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    🏷️ {category}
                  </Link>
                );
              },
            )}
          </div>
        </section>

        {/* ข่าวสารและประกาศ */}
        <section
          id="news"
          className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl">
              📰
            </span>

            <div>
              <h2 className="text-lg font-bold text-emerald-950">
                ข่าวสารและประกาศ
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                ข่าวสารและกิจกรรมล่าสุดภายในมหาวิทยาลัย
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {news.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                    {item.icon}
                  </span>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-xs leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}