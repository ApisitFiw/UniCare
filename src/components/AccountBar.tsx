"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { User } from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { supabase } from "@/lib/supabaseClient";

interface AccountBarProps {
  userName?: string;
  role?: "ADMIN" | "USER";
}

interface CachedAccount {
  name: string;
  email: string;
  avatar: string;
  role: "ADMIN" | "USER";
}

type ProfileRecord = Record<string, unknown>;

const ACCOUNT_CACHE_KEY = "unicare-account-bar";

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readCachedAccount(): CachedAccount | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = localStorage.getItem(
      ACCOUNT_CACHE_KEY,
    );

    if (!value) {
      return null;
    }

    return JSON.parse(value) as CachedAccount;
  } catch {
    return null;
  }
}

function saveCachedAccount(account: CachedAccount) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      ACCOUNT_CACHE_KEY,
      JSON.stringify(account),
    );
  } catch {
    // ไม่ต้องหยุดการทำงานหาก localStorage ใช้งานไม่ได้
  }
}

function getFullName(
  profile: ProfileRecord | null,
  metadata: ProfileRecord,
) {
  const prefix = cleanText(profile?.prefix);

  const firstName =
    cleanText(profile?.first_name) ||
    cleanText(profile?.firstName);

  const lastName =
    cleanText(profile?.last_name) ||
    cleanText(profile?.lastName);

  const combinedName = [
    prefix,
    firstName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    cleanText(profile?.full_name) ||
    cleanText(profile?.display_name) ||
    cleanText(profile?.name) ||
    combinedName ||
    cleanText(metadata.full_name) ||
    cleanText(metadata.display_name) ||
    cleanText(metadata.name) ||
    cleanText(metadata.username)
  );
}

export default function AccountBar({
  userName,
  role = "USER",
}: AccountBarProps) {
  /*
    ค่าเริ่มต้นต้องเหมือนกันระหว่าง Server กับ Browser
    ห้ามอ่าน localStorage ใน useState
  */
  const initialName =
    userName?.trim() ||
    (role === "ADMIN"
      ? "ผู้ดูแลระบบ"
      : "ผู้ใช้งาน");

  const [currentName, setCurrentName] =
    useState(initialName);

  const [currentRole, setCurrentRole] =
    useState<"ADMIN" | "USER">(role);

  const [currentEmail, setCurrentEmail] =
    useState("");

  const [currentAvatar, setCurrentAvatar] =
    useState("");

  const loadCurrentAccount =
    useCallback(async () => {
      const cached = readCachedAccount();

      /*
        เริ่มจากข้อมูลที่หน้าเป็นผู้ส่งมา
        หากไม่มีจึงใช้ข้อมูลที่เคยบันทึกไว้
      */
      let resolvedName =
        userName?.trim() ||
        cached?.name ||
        initialName;

      let resolvedEmail =
        cached?.email || "";

      let resolvedAvatar =
        cached?.avatar || "";

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const email = user.email?.trim() || "";

          const metadata = (
            user.user_metadata || {}
          ) as ProfileRecord;

          /*
            พยายามอ่านตาราง profiles
            หากอ่านไม่ได้ ระบบยังใช้ Props หรือ Cache ต่อได้
          */
          const { data: profileData } =
            await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .maybeSingle();

          const profile = (
            profileData || null
          ) as ProfileRecord | null;

          const profileName = getFullName(
            profile,
            metadata,
          );

          resolvedName =
            userName?.trim() ||
            profileName ||
            cached?.name ||
            email.split("@")[0] ||
            initialName;

          resolvedEmail =
            cleanText(profile?.email) ||
            email ||
            cached?.email ||
            "";

          resolvedAvatar =
            cleanText(profile?.avatar_url) ||
            cleanText(profile?.avatar) ||
            cleanText(metadata.avatar_url) ||
            cleanText(metadata.picture) ||
            cached?.avatar ||
            "";
        }
      } catch (error) {
        console.warn(
          "ไม่สามารถอ่านบัญชีจาก Supabase ได้:",
          error,
        );
      }

      /*
        ยึด Role จากหน้าปัจจุบันเสมอ
        ป้องกันหน้า Admin ถูกเปลี่ยนเป็น USER
      */
      const resolvedRole = role;

      setCurrentName(resolvedName);
      setCurrentRole(resolvedRole);
      setCurrentEmail(resolvedEmail);
      setCurrentAvatar(resolvedAvatar);

      saveCachedAccount({
        name: resolvedName,
        email: resolvedEmail,
        avatar: resolvedAvatar,
        role: resolvedRole,
      });
    }, [initialName, role, userName]);

  useEffect(() => {
    loadCurrentAccount();
  }, [loadCurrentAccount]);

  useEffect(() => {
    function refreshAccount() {
      loadCurrentAccount();
    }

    window.addEventListener(
      "unicare-profile-updated",
      refreshAccount,
    );

    window.addEventListener(
      "storage",
      refreshAccount,
    );

    window.addEventListener(
      "focus",
      refreshAccount,
    );

    return () => {
      window.removeEventListener(
        "unicare-profile-updated",
        refreshAccount,
      );

      window.removeEventListener(
        "storage",
        refreshAccount,
      );

      window.removeEventListener(
        "focus",
        refreshAccount,
      );
    };
  }, [loadCurrentAccount]);

  const profileHref =
    currentRole === "ADMIN"
      ? "/admin/profile"
      : "/user/profile";

  const accountTitle =
    currentRole === "ADMIN"
      ? `ไปยังหน้าบัญชีผู้ดูแลระบบ (${currentName})`
      : `ไปยังหน้าบัญชีของฉัน (${currentName})`;

  const initialLetter =
    currentName.trim().charAt(0) ||
    (currentRole === "ADMIN" ? "A" : "U");

  return (
    <div className="flex shrink-0 items-center gap-3">
      <LanguageSwitcher />

      <NotificationDropdown
        role={currentRole}
        userName={currentName}
        userEmail={currentEmail}
      />

      <Link
        href={profileHref}
        title={accountTitle}
        className="group flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs shadow-xs transition hover:border-emerald-500 hover:bg-slate-100"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-200/80 bg-emerald-100 text-[10px] font-bold text-emerald-800 transition-transform group-hover:scale-105">
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={`รูปโปรไฟล์ของ ${currentName}`}
              className="h-full w-full object-cover"
            />
          ) : currentName ? (
            <span>{initialLetter}</span>
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>

        <span className="hidden max-w-[180px] truncate font-semibold text-slate-800 sm:inline-block">
          {currentName}
        </span>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white ${
            currentRole === "ADMIN"
              ? "bg-[#1b5e4a]"
              : "bg-[#217972]"
          }`}
        >
          {currentRole}
        </span>
      </Link>
    </div>
  );
}