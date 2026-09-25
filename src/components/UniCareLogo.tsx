"use client";

import React from "react";
import { Sprout } from "lucide-react";

interface UniCareLogoProps {
  className?: string;
  iconClassName?: string;
  variant?: "dark" | "light";
}

/**
 * โลโก้ UniCare Sprout จาก GitHub Repository (ApisitFiw/UniCare)
 * - variant="dark": สไตล์พื้นหลังเข้ม (Sidebar, หน้า Login ฝั่งซ้าย, หน้าสมัครสมาชิกฝั่งซ้าย)
 *   วงกลมโปร่งแสง border-white/20 bg-white/15 ไอคอนสี lime-200
 * - variant="light": สไตล์พื้นหลังสว่าง (Navbar หน้าหลัก, Dashboard, Terms, Privacy, Mobile)
 *   วงกลม bg-emerald-100 border-emerald-200/60 ไอคอนสี emerald-700
 */
export default function UniCareLogo({
  className = "",
  iconClassName = "",
  variant = "light",
}: UniCareLogoProps) {
  if (variant === "dark") {
    return (
      <span
        className={`flex items-center justify-center rounded-full border border-white/20 bg-white/15 text-lime-200 shrink-0 ${
          className || "h-11 w-11"
        }`}
        aria-label="UniCare Logo"
      >
        <Sprout className={iconClassName || "h-5 w-5"} />
      </span>
    );
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200/60 shadow-2xs shrink-0 ${
        className || "h-10 w-10"
      }`}
      aria-label="UniCare Logo"
    >
      <Sprout className={iconClassName || "h-5 w-5"} />
    </span>
  );
}
