import { getUserAllIssues, type IssueItem } from '@/lib/issuesData'

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
export const NOTIFICATIONS_VERSION_KEY = 'unicare_demo_notifications_v5'

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

    // Upgrade/reset to v5: filter out any legacy leaked case notifications that lack recipient metadata
    if (version !== 'v5' || !saved) {
      let migrated: NotificationItem[] = initialNotifications
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            migrated = parsed.filter((item: NotificationItem) => {
              // News broadcasts are always kept
              if (item.type === 'news') return true
              // Admin notifications are kept
              if (item.targetRole === 'admin') return true
              // Discard legacy case notifications for users that lack explicit recipient email or name
              if (item.targetRole === 'user' && !item.targetEmail && !item.targetName) {
                return false
              }
              return true
            })
            if (migrated.length === 0) migrated = initialNotifications
          }
        } catch {
          migrated = initialNotifications
        }
      }
      window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(migrated))
      window.localStorage.setItem(NOTIFICATIONS_VERSION_KEY, 'v5')
      return migrated
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
      window.localStorage.setItem(NOTIFICATIONS_VERSION_KEY, 'v5')
      window.dispatchEvent(new Event('unicare-notifications-updated'))
    } catch {
      // ignore
    }
  }
}

/**
 * Checks if a specific issue ID belongs to the current user's owned issues
 */
function isUserIssueOwner(issueId: string | number, userIssues: IssueItem[]): boolean {
  const cleanTarget = String(issueId).replace(/^#/, '').trim().toLowerCase()
  const targetNumMatch = cleanTarget.match(/\d+$/)
  const targetNum = targetNumMatch ? parseInt(targetNumMatch[0], 10) : null

  return userIssues.some((issue) => {
    const cleanId = String(issue.id || '').replace(/^#/, '').trim().toLowerCase()
    const cleanSubId = String(issue.supabaseId || '').trim().toLowerCase()
    const cleanRawId = String(issue.rawId || '').trim().toLowerCase()

    if (cleanId === cleanTarget || cleanSubId === cleanTarget || cleanRawId === cleanTarget) {
      return true
    }

    if (targetNum !== null) {
      const issueNumMatch = cleanId.match(/\d+$/)
      if (issueNumMatch && parseInt(issueNumMatch[0], 10) === targetNum) {
        return true
      }
    }

    return false
  })
}

export function getUserNotifications(user?: UserIdentifier): NotificationItem[] {
  const all = getNotifications()
  if (!user) return all

  const userRole = (user.role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user'
  const userEmail = (user.email || '').trim().toLowerCase()
  const userName = (user.name || '').trim().toLowerCase()
  const userKey = userEmail || userName || userRole

  // Pre-fetch user's owned reports if role is user
  const userIssues =
    userRole === 'user'
      ? getUserAllIssues({
          email: user?.email ?? undefined,
          name: user?.name ?? undefined,
        })
      : []

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

      // 3. Strict Case Ownership Check for general users:
      // Never allow a user to receive or see a case-specific notification (status update, admin chat, rejection)
      // unless they are the actual reporter of that issue.
      if (userRole === 'user') {
        const isCaseRelated =
          Boolean(item.issueId) ||
          Boolean(item.link?.includes('/my-reports')) ||
          item.type === 'status' ||
          item.type === 'urgent'

        if (isCaseRelated) {
          const matchesDirectTarget = Boolean(
            (targetEmail && userEmail && targetEmail === userEmail) ||
            (targetName && userName && targetName === userName)
          )

          // If not directly targeted by matching email/name, verify issue ownership
          if (!matchesDirectTarget) {
            let targetId = item.issueId ? String(item.issueId).trim() : ''
            if (!targetId && item.link) {
              const matchChat = item.link.match(/chat=([^&]+)/)
              if (matchChat) targetId = decodeURIComponent(matchChat[1])
            }

            if (!targetId) {
              // Untargeted case notification with no identifiable issue is discarded for regular users
              return false
            }

            if (!isUserIssueOwner(targetId, userIssues)) {
              return false
            }
          }
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

  // Prevent duplicate within 15 seconds
  const isDuplicate = current.some((n) => {
    if (
      n.title === notification.title &&
      n.description === notification.description &&
      n.issueId === notification.issueId &&
      n.targetRole === notification.targetRole &&
      n.targetEmail === notification.targetEmail
    ) {
      if (n.createdAt) {
        const diff = Date.now() - new Date(n.createdAt).getTime()
        if (diff < 15000) return true
      }
    }
    return false
  })

  if (isDuplicate) {
    return current[0]
  }

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

  const userIssues =
    userRole === 'user'
      ? getUserAllIssues({
          email: user?.email ?? undefined,
          name: user?.name ?? undefined,
        })
      : []

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

    if (userRole === 'user') {
      const isCaseRelated =
        Boolean(item.issueId) ||
        Boolean(item.link?.includes('/my-reports')) ||
        item.type === 'status' ||
        item.type === 'urgent'

      if (isCaseRelated) {
        const matchesDirect = Boolean(
          (targetEmail && userEmail && targetEmail === userEmail) ||
          (targetName && userName && targetName === userName)
        )
        if (!matchesDirect) {
          const targetId = item.issueId || ''
          if (!targetId || !isUserIssueOwner(targetId, userIssues)) {
            return item
          }
        }
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
