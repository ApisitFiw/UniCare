'use client'

import Link from 'next/link'
import { ArrowLeft, Menu } from 'lucide-react'
import AccountBar from '@/components/AccountBar'
import { useLanguage } from '@/context/LanguageContext'

interface HeaderProps {
  title: string
  subtitle: string
  userName?: string
  role?: 'ADMIN' | 'USER'
  backHref?: string
  titleEn?: string
  subtitleEn?: string
}

export default function Header({
  title,
  subtitle,
  userName,
  role = 'ADMIN',
  backHref,
  titleEn,
  subtitleEn,
}: HeaderProps) {
  const { t, lang } = useLanguage();
  const displayTitle = lang === 'en' && titleEn ? titleEn : t(title);
  const displaySubtitle = lang === 'en' && subtitleEn ? subtitleEn : t(subtitle);

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("unicare-toggle-sidebar"))}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition md:hidden cursor-pointer shrink-0"
          title={t("เปิดเมนูด้านข้าง")}
          aria-label="Menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        {backHref && (
          <Link
            href={backHref}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer shrink-0"
            title={t("ย้อนกลับ")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div>
          <h1 className="text-sm lg:text-base font-bold text-slate-800 leading-tight">
            {displayTitle}
          </h1>
          <p className="text-[11px] lg:text-xs text-slate-400">
            {displaySubtitle}
          </p>
        </div>
      </div>

      <AccountBar role={role} userName={userName} />
    </header>
  )
}
