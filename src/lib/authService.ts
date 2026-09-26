'use client'

import { supabase } from '@/lib/supabaseClient'

export type DemoRole = 'user' | 'admin'

export type DemoSession = {
  name: string
  role: DemoRole
  email?: string
  avatar?: string
  id?: string
}

export type AdminAccountConfig = {
  id: number
  name: string
  email: string
  phone: string
  role: 'admin'
  status: 'active'
}

export type UserAccountConfig = {
  id: number
  name: string
  email: string
  phone: string
  role: 'user'
  status: 'active' | 'suspended' | 'deleted'
}

export const ADMIN_ACCOUNTS: AdminAccountConfig[] = [
  {
    id: 101,
    name: 'นัฐกรณ์',
    email: 'Natthakon030948@gmail.com',
    phone: '089-876-5432',
    role: 'admin',
    status: 'active',
  },
  {
    id: 102,
    name: 'Chanokporn',
    email: 'Chanokporn0953inbluesky@gmail.com',
    phone: '081-111-2233',
    role: 'admin',
    status: 'active',
  },
  {
    id: 103,
    name: 'Apisit',
    email: 'a0611862595@gmail.com',
    phone: '082-222-3344',
    role: 'admin',
    status: 'active',
  },
  {
    id: 104,
    name: 'กฤตภาส',
    email: 'niceseeza90@gmail.com',
    phone: '083-333-4455',
    role: 'admin',
    status: 'active',
  },
  {
    id: 105,
    name: 'Natthaphum',
    email: 'sriviboon7710@gmail.com',
    phone: '084-444-5566',
    role: 'admin',
    status: 'active',
  },
  {
    id: 106,
    name: 'Kittipoom',
    email: 'chimon.ny.w@gmail.com',
    phone: '085-555-6677',
    role: 'admin',
    status: 'active',
  },
  {
    id: 107,
    name: 'Achiraya',
    email: 'jiranyanov1980@gmail.com',
    phone: '086-666-7788',
    role: 'admin',
    status: 'active',
  },
]

export const USER_ACCOUNTS: UserAccountConfig[] = [
  {
    id: 2,
    name: 'สมชาย ใจดี',
    email: 'somchai@example.com',
    phone: '082-345-6789',
    role: 'user',
    status: 'active',
  },
  {
    id: 3,
    name: 'นภัสสร แสงทอง',
    email: 'napatsorn@example.com',
    phone: '083-456-7890',
    role: 'user',
    status: 'active',
  },
  {
    id: 4,
    name: 'ธนกร รักเรียน',
    email: 'thanakorn@example.com',
    phone: '084-567-8901',
    role: 'user',
    status: 'suspended',
  },
  {
    id: 5,
    name: 'กิตติพงษ์ ศรีสุข',
    email: 'kittipong@example.com',
    phone: '085-678-9012',
    role: 'user',
    status: 'active',
  },
  {
    id: 6,
    name: 'พิมพ์ชนก วัฒนะ',
    email: 'pimchanok@example.com',
    phone: '086-789-0123',
    role: 'user',
    status: 'active',
  },
]

export function getActiveUserAccounts(): UserAccountConfig[] {
  if (typeof window === 'undefined') return USER_ACCOUNTS
  try {
    const saved = window.localStorage.getItem('unicare_demo_system_users')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const users = parsed.filter(
          (u: any) =>
            u.role !== 'admin' &&
            u.id < 100 &&
            u.id !== 1 &&
            u.name !== 'กิตติภูมิ' &&
            u.email?.toLowerCase() !== 'kittipoom@example.com'
        )
        if (users.length > 0) {
          return users.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: 'user' as const,
            status: (u.status === 'deleted'
              ? 'deleted'
              : u.status === 'suspended'
                ? 'suspended'
                : 'active') as 'active' | 'suspended' | 'deleted',
          }))
        }
      }
    }
  } catch {}
  return USER_ACCOUNTS
}

const sessionKey = 'unicare_demo_session'

export type SignInResult = {
  success: boolean
  session: DemoSession | null
  error?: string
}

/**
 * Sign in checking account directly against Supabase profiles table
 */
export async function signInWithSupabase(
  emailOrUsername: string,
  password: string
): Promise<SignInResult> {
  const clean = emailOrUsername.trim().toLowerCase()

  try {
    // 1. Fetch profiles from Supabase
    const { data: profiles, error } = await supabase.from('profiles').select('*')

    if (error || !profiles || profiles.length === 0) {
      console.warn('Could not query Supabase profiles:', error?.message)
      // Fallback local check if Supabase network is unreachable
      return fallbackLocalSignIn(clean, password)
    }

    // 2. Find matching account by email, full_name, or username (column or department JSON)
    const matched = profiles.find((p: any) => {
      const pEmail = (p.email || '').toLowerCase()
      const pName = (p.full_name || '').toLowerCase()
      const pUser = (p.username || '').toLowerCase()
      if (pEmail === clean || pName === clean || pUser === clean) return true
      if (clean === 'admin@unicare.local' && (p.role === 'admin' || pEmail.includes('natthakon'))) return true
      if (clean === 'user@unicare.local' && (p.role === 'user' || pEmail.includes('somchai'))) return true

      // Check metadata in department field if stored as JSON (fallback)
      if (p.department && p.department.startsWith('{')) {
        try {
          const meta = JSON.parse(p.department)
          if (meta.username && meta.username.toLowerCase() === clean) return true
        } catch {}
      }
      return false
    })

    if (!matched) {
      return {
        success: false,
        session: null,
        error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ Supabase กรุณาตรวจสอบอีเมลหรือชื่อผู้ใช้',
      }
    }

    // 3. Parse metadata for custom password or account status
    let meta: any = null
    if (matched.department && matched.department.startsWith('{')) {
      try {
        meta = JSON.parse(matched.department)
      } catch {}
    }

    const userStatus = matched.status || meta?.status || 'active'
    if (userStatus === 'suspended') {
      return {
        success: false,
        session: null,
        error: `บัญชี (${matched.full_name}) ถูกระงับการใช้งานในระบบ`,
      }
    }

    if (userStatus === 'deleted') {
      return {
        success: false,
        session: null,
        error: `บัญชี (${matched.full_name}) ถูกลบออกจากระบบ`,
      }
    }

    // 4. Validate password
    let customPass: string | undefined
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('unicare-custom-passwords')
        if (raw) {
          const map = JSON.parse(raw)
          customPass = map[matched.email?.toLowerCase() || '']
        }
      } catch {}
    }

    const validPasswords = [
      customPass,
      meta?.password,
      '12345',
      matched.role === 'admin' ? 'Admin1234!' : 'User1234!',
    ].filter(Boolean)

    const isMatch = validPasswords.includes(password)

    if (!isMatch) {
      return {
        success: false,
        session: null,
        error: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
      }
    }

    // 5. Establish Session
    const session: DemoSession = {
      name: matched.full_name,
      role: matched.role === 'admin' ? 'admin' : 'user',
      email: matched.email,
      id: matched.id,
      avatar: matched.avatar_url || undefined,
    }

    if (typeof window !== 'undefined') {
      const raw = JSON.stringify(session)
      sessionStorage.setItem(sessionKey, raw)
      localStorage.setItem(sessionKey, raw)

      // Store compatibility profiles
      const userPhone = matched.phone || meta?.phone || (session.role === 'admin' ? '089-876-5432' : '082-345-6789')
      if (session.role === 'admin') {
        localStorage.setItem(
          'unicare_demo_admin_profile',
          JSON.stringify({
            fullName: session.name,
            email: session.email,
            phone: userPhone,
          })
        )
      } else {
        localStorage.setItem(
          'unicare_demo_user_profile',
          JSON.stringify({
            fullName: session.name,
            email: session.email,
            phone: userPhone,
          })
        )
      }

      window.dispatchEvent(new Event('unicare-profile-updated'))
    }

    return { success: true, session }
  } catch (err: any) {
    console.error('Supabase sign in error:', err)
    return fallbackLocalSignIn(clean, password)
  }
}

/**
 * Unified sign in entry point
 */
export async function signInUnified(
  emailOrUsername: string,
  password: string
): Promise<SignInResult> {
  return signInWithSupabase(emailOrUsername, password)
}

/**
 * Register a new user account into Supabase profiles table
 */
export async function registerWithSupabase(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  username: string
  prefix?: string
  birthDate?: string
  gender?: string
}): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = data.email.trim().toLowerCase()
  const cleanUsername = data.username.trim().toLowerCase()

  try {
    // 1. Check if email already exists in Supabase
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'อีเมลนี้ถูกใช้งานลงทะเบียนในระบบแล้ว' }
    }

    // 2. Insert new account into Supabase profiles
    const cleanPhone = data.phone?.replace(/\D/g, '') || ''
    const profilePayload: Record<string, any> = {
      email: cleanEmail,
      full_name: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
      role: 'user',
      department: 'มหาวิทยาลัยวลัยลักษณ์',
      phone: cleanPhone,
      username: cleanUsername,
      prefix: data.prefix || null,
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      birth_date: data.birthDate || null,
      gender: data.gender || null,
      status: 'active',
      updated_at: new Date().toISOString(),
    }

    let { error: insertError } = await supabase.from('profiles').insert(profilePayload)

    // Fallback if individual columns not yet migrated in Supabase
    if (insertError && (insertError.message?.includes('column') || insertError.message?.includes('schema cache'))) {
      const metadata = {
        prefix: data.prefix,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: cleanPhone,
        username: cleanUsername,
        password: data.password,
        birthDate: data.birthDate,
        gender: data.gender,
        status: 'active',
        department: 'มหาวิทยาลัยวลัยลักษณ์',
      }
      const fbResult = await supabase.from('profiles').insert({
        email: cleanEmail,
        full_name: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
        role: 'user',
        department: JSON.stringify(metadata),
        updated_at: new Date().toISOString(),
      })
      insertError = fbResult.error
    }

    if (insertError) {
      console.warn('Supabase profile insertion error:', insertError.message)
      return { success: false, error: insertError.message }
    }

    // 3. Cache locally for instant offline usage
    if (typeof window !== 'undefined') {
      try {
        const storedUsers = localStorage.getItem('unicare-demo-users')
        const users = storedUsers ? JSON.parse(storedUsers) : []
        users.push({
          id: crypto.randomUUID(),
          email: cleanEmail,
          username: cleanUsername,
          password: data.password,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          phone: data.phone,
          role: 'user',
          createdAt: new Date().toISOString(),
        })
        localStorage.setItem('unicare-demo-users', JSON.stringify(users))

        const sysUsers = localStorage.getItem('unicare_demo_system_users')
        const parsedSys = sysUsers ? JSON.parse(sysUsers) : []
        parsedSys.push({
          id: Date.now(),
          name: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
          email: cleanEmail,
          phone: data.phone || '',
          status: 'active',
          role: 'user',
        })
        localStorage.setItem('unicare_demo_system_users', JSON.stringify(parsedSys))
        window.dispatchEvent(new Event('unicare-demo-users-updated'))
      } catch {}
    }

    return { success: true }
  } catch (err: any) {
    console.error('Registration error:', err)
    return { success: false, error: err?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน' }
  }
}

/**
 * Fallback local login if offline
 */
function fallbackLocalSignIn(clean: string, password: string): SignInResult {
  const allAccounts = [...ADMIN_ACCOUNTS, ...USER_ACCOUNTS]
  const matched = allAccounts.find(
    (a) =>
      a.email.toLowerCase() === clean ||
      a.name.toLowerCase() === clean ||
      (clean === 'admin@unicare.local' && a.role === 'admin') ||
      (clean === 'user@unicare.local' && a.role === 'user')
  )

  if (!matched) {
    return {
      success: false,
      session: null,
      error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ',
    }
  }

  let customPass: string | undefined
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('unicare-custom-passwords')
      if (raw) {
        const map = JSON.parse(raw)
        customPass = map[matched.email.toLowerCase()]
      }
    } catch {}
  }

  const validPasswords = [customPass, '12345', matched.role === 'admin' ? 'Admin1234!' : 'User1234!'].filter(Boolean)
  if (!validPasswords.includes(password)) {
    return {
      success: false,
      session: null,
      error: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
    }
  }

  const session: DemoSession = {
    name: matched.name,
    role: matched.role,
    email: matched.email,
  }

  if (typeof window !== 'undefined') {
    const raw = JSON.stringify(session)
    sessionStorage.setItem(sessionKey, raw)
    localStorage.setItem(sessionKey, raw)
    window.dispatchEvent(new Event('unicare-profile-updated'))
  }

  return { success: true, session }
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null
  const stored =
    sessionStorage.getItem(sessionKey) || localStorage.getItem(sessionKey)
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    if (parsed && typeof parsed.name === 'string' && (parsed.role === 'user' || parsed.role === 'admin')) {
      return {
        name: parsed.name,
        role: parsed.role,
        email: parsed.email,
        avatar: parsed.avatar,
        id: parsed.id,
      }
    }
  } catch {}

  return null
}

export function updateDemoSession(updates: Partial<DemoSession>): void {
  if (typeof window === 'undefined') return
  const current = getDemoSession()
  if (!current) return
  const updated: DemoSession = { ...current, ...updates }
  const raw = JSON.stringify(updated)
  if (sessionStorage.getItem(sessionKey)) {
    sessionStorage.setItem(sessionKey, raw)
  }
  localStorage.setItem(sessionKey, raw)
  window.dispatchEvent(new Event('unicare-profile-updated'))
  window.dispatchEvent(new Event('storage'))
}

export function signOutDemo(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(sessionKey)
    localStorage.removeItem(sessionKey)
  }
}

/**
 * Check if an email exists across Supabase profiles, demo accounts, or localStorage
 */
export async function verifyEmailExists(email: string): Promise<boolean> {
  const clean = email.trim().toLowerCase()
  if (!clean) return false

  // 1. Check in hardcoded accounts
  const demoMatched = [...ADMIN_ACCOUNTS, ...USER_ACCOUNTS].some(
    (a) => a.email.toLowerCase() === clean
  )
  if (demoMatched) return true

  // 2. Check in Supabase profiles
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', clean)
      .maybeSingle()
    if (data) return true
  } catch {}

  // 3. Check in localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('unicare-demo-users')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.some((u: any) => u.email?.toLowerCase() === clean)) {
          return true
        }
      }
    } catch {}
  }

  return false
}

/**
 * Unified password reset: updates password in Supabase profiles and local storage
 */
export async function resetPasswordUnified(
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail) {
    return { success: false, error: 'กรุณากรอกอีเมล' }
  }
  if (newPassword.length < 8) {
    return { success: false, error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' }
  }

  try {
    let foundAny = false

    // 1. Update in Supabase profiles table
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (profile) {
        foundAny = true
        let meta: any = {}
        if (profile.department) {
          try {
            meta = JSON.parse(profile.department)
          } catch {
            meta = {}
          }
        }
        meta.password = newPassword

        await supabase
          .from('profiles')
          .update({
            department: JSON.stringify(meta),
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)
      }
    } catch (dbErr) {
      console.warn('Supabase profile password update warning:', dbErr)
    }

    // 2. Update in localStorage unicare-demo-users
    if (typeof window !== 'undefined') {
      try {
        const storedUsers = localStorage.getItem('unicare-demo-users')
        if (storedUsers) {
          const users = JSON.parse(storedUsers)
          if (Array.isArray(users)) {
            const hasUser = users.some((u: any) => u.email?.toLowerCase() === cleanEmail)
            if (hasUser) {
              foundAny = true
              const updated = users.map((u: any) => {
                if (u.email?.toLowerCase() === cleanEmail) {
                  return { ...u, password: newPassword }
                }
                return u
              })
              localStorage.setItem('unicare-demo-users', JSON.stringify(updated))
            }
          }
        }

        // Store custom passwords map for demo accounts
        const customPasswordsRaw = localStorage.getItem('unicare-custom-passwords') || '{}'
        const customPasswords = JSON.parse(customPasswordsRaw)
        customPasswords[cleanEmail] = newPassword
        localStorage.setItem('unicare-custom-passwords', JSON.stringify(customPasswords))
      } catch {}
    }

    // 3. Check hardcoded accounts
    const isHardcoded = [...ADMIN_ACCOUNTS, ...USER_ACCOUNTS].some(
      (a) => a.email.toLowerCase() === cleanEmail
    )
    if (isHardcoded) {
      foundAny = true
    }

    // 4. Try Supabase Auth updateUser if active session exists
    try {
      await supabase.auth.updateUser({ password: newPassword })
    } catch {}

    if (!foundAny) {
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ UniCare' }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่' }
  }
}
