'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AccountBar from '@/components/AccountBar'

interface HeaderProps {
  title: string
  subtitle: string
  userName?: string
  role?: 'ADMIN' | 'USER'
  backHref?: string
}

export default function Header({
  title,
  subtitle,
  userName,
  role = 'ADMIN',
  backHref,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200/80 px-6 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer shrink-0"
            title="ย้อนกลับ"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div>
          <h1 className="text-sm lg:text-base font-bold text-slate-800 leading-tight">
            {title}
          </h1>
          <p className="text-[11px] lg:text-xs text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      <AccountBar role={role} userName={userName} />
    </header>
  )
}
