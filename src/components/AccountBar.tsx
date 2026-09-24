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

export default function AccountBar({ userName, role }: AccountBarProps) {
  const [currentName, setCurrentName] = useState<string>(
    userName || (role === 'ADMIN' ? 'นัฐกรณ์' : 'กิตติภูมิ')
  )
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'USER'>(
    role || 'USER'
  )
  const [currentEmail, setCurrentEmail] = useState<string>(
    role === 'ADMIN' ? 'Natthakon030948@gmail.com' : 'kittipoom@example.com'
  )

  useEffect(() => {
    if (userName) {
      setCurrentName(userName)
    }
    if (role) {
      setCurrentRole(role)
    }

    const session = getDemoSession()
    if (session) {
      if (!userName && session.name) {
        setCurrentName(session.name)
      }
      if (!role) {
        setCurrentRole(session.role === 'admin' ? 'ADMIN' : 'USER')
      }
      if (session.email) {
        setCurrentEmail(session.email)
      }
    }
  }, [userName, role])

  // Listen for profile name updates across tabs and components
  useEffect(() => {
    const handleProfileUpdate = () => {
      const session = getDemoSession()
      if (session?.name) {
        setCurrentName(session.name)
      }
      if (session?.role) {
        setCurrentRole(session.role === 'admin' ? 'ADMIN' : 'USER')
      }
      if (session?.email) {
        setCurrentEmail(session.email)
      }
    }

    window.addEventListener('storage', handleProfileUpdate)
    window.addEventListener('unicare-profile-updated', handleProfileUpdate)
    window.addEventListener('focus', handleProfileUpdate)

    return () => {
      window.removeEventListener('storage', handleProfileUpdate)
      window.removeEventListener('unicare-profile-updated', handleProfileUpdate)
      window.removeEventListener('focus', handleProfileUpdate)
    }
  }, [])

  // User goes to /user/profile, Admin goes to /admin/profile
  const profileHref = currentRole === 'ADMIN' ? '/admin/profile' : '/user/profile'

  return (
    <div className="flex items-center space-x-3 shrink-0">
      {/* Notification Dropdown Bell */}
      <NotificationDropdown
        role={currentRole}
        userName={currentName}
        userEmail={currentEmail}
      />

      {/* User / Admin Profile Chip: Links to Account Management */}
      <Link
        href={profileHref}
        title={currentRole === 'ADMIN' ? 'จัดการบัญชีผู้ดูแลระบบ' : 'จัดการบัญชีของฉัน'}
        className="flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-emerald-500 px-3 py-1.5 rounded-full text-xs shadow-xs transition cursor-pointer group"
      >
        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-bold shrink-0 group-hover:scale-105 transition-transform">
          <User className="w-3.5 h-3.5" />
        </div>
        <span className="font-semibold text-slate-800 hidden sm:inline-block">
          {currentName}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide text-white shrink-0 ${
            currentRole === 'ADMIN' ? 'bg-[#1b5e4a]' : 'bg-[#217972]'
          }`}
        >
          {currentRole}
        </span>
      </Link>
    </div>
  )
}
