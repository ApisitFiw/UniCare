"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "pill" | "icon";
}

/**
 * ปุ่มเปลี่ยนภาษา TH / EN (วางข้างกระดิ่ง และส่วนหัวของหน้าต่างๆ)
 * เมื่อกดจะสลับภาษาระหว่างภาษาไทย (TH) และภาษาอังกฤษ (EN) พร้อมอัปเดตทุกหน้าทันที
 */
export default function LanguageSwitcher({
  className = "",
  variant = "pill",
}: LanguageSwitcherProps) {
  const { lang, toggleLang, setLang } = useLanguage();

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleLang}
        title={lang === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
        className={`relative h-9 px-2.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 border border-slate-200/80 transition cursor-pointer shrink-0 ${className}`}
        aria-label="เปลี่ยนภาษา / Switch Language"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-700" />
        <span className="uppercase text-[11px] font-extrabold">{lang}</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-full bg-slate-100/90 border border-slate-200/80 p-0.5 shadow-2xs shrink-0 select-none ${className}`}
      role="group"
      aria-label="เปลี่ยนภาษา / Language Selector"
    >
      <button
        type="button"
        onClick={() => setLang("th")}
        title="ภาษาไทย"
        className={`px-2 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
          lang === "th"
            ? "bg-emerald-700 text-white shadow-xs"
            : "text-slate-600 hover:text-emerald-800"
        }`}
      >
        TH
      </button>

      <button
        type="button"
        onClick={() => setLang("en")}
        title="English"
        className={`px-2 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
          lang === "en"
            ? "bg-emerald-700 text-white shadow-xs"
            : "text-slate-600 hover:text-emerald-800"
        }`}
      >
        EN
      </button>
    </div>
  );
}
