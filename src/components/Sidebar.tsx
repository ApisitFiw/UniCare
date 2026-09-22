'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  BarChart3,
  ClipboardList,
  FolderKanban,
  Star,
  MapPin,
  LogOut,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react'

interface SidebarProps {
  role?: 'user' | 'admin'
}

export default function Sidebar({ role = 'admin' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const adminNavItems = [
    { label: 'หน้าหลัก', href: '/', icon: Home },
    { label: 'แดชบอร์ดหลัก', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'สถิติและรายงาน', href: '/admin/analytics', icon: BarChart3 },
    { label: 'ติดตามสถานะ & ซักถาม', href: '/admin/issues', icon: ClipboardList },
    { label: 'หมวดหมู่และพื้นที่เสี่ยง', href: '/admin/categories', icon: FolderKanban },
    { label: 'ผลการประเมิน (CSAT)', href: '/admin/feedback', icon: Star },
    { label: 'แดชบอร์ดผู้ใช้', href: '/user/dashboard', icon: Sparkles },
  ]

  return (
    <aside className="w-64 sidebar-gradient text-white flex-shrink-0 sticky top-0 h-screen overflow-y-auto p-5 flex flex-col justify-between hidden md:flex border-r border-[#103e31] z-30 shadow-lg">
      <div className="space-y-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 pb-4 border-b border-white/15 group">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-bold border border-white/30 shadow-sm group-hover:scale-105 transition-transform">
            🌱
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider uppercase leading-none text-white drop-shadow-sm">
              UniCare
            </h1>
            <p className="text-[10px] text-emerald-200/80 mt-0.5 font-medium">มหาวิทยาลัยวลัยลักษณ์</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="space-y-1.5 text-xs font-medium">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition ${
                  isActive
                    ? 'bg-[#c5e8d5] text-[#0d3b2e] font-bold shadow-xs'
                    : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <button
            onClick={() => {
              if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
                router.push('/')
              }
            }}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-rose-200 hover:text-white border border-white/15 text-xs font-semibold transition mt-4 shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>ออกจากระบบ</span>
          </button>
        </nav>
      </div>

      {/* Footer Quote */}
      <div className="bg-black/15 p-3.5 rounded-2xl border border-white/10 text-center">
        <p className="text-xs text-emerald-100/90 font-medium leading-relaxed">
          ร่วมสร้างมหาวิทยาลัยน่าอยู่ไปด้วยกัน 🌱
        </p>
      </div>
    </aside>
  )
}
