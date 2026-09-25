"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Database,
  EyeOff,
  UserCheck,
  FileText,
  Printer,
  Scale,
} from "lucide-react";
import UniCareLogo from "@/components/UniCareLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPage() {
  const { t } = useLanguage();
  const lastUpdated = "25 กันยายน 2569";

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
                UniCare · {t("นโยบายความเป็นส่วนตัว")}
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
            href="/terms"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition"
          >
            {t("เงื่อนไขการใช้งาน")} &gt;
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
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
              <span>การคุ้มครองข้อมูลส่วนบุคคล (PDPA Compliance)</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              นโยบายการคุ้มครองข้อมูลส่วนบุคคล (Privacy Policy)
            </h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
              มหาวิทยาลัยวลัยลักษณ์ให้ความสำคัญสูงสุดต่อการคุ้มครองสิทธิและความเป็นส่วนตัวของเจ้าของข้อมูล
              เอกสารฉบับนี้อธิบายถึงประเภทของข้อมูล วิธีการเก็บรวบรวม วัตถุประสงค์
              และการรักษาความปลอดภัยของข้อมูลในระบบ UniCare
            </p>
            <p className="text-[11px] text-emerald-200/80 pt-1">
              ปรับปรุงล่าสุด: {lastUpdated}
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
              <span>ข้อมูลที่เราเก็บรวบรวม</span>
            </h3>
            <p>
              เพื่อให้บริการระบบแจ้งปัญหาและติดตามผลเป็นไปอย่างสมบูรณ์ ระบบ UniCare อาจจัดเก็บข้อมูลต่อไปนี้:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 mt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>ข้อมูลบัญชีผู้ใช้งาน</span>
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  คำนำหน้า, ชื่อ-นามสกุล, ชื่อเล่น, เบอร์โทรศัพท์, อีเมล, วันเดือนปีเกิด,
                  และข้อมูลที่พักอาศัย/หอพักภายในมหาวิทยาลัย
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>ข้อมูลการรายงานปัญหา</span>
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  หัวข้อเรื่อง, หมวดหมู่ปัญหา, พิกัดสถานที่ (GPS/แผนที่), ภาพถ่ายหรือไฟล์แนบหลักฐาน,
                  และบันทึกการประเมินความพึงพอใจ
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                2
              </span>
              <span>วัตถุประสงค์ในการเก็บรวบรวมและใช้ข้อมูล</span>
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>เพื่อใช้ในการยืนยันตัวตนและการเข้าสู่ระบบอย่างปลอดภัย</li>
              <li>เพื่อส่งต่อข้อมูลเรื่องร้องเรียนให้แก่หน่วยงานหรือเจ้าหน้าที่ที่รับผิดชอบโดยตรง</li>
              <li>เพื่อส่งการแจ้งเตือนสถานะความคืบหน้าของเรื่องร้องเรียนไปยังผู้แจ้ง</li>
              <li>เพื่อการวิเคราะห์สถิติความถี่ของปัญหาในพื้นที่เสี่ยง และวางแผนปรับปรุงสภาพแวดล้อมของมหาวิทยาลัย</li>
              <li>เพื่อประเมินประสิทธิภาพการทำงานของเจ้าหน้าที่และยกระดับคุณภาพการให้บริการ</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                3
              </span>
              <span>นโยบายการรายงานแบบไม่เปิดเผยตัวตน (Anonymous Privacy)</span>
            </h3>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <EyeOff className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>การคุ้มครองสิทธิผู้แจ้งที่ไม่ประสงค์เปิดเผยชื่อ</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                เมื่อผู้ใช้งานเลือกฟังก์ชัน <strong>"ไม่ระบุตัวตน"</strong> ในขั้นตอนการแจ้งปัญหา
                ระบบจะซ่อนชื่อผู้ใช้งาน รูปโปรไฟล์ และข้อมูลการติดต่อของผู้แจ้งในหน้ารายงานสาธารณะ
                โดยจะแสดงผลเป็น <em>"ผู้แจ้งไม่ประสงค์ออกนาม"</em> เจ้าหน้าที่ผู้ปฏิบัติงานหน้างานจะเห็นเพียงข้อมูลปัญหา พิกัด และภาพถ่ายหลักฐานเท่านั้น
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                4
              </span>
              <span>การรักษาความปลอดภัยของข้อมูล (Security Standards)</span>
            </h3>
            <p>
              เราใช้มาตรการรักษาความปลอดภัยทางเทคนิคและการบริหารจัดการที่เข้มงวดตามมาตรฐาน
              เพื่อป้องกันมิให้ข้อมูลส่วนบุคคลของท่านสูญหาย ถูกเข้าถึงโดยมิชอบ หรือถูกเปิดเผยโดยไม่ได้รับอนุญาต:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>การเข้ารหัสข้อมูลขณะส่งผ่านเครือข่ายด้วยมาตรฐาน SSL/TLS</li>
              <li>การควบคุมสิทธิ์การเข้าถึงข้อมูลตามบทบาท (Role-Based Access Control) แยกสิทธิ์ Admin และ User อย่างชัดเจน</li>
              <li>การบันทึกประวัติการเข้าถึงและการดำเนินงาน (Audit Log) เพื่อความโปร่งใสและตรวจสอบย้อนหลังได้</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                5
              </span>
              <span>สิทธิของเจ้าของข้อมูลส่วนบุคคล (Your Rights)</span>
            </h3>
            <p>
              ภายใต้พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ท่านมีสิทธิในการดำเนินการดังต่อไปนี้:
            </p>
            <div className="grid gap-2 sm:grid-cols-2 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong>สิทธิในการเข้าถึงและขอรับสำเนา:</strong> สามารถตรวจสอบและดูข้อมูลของตนเองในหน้า "จัดการบัญชี" ได้ตลอดเวลา
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong>สิทธิในการแก้ไขข้อมูล:</strong> สามารถแก้ไขข้อมูลส่วนบุคคล เบอร์โทร และรูปภาพให้ถูกต้องเป็นปัจจุบันได้ด้วยตนเอง
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong>สิทธิในการลบหรือทำลาย:</strong> สามารถยื่นคำร้องขอลบบัญชีผู้ใช้งานและข้อมูลประวัติได้
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong>สิทธิในการระงับการใช้ข้อมูล:</strong> สามารถตั้งค่าปิดการแจ้งเตือนหรือจำกัดการแสดงชื่อในรายงานได้
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                6
              </span>
              <span>การติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)</span>
            </h3>
            <p>
              หากท่านมีข้อสงสัยเกี่ยวกับการคุ้มครองข้อมูลส่วนบุคคล หรือประสงค์จะใช้สิทธิของเจ้าของข้อมูล สามารถติดต่อเราได้ที่:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">
                เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (Data Protection Officer)
              </p>
              <p>หน่วยงาน: ศูนย์เทคโนโลยีดิจิทัล มหาวิทยาลัยวลัยลักษณ์</p>
              <p>อีเมล: dpo@university.ac.th | โทรศัพท์: 075-673-100</p>
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
            <span>กลับสู่หน้าแรก</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/terms"
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
            >
              อ่านเงื่อนไขการใช้งาน
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
            >
              ไปหน้าลงทะเบียน
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-[#d4e6dc] bg-white text-center text-xs text-slate-400">
        © 2026 UniCare · มหาวิทยาลัยวลัยลักษณ์. All rights reserved.
      </footer>
    </div>
  );
}
