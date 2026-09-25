'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'
import NotificationDropdown from '@/components/NotificationDropdown'
import { getDemoSession } from '@/lib/demoAuth'

interface AccountBarProps {
  userName?: string
  role?: 'ADMIN' | 'USER'
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`;
  return name.trim().slice(0, 2) || "U";
}

export default function AccountBar({ userName, role }: AccountBarProps) {
  const [currentName, setCurrentName] = useState<string>(userName || "");
  const [currentRole, setCurrentRole] = useState<"ADMIN" | "USER">(role || "USER");
  const [currentEmail, setCurrentEmail] = useState<string>("");

  useEffect(() => {
    const syncSession = () => {
      const session = getDemoSession();
      if (session) {
        setCurrentName(session.name || userName || (session.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้งาน"));
        setCurrentRole(session.role === "admin" ? "ADMIN" : "USER");
        if (session.email) {
          setCurrentEmail(session.email);
        }
      } else {
        setCurrentName(userName || (role === "ADMIN" ? "นัฐกรณ์" : "กิตติภูมิ"));
        setCurrentRole(role || "USER");
        setCurrentEmail(role === "ADMIN" ? "Natthakon030948@gmail.com" : "kittipoom@example.com");
      }
    };

    syncSession();

    window.addEventListener("storage", syncSession);
    window.addEventListener("unicare-profile-updated", syncSession);
    window.addEventListener("focus", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("unicare-profile-updated", syncSession);
      window.removeEventListener("focus", syncSession);
    };
  }, [userName, role]);

  // Active user goes to /user/profile, Active Admin goes to /admin/profile
  const profileHref = currentRole === "ADMIN" ? "/admin/profile" : "/user/profile";
  const displayName = currentName || (currentRole === "ADMIN" ? "ผู้ดูแลระบบ" : "ผู้ใช้งาน");
  const initials = getInitials(displayName);

  return (
    <div className="flex items-center space-x-3 shrink-0">
      {/* Notification Dropdown Bell */}
      <NotificationDropdown
        role={currentRole}
        userName={displayName}
        userEmail={currentEmail}
      />

      {/* User / Admin Profile Chip: Links to Account Management of the active user */}
      <Link
        href={profileHref}
        title={`ไปยังหน้าบัญชีของฉัน (${displayName})`}
        className="flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-emerald-500 px-3 py-1.5 rounded-full text-xs shadow-xs transition cursor-pointer group"
      >
        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 group-hover:scale-105 transition-transform">
          {initials || <User className="w-3.5 h-3.5" />}
        </div>
        <span className="font-semibold text-slate-800 hidden sm:inline-block">
          {displayName}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide text-white shrink-0 ${
            currentRole === "ADMIN" ? "bg-[#1b5e4a]" : "bg-[#217972]"
          }`}
        >
          {currentRole}
        </span>
      </Link>
    </div>
  );
}
