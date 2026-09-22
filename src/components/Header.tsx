'use client'

import Link from 'next/link'
import { User } from 'lucide-react'
import NotificationDropdown from '@/components/NotificationDropdown'

interface HeaderProps {
  title: string
  subtitle: string
  userName?: string
  role?: 'ADMIN' | 'USER'
  notificationCount?: number
}

export default function Header({
  title,
  subtitle,
  userName = 'นายนัฐกรณ์ ไพรพฤกษ์',
  role = 'ADMIN',
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200/80 px-6 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div>
        <h1 className="text-sm lg:text-base font-bold text-slate-800 leading-tight">
          {title}
        </h1>
        <p className="text-[11px] lg:text-xs text-slate-400">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center space-x-3.5">
        {/* Notification Dropdown */}
        <NotificationDropdown />

        {/* User Profile */}
        <Link
          href="/login"
          title="คลิกเพื่อสลับบัญชีหรือออกจากระบบ"
          className="flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-full text-xs shadow-xs transition cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-bold">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-slate-800 hidden sm:inline-block">
            {userName}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide text-white ${
              role === 'ADMIN' ? 'bg-[#1b5e4a]' : 'bg-[#217972]'
            }`}
          >
            {role}
          </span>
        </Link>
      </div>
    </header>
  )
}
