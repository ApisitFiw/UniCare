"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  FileText,
  MessageCircle,
  Paperclip,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import UserSidebar from "@/components/UserSidebar";
import Header from "@/components/Header";

type Category =
  | "ทั้งหมด"
  | "บัญชีผู้ใช้"
  | "การแจ้งปัญหา"
  | "หลักฐาน"
  | "ติดตามสถานะ"
  | "ความเป็นส่วนตัว";

interface FAQItem {
  id: number;
  category: Exclude<Category, "ทั้งหมด">;
  question: string;
  answer: string;
}

const categories: {
  label: Category;
  icon: typeof CircleHelp;
}[] = [
  {
    label: "ทั้งหมด",
    icon: CircleHelp,
  },
  {
    label: "บัญชีผู้ใช้",
    icon: UserRound,
  },
  {
    label: "การแจ้งปัญหา",
    icon: FileText,
  },
  {
    label: "หลักฐาน",
    icon: Paperclip,
  },
  {
    label: "ติดตามสถานะ",
    icon: Bell,
  },
  {
    label: "ความเป็นส่วนตัว",
    icon: ShieldCheck,
  },
];

const faqItems: FAQItem[] = [
  {
    id: 1,
    category: "บัญชีผู้ใช้",
    question: "ต้องสมัครสมาชิกก่อนแจ้งปัญหาหรือไม่?",
    answer:
      "ผู้ใช้งานต้องสมัครสมาชิกและเข้าสู่ระบบก่อนส่งคำร้อง เพื่อให้ระบบสามารถบันทึกคำร้อง แจ้งเตือนความคืบหน้า และแสดงประวัติการแจ้งปัญหาของคุณได้",
  },
  {
    id: 2,
    category: "บัญชีผู้ใช้",
    question: "หากลืมรหัสผ่านต้องทำอย่างไร?",
    answer:
      "ในระบบทดลองสามารถติดต่อผู้ดูแลระบบเพื่อขอเปลี่ยนรหัสผ่านได้ เมื่อเชื่อมต่อระบบจริงจะเพิ่มระบบยืนยันตัวตนและการตั้งรหัสผ่านใหม่",
  },
  {
    id: 3,
    category: "บัญชีผู้ใช้",
    question: "สามารถแก้ไขข้อมูลบัญชีได้หรือไม่?",
    answer:
      "สามารถแก้ไขชื่อ อีเมล และเบอร์โทรศัพท์ได้จากเมนูจัดการบัญชี เมื่อบันทึกแล้วข้อมูลจะแสดงในส่วนบัญชีผู้ใช้งานของระบบ",
  },
  {
    id: 4,
    category: "บัญชีผู้ใช้",
    question: "ทำไมจึงไม่สามารถเข้าสู่ระบบได้?",
    answer:
      "กรุณาตรวจสอบอีเมล รหัสผ่าน และประเภทบัญชีว่าเลือกเป็น User ถูกต้องหรือไม่ หากบัญชีถูกปิดใช้งานหรือลบแล้ว กรุณาติดต่อผู้ดูแลระบบ",
  },
  {
    id: 5,
    category: "การแจ้งปัญหา",
    question: "สามารถแจ้งปัญหาประเภทใดได้บ้าง?",
    answer:
      "สามารถแจ้งปัญหาเสียงรบกวน ขยะ น้ำเสีย กลิ่นไม่พึงประสงค์ มลพิษ และปัญหาด้านสิ่งแวดล้อมที่เกิดขึ้นภายในมหาวิทยาลัย",
  },
  {
    id: 6,
    category: "การแจ้งปัญหา",
    question: "ต้องระบุตำแหน่งที่เกิดเหตุหรือไม่?",
    answer:
      "ควรระบุอาคาร พื้นที่ หรือจุดเกิดเหตุให้ชัดเจน เพื่อช่วยให้เจ้าหน้าที่เข้าตรวจสอบและดำเนินการได้รวดเร็วขึ้น",
  },
  {
    id: 7,
    category: "การแจ้งปัญหา",
    question: "สามารถแจ้งปัญหาโดยไม่เปิดเผยชื่อได้หรือไม่?",
    answer:
      "สามารถเลือกแจ้งแบบไม่เปิดเผยชื่อได้ ชื่อของผู้แจ้งจะไม่ปรากฏในรายละเอียดคำร้องทั่วไป แต่ข้อมูลบัญชีอาจยังถูกเก็บไว้สำหรับการตรวจสอบตามนโยบายของระบบ",
  },
  {
    id: 8,
    category: "การแจ้งปัญหา",
    question: "สามารถแก้ไขหรือยกเลิกคำร้องได้หรือไม่?",
    answer:
      "สามารถแก้ไขหรือยกเลิกคำร้องได้ในช่วงที่คำร้องยังอยู่ในสถานะรอรับเรื่อง หลังจากเจ้าหน้าที่รับเรื่องแล้วอาจไม่สามารถแก้ไขข้อมูลเดิมได้",
  },
  {
    id: 9,
    category: "การแจ้งปัญหา",
    question: "กรณีฉุกเฉินควรแจ้งผ่านระบบหรือไม่?",
    answer:
      "หากเป็นเหตุฉุกเฉินหรือมีอันตรายต่อชีวิตและทรัพย์สิน ควรติดต่อหน่วยรักษาความปลอดภัยหรือหมายเลขฉุกเฉินของมหาวิทยาลัยทันที",
  },
  {
    id: 10,
    category: "หลักฐาน",
    question: "สามารถแนบหลักฐานประเภทใดได้บ้าง?",
    answer:
      "สามารถแนบรูปภาพ ไฟล์เสียง วิดีโอขนาดสั้น หรือเอกสารที่เกี่ยวข้องกับปัญหาได้ ตามชนิดและขนาดไฟล์ที่ระบบรองรับ",
  },
  {
    id: 11,
    category: "หลักฐาน",
    question: "จำเป็นต้องแนบหลักฐานทุกครั้งหรือไม่?",
    answer:
      "ไม่จำเป็น แต่หลักฐานที่ชัดเจนจะช่วยให้เจ้าหน้าที่ตรวจสอบข้อเท็จจริงและประเมินระดับความเร่งด่วนได้ง่ายขึ้น",
  },
  {
    id: 12,
    category: "หลักฐาน",
    question: "หลักฐานที่แนบควรมีลักษณะอย่างไร?",
    answer:
      "ควรเป็นหลักฐานที่เกี่ยวข้องกับเหตุการณ์โดยตรง มองเห็นหรือได้ยินปัญหาอย่างชัดเจน และไม่เปิดเผยข้อมูลส่วนตัวของผู้อื่นโดยไม่จำเป็น",
  },
  {
    id: 13,
    category: "ติดตามสถานะ",
    question: "ตรวจสอบสถานะคำร้องได้จากที่ใด?",
    answer:
      "เลือกเมนูรายการของฉันจากแถบด้านซ้าย จากนั้นเลือกคำร้องที่ต้องการเพื่อตรวจสอบสถานะ รายละเอียด และประวัติการดำเนินงาน",
  },
  {
    id: 14,
    category: "ติดตามสถานะ",
    question: "สถานะรอรับเรื่องหมายถึงอะไร?",
    answer:
      "หมายถึงระบบได้รับคำร้องแล้ว แต่คำร้องยังอยู่ระหว่างรอเจ้าหน้าที่ตรวจสอบข้อมูลและพิจารณารับเรื่อง",
  },
  {
    id: 15,
    category: "ติดตามสถานะ",
    question: "สถานะกำลังดำเนินการหมายถึงอะไร?",
    answer:
      "หมายถึงเจ้าหน้าที่ได้รับเรื่องแล้ว และกำลังตรวจสอบพื้นที่ ประสานงาน หรือดำเนินการแก้ไขปัญหาตามขั้นตอน",
  },
  {
    id: 16,
    category: "ติดตามสถานะ",
    question: "ระบบจะแจ้งเตือนเมื่อสถานะเปลี่ยนหรือไม่?",
    answer:
      "หากเปิดการแจ้งเตือนสถานะคำร้อง ระบบจะแสดงการแจ้งเตือนเมื่อเจ้าหน้าที่รับเรื่อง ปฏิเสธคำร้อง อัปเดตสถานะ หรือดำเนินการเสร็จสิ้น",
  },
  {
    id: 17,
    category: "ติดตามสถานะ",
    question: "หากคำร้องถูกปฏิเสธจะทราบเหตุผลหรือไม่?",
    answer:
      "เจ้าหน้าที่จะระบุเหตุผลประกอบ เช่น ข้อมูลไม่เพียงพอ หลักฐานไม่ชัดเจน หรือคำร้องอยู่นอกขอบเขตที่ระบบรับผิดชอบ",
  },
  {
    id: 18,
    category: "ความเป็นส่วนตัว",
    question: "ใครสามารถมองเห็นข้อมูลผู้แจ้งได้?",
    answer:
      "ข้อมูลบัญชีสามารถเข้าถึงได้เฉพาะผู้ใช้งาน เจ้าหน้าที่ที่ได้รับสิทธิ์ และผู้ดูแลระบบที่เกี่ยวข้องกับการตรวจสอบคำร้อง",
  },
  {
    id: 19,
    category: "ความเป็นส่วนตัว",
    question: "ข้อมูลหลักฐานถูกนำไปใช้อย่างไร?",
    answer:
      "หลักฐานจะใช้สำหรับตรวจสอบเหตุการณ์ ประเมินปัญหา และประกอบการดำเนินงานของเจ้าหน้าที่เท่านั้น",
  },
  {
    id: 20,
    category: "ความเป็นส่วนตัว",
    question: "สามารถขอลบข้อมูลหรือบัญชีได้หรือไม่?",
    answer:
      "สามารถลบบัญชีได้จากหน้าจัดการบัญชี เมื่อยืนยันการลบบัญชีแล้ว ระบบจะปิดการใช้งานบัญชีและออกจากระบบทันที โดยสามารถติดต่อผู้ดูแลระบบเพื่อขอกู้คืนบัญชีได้",
  },
];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<Category>("ทั้งหมด");

  const [openItemId, setOpenItemId] = useState<number | null>(1);

  const filteredFAQ =
    selectedCategory === "ทั้งหมด"
      ? faqItems
      : faqItems.filter((item) => item.category === selectedCategory);

  function selectCategory(category: Category) {
    setSelectedCategory(category);
    setOpenItemId(null);
  }

  function toggleQuestion(id: number) {
    setOpenItemId((currentId) => (currentId === id ? null : id));
  }

  return (
    <div className="flex min-h-screen items-start bg-[#f4f8f6] text-slate-800">
      
      <div className="min-h-screen min-w-0 flex-1">
        <Header
          title="คำถามที่พบบ่อย"
          subtitle="คำตอบและวิธีใช้งานระบบ UniCare"
          role="USER"
        />

        <main className="min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            {/* Banner ด้านบน */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#197763] via-[#146653] to-[#0d4e40] px-5 py-6 text-white shadow-[0_15px_35px_rgba(15,80,60,0.16)] sm:px-7 sm:py-7">
              {/* วงกลมตกแต่ง */}
              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-28 right-28 h-56 w-56 rounded-full bg-emerald-300/10" />

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                    <CircleHelp className="h-6 w-6" />
                  </span>

                  <div className="min-w-0">
                    <h1 className="text-xl font-extrabold leading-tight sm:text-2xl">
                      มีข้อสงสัยเกี่ยวกับ UniCare?
                    </h1>

                    <p className="mt-2 max-w-3xl text-xs leading-6 text-emerald-100">
                      เลือกหมวดหมู่และกดคำถามเพื่อดูคำตอบเกี่ยวกับบัญชีผู้ใช้
                      การแจ้งปัญหา หลักฐาน การติดตามสถานะ
                      และความเป็นส่วนตัว
                    </p>
                  </div>
                </div>

                <div className="w-full shrink-0 rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-center backdrop-blur-sm sm:w-auto">
                  <p className="text-2xl font-extrabold">{faqItems.length}</p>
                  <p className="mt-0.5 text-[10px] text-emerald-100">
                    คำถามทั้งหมด
                  </p>
                </div>
              </div>
            </section>

            {/* หมวดหมู่คำถาม */}
            <section className="mt-7">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">
                    หมวดหมู่คำถาม
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    เลือกหมวดหมู่ที่ต้องการดู
                  </p>
                </div>

                {selectedCategory !== "ทั้งหมด" && (
                  <button
                    type="button"
                    onClick={() => selectCategory("ทั้งหมด")}
                    className="shrink-0 text-xs font-semibold text-emerald-700 transition hover:text-emerald-900 hover:underline"
                  >
                    แสดงทั้งหมด
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const active = selectedCategory === category.label;

                  const count =
                    category.label === "ทั้งหมด"
                      ? faqItems.length
                      : faqItems.filter(
                          (item) => item.category === category.label,
                        ).length;

                  return (
                    <button
                      key={category.label}
                      type="button"
                      onClick={() => selectCategory(category.label)}
                      aria-pressed={active}
                      className={`min-w-0 rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm ring-2 ring-emerald-100"
                          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            active
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            active
                              ? "bg-white text-emerald-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {count}
                        </span>
                      </div>

                      <p className="mt-3 truncate text-xs font-bold">
                        {category.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* รายการคำถาม */}
            <section className="mt-8">
              <div className="mb-4">
                <h2 className="text-lg font-extrabold text-slate-800">
                  {selectedCategory === "ทั้งหมด"
                    ? "คำถามทั้งหมด"
                    : selectedCategory}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  พบ {filteredFAQ.length} คำถาม
                </p>
              </div>

              <div className="space-y-3">
                {filteredFAQ.map((item) => {
                  const isOpen = openItemId === item.id;

                  return (
                    <article
                      key={item.id}
                      className={`overflow-hidden rounded-2xl border bg-white transition ${
                        isOpen
                          ? "border-emerald-300 shadow-[0_10px_30px_rgba(15,90,65,0.08)]"
                          : "border-slate-200 hover:border-emerald-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleQuestion(item.id)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${item.id}`}
                        className="flex w-full items-center gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isOpen
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <CircleHelp className="h-4 w-4" />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="mb-1 block text-[10px] font-bold text-emerald-700">
                            {item.category}
                          </span>

                          <span className="block text-sm font-bold leading-6 text-slate-800">
                            {item.question}
                          </span>
                        </span>

                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-emerald-700" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div
                          id={`faq-answer-${item.id}`}
                          className="border-t border-slate-100 bg-emerald-50/30 px-4 py-4 sm:px-5 sm:pl-[76px]"
                        >
                          <p className="text-sm leading-7 text-slate-600">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            {/* ติดต่อเรา */}
            <section className="mb-4 mt-8 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                    <MessageCircle className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <h2 className="text-sm font-extrabold text-slate-800">
                      ยังไม่พบคำตอบที่ต้องการ?
                    </h2>

                    <p className="mt-1 text-xs leading-6 text-slate-500">
                      ติดต่อทีมงาน UniCare เพื่อสอบถามข้อมูลเพิ่มเติม
                      หรือแจ้งปัญหาเกี่ยวกับการใช้งานระบบ
                    </p>
                  </div>
                </div>

                <Link
                  href="/user/dashboard?tab=contact"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-bold text-white transition hover:bg-emerald-800"
                >
                  <MessageCircle className="h-4 w-4" />
                  ติดต่อเรา
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}