export interface NotificationItem {
  id: number
  title: string
  description: string
  time: string
  type: 'status' | 'news' | 'urgent'
  isRead: boolean
  link?: string
  createdAt?: string
  targetRole?: 'admin' | 'user' | 'all'
  targetEmail?: string
  targetName?: string
  issueId?: string
  readBy?: string[]
}

export interface UserIdentifier {
  email?: string | null
  name?: string | null
  role?: 'admin' | 'user' | 'ADMIN' | 'USER' | string | null
}

export const NOTIFICATIONS_KEY = 'unicare_demo_notifications'
export const NOTIFICATIONS_VERSION_KEY = 'unicare_demo_notifications_v4'

export const initialNotifications: NotificationItem[] = [
  // ================= BROADCAST FOR ALL GENERAL USERS =================
  {
    id: 201,
    title: 'ประกาศมาตรการสิ่งแวดล้อมใหม่',
    description: 'มาตรการลดเสียงรบกวนและรณรงค์คัดแยกขยะช่วงสอบปลายภาคการศึกษา',
    time: '2 ชั่วโมงที่แล้ว',
    type: 'news',
    isRead: false,
    link: '/user/dashboard?tab=news',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    targetRole: 'user',
    readBy: [],
  },
  // ================= BROADCAST FOR ALL ADMINS =================
  {
    id: 309,
    title: 'สรุปการดำเนินงานระบบประจำวัน',
    description: 'มีเรื่องร้องเรียนใหม่และดำเนินการต่อเนื่องในระบบ UniCare',
    time: '3 ชั่วโมงที่แล้ว',
    type: 'news',
    isRead: false,
    link: '/admin/analytics',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    targetRole: 'admin',
    readBy: [],
  },
]

export function getNotifications(): NotificationItem[] {
  if (typeof window === 'undefined') return initialNotifications
  try {
    const version = window.localStorage.getItem(NOTIFICATIONS_VERSION_KEY)
    const saved = window.localStorage.getItem(NOTIFICATIONS_KEY)

    // Upgrade/reset to v4 with comprehensive per-user mock data if version mismatch or empty
    if (version !== 'v4' || !saved) {
      window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(initialNotifications))
      window.localStorage.setItem(NOTIFICATIONS_VERSION_KEY, 'v4')
      return initialNotifications
    }

    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialNotifications
  } catch {
    return initialNotifications
  }
}

export function saveNotifications(items: NotificationItem[]): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items))
      window.localStorage.setItem(NOTIFICATIONS_VERSION_KEY, 'v4')
      window.dispatchEvent(new Event('unicare-notifications-updated'))
    } catch {
      // ignore
    }
  }
}

export function getUserNotifications(user?: UserIdentifier): NotificationItem[] {
  const all = getNotifications()
  if (!user) return all

  const userRole = (user.role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user'
  const userEmail = (user.email || '').trim().toLowerCase()
  const userName = (user.name || '').trim().toLowerCase()
  const userKey = userEmail || userName || userRole

  return all
    .filter((item) => {
      // 1. Role match:
      if (item.targetRole && item.targetRole !== 'all') {
        if (item.targetRole.toLowerCase() !== userRole) {
          return false
        }
      }

      // 2. Specific recipient match:
      const targetEmail = item.targetEmail?.trim().toLowerCase()
      const targetName = item.targetName?.trim().toLowerCase()

      if (targetEmail || targetName) {
        const matchesEmail = Boolean(targetEmail && userEmail && targetEmail === userEmail)
        const matchesName = Boolean(targetName && userName && targetName === userName)

        if (!matchesEmail && !matchesName) {
          return false
        }
      }

      return true
    })
    .map((item) => {
      let isRead = false
      if (Array.isArray(item.readBy)) {
        isRead = item.readBy.some((k) => {
          const lk = k.trim().toLowerCase()
          return (
            lk === '*' ||
            lk === userKey ||
            (userEmail && lk === userEmail) ||
            (userName && lk === userName)
          )
        })
      } else {
        isRead = Boolean(item.isRead)
      }

      return {
        ...item,
        isRead,
      }
    })
}

export function addNotification(
  notification: Omit<NotificationItem, 'id' | 'time'> & { time?: string }
): NotificationItem {
  const current = getNotifications()
  const nextId = current.length > 0 ? Math.max(...current.map((n) => n.id)) + 1 : 1
  const newItem: NotificationItem = {
    ...notification,
    id: nextId,
    time: notification.time || 'เมื่อสักครู่',
    createdAt: new Date().toISOString(),
    readBy: notification.readBy || [],
  }

  const updated = [newItem, ...current]
  saveNotifications(updated)
  return newItem
}

export function markAllNotificationsAsRead(user?: UserIdentifier): void {
  const current = getNotifications()
  const userRole = (user?.role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user'
  const userEmail = (user?.email || '').trim().toLowerCase()
  const userName = (user?.name || '').trim().toLowerCase()
  const userKey = userEmail || userName || userRole

  const updated = current.map((item) => {
    // Check if this item is applicable to this user
    if (item.targetRole && item.targetRole !== 'all' && item.targetRole.toLowerCase() !== userRole) {
      return item
    }
    const targetEmail = item.targetEmail?.trim().toLowerCase()
    const targetName = item.targetName?.trim().toLowerCase()
    if (targetEmail || targetName) {
      const matchesEmail = Boolean(targetEmail && userEmail && targetEmail === userEmail)
      const matchesName = Boolean(targetName && userName && targetName === userName)
      if (!matchesEmail && !matchesName) {
        return item
      }
    }

    const readBy = Array.isArray(item.readBy) ? [...item.readBy] : item.isRead ? ['*'] : []
    if (!readBy.includes(userKey)) {
      readBy.push(userKey)
    }
    if (userEmail && !readBy.includes(userEmail)) {
      readBy.push(userEmail)
    }
    return {
      ...item,
      isRead: true,
      readBy,
    }
  })

  saveNotifications(updated)
}

export function markNotificationAsRead(id: number, user?: UserIdentifier): void {
  const current = getNotifications()
  const userRole = (user?.role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user'
  const userEmail = (user?.email || '').trim().toLowerCase()
  const userName = (user?.name || '').trim().toLowerCase()
  const userKey = userEmail || userName || userRole

  const updated = current.map((item) => {
    if (item.id !== id) return item
    const readBy = Array.isArray(item.readBy) ? [...item.readBy] : item.isRead ? ['*'] : []
    if (!readBy.includes(userKey)) {
      readBy.push(userKey)
    }
    if (userEmail && !readBy.includes(userEmail)) {
      readBy.push(userEmail)
    }
    return {
      ...item,
      isRead: true,
      readBy,
    }
  })

  saveNotifications(updated)
}
