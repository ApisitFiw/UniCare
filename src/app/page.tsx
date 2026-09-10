"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

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
          <div className="w-[42px] h-[42px] rounded-full bg-[#e2f5e8] text-[#15453b] flex items-center justify-center text-[23px] border border-[#bce6ca] shadow-xs">
            🌿
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#15453b] leading-none">
              UniCare
            </h2>
            <p className="text-[10px] text-[#2b8273] font-semibold mt-1">
              มหาวิทยาลัยสีเขียว น่าอยู่ อย่างยั่งยืน
            </p>
          </div>
        </Link>

        {/* ปุ่มเข้าสู่ระบบ / สมัครสมาชิก */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleAuthAction("login")}
            className="flex items-center gap-2 px-4 py-2 border-[1.5px] border-[#217972] rounded-xl text-[13px] text-[#0f3028] bg-white font-semibold transition hover:bg-[#eef8f2] hover:border-[#15453b]"
          >
            <span>👤</span>
            <span>เข้าสู่ระบบ</span>
          </button>
          <button
            type="button"
            onClick={() => handleAuthAction("register")}
            className="px-4 py-2 rounded-xl text-[13px] text-white bg-gradient-to-br from-[#15453b] to-[#0f3028] font-semibold transition hover:from-[#217972] hover:to-[#15453b] shadow-xs"
          >
            สมัครสมาชิก
          </button>
        </div>
      </header>

      {/* ========================= HERO SECTION ========================= */}
      <main className="flex-1 min-h-[520px] bg-gradient-to-br from-[#e3f3ea] via-[#f4faf6] to-[#d5ece0] relative overflow-hidden flex items-center border-b border-[#d6e8dc]">
        {/* พื้นหลัง Radial Glow */}
        <div className="absolute w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,rgba(168,230,177,0.4)_0%,rgba(33,121,114,0.08)_70%,transparent_100%)] -left-[200px] -bottom-[320px] pointer-events-none" />

        <div className="w-[88%] max-w-[1250px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10 py-10">
          {/* ฝั่งซ้าย: เนื้อหาและปุ่ม Call to Action */}
          <div className="w-full lg:w-[52%] space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#0f3028] leading-[1.25]">
              แจ้งปัญหา
              <br />
              <span className="text-[#217972]">เพื่อมหาวิทยาลัยที่น่าอยู่</span>
            </h1>

            <p className="text-base text-[#285445] leading-relaxed max-w-[580px]">
              พบปัญหาเสียงรบกวนหรือสิ่งแวดล้อมภายในมหาวิทยาลัย?
              เข้าสู่ระบบเพื่อแจ้งเรื่องอย่างรวดเร็ว แนบหลักฐานภาพ/เสียง
              และติดตามผลการดำเนินงานของเจ้าหน้าที่แบบเรียลไทม์
            </p>

            <div className="flex flex-wrap gap-3.5">
              <button
                type="button"
                onClick={() => handleAuthAction("report")}
                className="inline-flex items-center gap-2 bg-gradient-to-br from-[#15453b] to-[#0f3028] text-white border border-[#0f3028] px-7 py-3.5 rounded-xl text-[15px] font-bold shadow-[0_6px_18px_rgba(15,48,40,0.2)] hover:from-[#217972] hover:to-[#15453b] hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(15,48,40,0.28)] transition-all"
              >
                <span>📢</span>
                <span>เข้าสู่ระบบเพื่อแจ้งปัญหา</span>
              </button>
            </div>

            <div className="pt-2 text-xs font-medium text-[#386b59] flex items-center gap-1.5">
              <span>🛡️</span>
              <span>
                ข้อมูลของผู้แจ้งได้รับการคุ้มครองความปลอดภัยตามมาตรฐานมหาวิทยาลัย
              </span>
            </div>
          </div>

          {/* ฝั่งขวา: ภาพกราฟิกจำลองและ Floating Icons */}
          <div className="w-full lg:w-[48%] min-h-[330px] relative flex items-center justify-center">
            {/* กล่องตึกมหาวิทยาลัย */}
            <div className="w-[90%] h-[260px] rounded-t-[40%] rounded-b-[8%] bg-[#c8ebd2] border-2 border-[#a4d8bd] shadow-[0_25px_50px_rgba(15,48,40,0.15)] relative overflow-hidden flex items-center justify-center">
              {/* เสาค้ำจำลอง */}
              <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(90deg,#79baa2_0,#79baa2_20px,#e6f5ec_20px,#e6f5ec_40px)]" />

              {/* ไอคอนอาคารตรงกลาง */}
              <span className="text-[100px] sm:text-[120px] relative z-10 drop-shadow-[0_8px_12px_rgba(15,48,40,0.2)]">
                🏫
              </span>

              {/* ต้นไม้ประกอบ 2 ฝั่ง */}
              <span className="absolute text-[50px] sm:text-[55px] left-2 bottom-6 z-10">
                🌳
              </span>
              <span className="absolute text-[50px] sm:text-[55px] right-2 bottom-4 z-10">
                🌳
              </span>
            </div>

            {/* ไอคอนลอย (Floating Elements) */}
            <div className="absolute top-4 left-[6%] w-[68px] h-[68px] rounded-full bg-white shadow-[0_10px_28px_rgba(15,48,40,0.14)] flex items-center justify-center text-3xl border border-[#d4e6dc] animate-bounce">
              🔊
            </div>

            <div className="absolute top-16 right-[4%] w-[68px] h-[68px] rounded-full bg-white shadow-[0_10px_28px_rgba(15,48,40,0.14)] flex items-center justify-center text-3xl border border-[#d4e6dc]">
              ♻️
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[68px] h-[68px] rounded-full bg-white shadow-[0_10px_28px_rgba(15,48,40,0.14)] flex items-center justify-center text-3xl border border-[#d4e6dc]">
              🌿
            </div>
          </div>
        </div>
      </main>

      {/* ========================= FOOTER ========================= */}
      <footer
        id="about"
        className="bg-[#0f3028] border-t border-[#1c5e52] px-[6%] pt-11 pb-6 text-[#e2f2e9]"
      >
        <div className="max-w-[1250px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* คอลัมน์ 1: Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-[36px] h-[36px] rounded-full bg-[#e2f5e8] text-[#15453b] flex items-center justify-center text-xl border border-[#bce6ca]">
                🌿
              </div>
              <h2 className="text-xl font-bold text-white">UniCare</h2>
            </div>
            <p className="text-xs text-[#92b5a5] leading-relaxed max-w-[260px]">
              ระบบแจ้งปัญหาเสียงรบกวนและสิ่งแวดล้อม
              เพื่อการยกระดับคุณภาพชีวิตในมหาวิทยาลัย
            </p>
          </div>

          {/* คอลัมน์ 2: เมนูด่วน */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-[#a8e6b1]">เมนูด่วน</h4>
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                className="text-[#b7d5c7] hover:text-white transition-colors"
              >
                หน้าหลัก
              </Link>
              <a
                href="#about"
                className="text-[#b7d5c7] hover:text-white transition-colors"
              >
                เกี่ยวกับเรา
              </a>
            </div>
          </div>

          {/* คอลัมน์ 3: เกี่ยวกับระบบ */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-[#a8e6b1]">เกี่ยวกับระบบ</h4>
            <div className="flex flex-col space-y-2">
              <a
                href="#"
                className="text-[#b7d5c7] hover:text-white transition-colors"
              >
                นโยบายความเป็นส่วนตัว
              </a>
              <a
                href="#"
                className="text-[#b7d5c7] hover:text-white transition-colors"
              >
                เงื่อนไขการใช้งาน
              </a>
              <a
                href="#"
                className="text-[#b7d5c7] hover:text-white transition-colors"
              >
                ศูนย์ความช่วยเหลือ
              </a>
            </div>
          </div>

          {/* คอลัมน์ 4: ติดต่อเรา */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-[#a8e6b1]">ติดต่อเรา</h4>
            <div className="space-y-2 text-[#b7d5c7]">
              <p>✉️ unicare@university.ac.th</p>
              <p>☎️ 02-123-4567</p>
              <p>📍 อาคารสำนักงานอธิการบดี ชั้น 2</p>
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
