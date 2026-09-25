"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Scale,
  Ban,
  Printer,
} from "lucide-react";
import UniCareLogo from "@/components/UniCareLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export default function TermsPage() {
  const { lang, t } = useLanguage();
  const isEn = lang === "en";

  const lastUpdated = isEn ? "September 25, 2026" : "25 กันยายน 2569";

  return (
    <div className="min-h-screen bg-[#f3f8f5] text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="h-[72px] bg-white border-b border-[#d4e6dc] sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl text-slate-600 hover:text-emerald-900 hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200"
            title={t("กลับสู่หน้าหลัก")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <UniCareLogo className="w-9 h-9" />
            <div>
              <h1 className="text-base font-extrabold text-emerald-950 leading-tight">
                UniCare · {t("เงื่อนไขการใช้งาน")}
              </h1>
              <p className="text-[11px] text-emerald-700 font-medium">
                {t("มหาวิทยาลัยวลัยลักษณ์")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t("พิมพ์เอกสาร")}</span>
          </button>
          <Link
            href="/privacy"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition"
          >
            {t("นโยบายความเป็นส่วนตัว")} &gt;
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Hero Banner Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#12443a] via-[#1b5e4f] to-[#257967] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold backdrop-blur-xs border border-white/20">
              <Scale className="w-3.5 h-3.5 text-emerald-200" />
              <span>
                {isEn
                  ? "Terms of Service"
                  : "ข้อตกลงและเงื่อนไขการให้บริการ (Terms of Service)"}
              </span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isEn
                ? "UniCare Terms and Conditions of Service"
                : "ข้อกำหนดและเงื่อนไขการใช้งานระบบ UniCare"}
            </h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
              {isEn
                ? "Welcome to UniCare, Walailak University. These Terms of Service govern your rights, duties, and responsibilities when using our campus grievance reporting and environmental care platform. Please read them thoroughly before accessing or using the system."
                : "ยินดีต้อนรับสู่ระบบ UniCare มหาวิทยาลัยวลัยลักษณ์ ข้อกำหนดนี้ระบุสิทธิ หน้าที่ และความรับผิดชอบในการใช้งานแพลตฟอร์มแจ้งเรื่องร้องเรียนและดูแลสิ่งแวดล้อม โปรดอ่านทำความเข้าใจอย่างละเอียดก่อนเข้าใช้งาน"}
            </p>
            <p className="text-[11px] text-emerald-200/80 pt-1">
              {isEn ? `Last updated: ${lastUpdated}` : `ปรับปรุงล่าสุด: ${lastUpdated}`}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-8 text-sm leading-relaxed text-slate-700">
          {/* Section 1 */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                1
              </span>
              <span>
                {isEn
                  ? "Introduction & System Purpose"
                  : "บทนำและวัตถุประสงค์ของระบบ"}
              </span>
            </h3>
            <p>
              {isEn ? (
                <>
                  The <strong>UniCare</strong> system was developed by Walailak
                  University as a centralized digital platform for students,
                  faculty, personnel, and campus community members to report
                  grievances, noise disturbances, environmental concerns, waste,
                  cleanliness, electricity, water supply, and campus
                  infrastructure issues effectively, quickly, and transparently.
                </>
              ) : (
                <>
                  ระบบ <strong>UniCare</strong> จัดทำขึ้นโดยมหาวิทยาลัยวลัยลักษณ์
                  เพื่อเป็นช่องทางศูนย์กลางให้นักศึกษา บุคลากร
                  และบุคคลในชุมชนมหาวิทยาลัย สามารถแจ้งเรื่องร้องเรียน ปัญหาเสียงรบกวน
                  ปัญหาสิ่งแวดล้อม ขยะ ความสะอาด ไฟฟ้า ประปา
                  และโครงสร้างพื้นฐานภายในเขตมหาวิทยาลัยได้อย่างมีประสิทธิภาพ รวดเร็ว
                  และโปร่งใส
                </>
              )}
            </p>
            <p>
              {isEn
                ? "By registering for or using this system, you acknowledge, accept, and agree to strictly comply with all terms and conditions set forth in this document."
                : "การลงทะเบียนหรือเข้าใช้งานระบบนี้ ถือว่าท่านได้รับทราบ ยอมรับ และตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขที่ระบุไว้ในเอกสารฉบับนี้ทุกประการ"}
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                2
              </span>
              <span>
                {isEn
                  ? "User Qualifications & Account Security"
                  : "คุณสมบัติของผู้ใช้งานและการรักษาความปลอดภัยบัญชี"}
              </span>
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                {isEn
                  ? "Users must provide truthful, accurate, and current information when registering and setting up an account."
                  : "ผู้ใช้งานต้องให้ข้อมูลที่เป็นความจริง ถูกต้อง และเป็นปัจจุบันในการลงทะเบียนเข้าใช้งาน"}
              </li>
              <li>
                {isEn
                  ? "Users are responsible for keeping their username, password, and account credentials confidential, and shall not disclose or permit any other person to use their account."
                  : "ผู้ใช้งานมีหน้าที่รักษาชื่อผู้ใช้ รหัสผ่าน และการเข้าถึงบัญชีของตนเองเป็นความลับ ห้ามมิให้เปิดเผยหรืออนุญาตให้บุคคลอื่นใช้บัญชีของตน"}
              </li>
              <li>
                {isEn
                  ? "If any unauthorized access or breach of security is detected, the user must notify system administrators immediately."
                  : "หากพบว่ามีการเข้าถึงบัญชีโดยไม่ได้รับอนุญาต ผู้ใช้งานต้องแจ้งให้ผู้ดูแลระบบทราบทันที"}
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                3
              </span>
              <span>
                {isEn
                  ? "Issue Reporting Standards & Evidence Attachment"
                  : "มาตรฐานการรายงานปัญหาและการแนบหลักฐาน"}
              </span>
            </h3>
            <p>
              {isEn
                ? "To ensure accurate, timely, and lawful operations by university personnel and related departments, users must adhere to the following guidelines:"
                : "เพื่อให้การปฏิบัติงานของเจ้าหน้าที่และหน่วยงานที่เกี่ยวข้องเป็นไปด้วยความถูกต้อง รวดเร็ว ผู้ใช้งานต้องปฏิบัติตามแนวทางต่อไปนี้:"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 mt-2">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isEn ? "Expected Best Practices" : "สิ่งที่พึงปฏิบัติ"}</span>
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  {isEn
                    ? "Clearly specify the exact campus location, attach authentic photos or audio clips of the actual incident, and specify realistic urgency levels based on facts."
                    : "ระบุตำแหน่งสถานที่ให้ชัดเจน แนบภาพถ่ายหรือคลิปเสียงที่เป็นเหตุการณ์จริง และระบุระดับความเร่งด่วนตามข้อเท็จจริง"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{isEn ? "Strict Prohibitions" : "ข้อห้ามที่เคร่งครัด"}</span>
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  {isEn
                    ? "Do not submit false reports, harass or defame others, or attach obscene, unlawful, or immoral material."
                    : "ห้ามรายงานข้อมูลเท็จ ห้ามกลั่นแกล้งผู้อื่น ห้ามแนบภาพลามกอนาจาร หรือเนื้อหาที่ละเมิดกฎหมายและศีลธรรมอันดี"}
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                4
              </span>
              <span>
                {isEn
                  ? "Reporter Protection & Anonymous Reporting"
                  : "การคุ้มครองผู้แจ้งและการรายงานแบบไม่เปิดเผยตัวตน"}
              </span>
            </h3>
            <p>
              {isEn ? (
                <>
                  The UniCare system features an{" "}
                  <strong>"Anonymous Report"</strong> option to safeguard reporter
                  privacy and security. When this option is chosen, the reporter's
                  full name, email, and telephone number are concealed from public
                  incident listings and restricted solely to authorized
                  system administrators for essential operational coordination.
                </>
              ) : (
                <>
                  ระบบ UniCare มีตัวเลือก{" "}
                  <strong>"รายงานแบบไม่เปิดเผยตัวตน (Anonymous Report)"</strong>{" "}
                  เพื่อปกป้องความเป็นส่วนตัวและความปลอดภัยของผู้แจ้ง เมื่อเลือกตัวเลือกนี้
                  ข้อมูลชื่อ-สกุล อีเมล และเบอร์โทรศัพท์ของผู้แจ้งจะไม่ถูกแสดงต่อสาธารณะ
                  และจะถูกจำกัดการเข้าถึงเฉพาะเจ้าหน้าที่ดูแลระบบที่จำเป็นต้องใช้เพื่อการประสานงานเท่านั้น
                </>
              )}
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                5
              </span>
              <span>
                {isEn
                  ? "Account Suspension & Disciplinary Penalties"
                  : "การระงับการใช้งานและบทลงโทษ"}
              </span>
            </h3>
            <p>
              {isEn
                ? "Walailak University reserves the right to issue warnings, suspend accounts, or revoke access if any of the following conduct is identified:"
                : "ทางมหาวิทยาลัยขอสงวนสิทธิ์ในการระงับบัญชี (Suspend) ตักเตือน หรือยกเลิกบัญชีผู้ใช้งาน หากตรวจพบการกระทำดังต่อไปนี้:"}
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>
                {isEn
                  ? "Reporting fabricated or false claims to incite panic or intentionally damage the reputation of others."
                  : "การรายงานข้อมูลเท็จเพื่อสร้างความตื่นตระหนก หรือเจตนาทำลายชื่อเสียงบุคคลอื่น"}
              </li>
              <li>
                {isEn
                  ? "Attempting to tamper with, exploit, breach, or compromise the UniCare system network and security architecture."
                  : "การพยายามแทรกแซง เจาะระบบ หรือทำลายระบบเครือข่ายและความปลอดภัยของ UniCare"}
              </li>
              <li>
                {isEn
                  ? "Using vulgar, abusive, threatening language or inappropriate behavior toward operating personnel."
                  : "การใช้ถ้อยคำหยาบคาย ข่มขู่ คุกคาม หรือแสดงพฤติกรรมที่ไม่เหมาะสมต่อเจ้าหน้าที่ผู้ปฏิบัติงาน"}
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                6
              </span>
              <span>
                {isEn ? "Amendments to Terms" : "การแก้ไขเปลี่ยนแปลงเงื่อนไข"}
              </span>
            </h3>
            <p>
              {isEn
                ? "The University may revise or update these terms and conditions periodically to reflect operational, legal, or technical changes. The latest revision date will always be stated in the header of this document. Continued use of the platform constitutes full acceptance of any revised terms."
                : "มหาวิทยาลัยอาจปรับปรุงหรือแก้ไขข้อกำหนดและเงื่อนไขนี้เป็นครั้งคราวตามความเหมาะสมและการเปลี่ยนแปลงของเทคโนโลยีหรือกฎหมาย โดยจะประกาศวันที่ปรับปรุงล่าสุดไว้ที่ส่วนหัวของเอกสาร การใช้งานระบบอย่างต่อเนื่องของผู้ใช้ถือเป็นการยอมรับเงื่อนไขที่มีการแก้ไขแล้ว"}
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                7
              </span>
              <span>
                {isEn ? "Contact & Inquiries" : "ช่องทางการติดต่อสอบถาม"}
              </span>
            </h3>
            <p>
              {isEn
                ? "If you have questions, feedback, or require assistance concerning these Terms of Service, please contact us at:"
                : "หากท่านมีคำถาม ข้อเสนอแนะ หรือต้องการความช่วยเหลือเกี่ยวกับข้อกำหนดการใช้งาน สามารถติดต่อได้ที่:"}
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">
                {isEn
                  ? "UniCare Service & Coordination Center · Walailak University"
                  : "ศูนย์บริการและประสานงาน UniCare มหาวิทยาลัยวลัยลักษณ์"}
              </p>
              <p>
                {isEn
                  ? "Address: Administration Building, 2nd Floor, Walailak University, Tha Sala, Nakhon Si Thammarat 80160"
                  : "ที่อยู่: อาคารบริหาร ชั้น 2 มหาวิทยาลัยวลัยลักษณ์ อ.ท่าศาลา จ.นครศรีธรรมราช 80160"}
              </p>
              <p>
                {isEn
                  ? "Email: unicare@university.ac.th | Tel: 075-673-000"
                  : "อีเมล: unicare@university.ac.th | โทรศัพท์: 075-673-000"}
              </p>
            </div>
          </section>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isEn ? "Back to Home" : "กลับสู่หน้าแรก"}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
            >
              {isEn ? "Read Privacy Policy" : "อ่านนโยบายความเป็นส่วนตัว"}
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
            >
              {isEn ? "Go to Register" : "ไปหน้าลงทะเบียน"}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-[#d4e6dc] bg-white text-center text-xs text-slate-400">
        {isEn
          ? "© 2026 UniCare · Walailak University. All rights reserved."
          : "© 2026 UniCare · มหาวิทยาลัยวลัยลักษณ์. All rights reserved."}
      </footer>
    </div>
  );
}
