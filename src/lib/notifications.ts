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
export const NOTIFICATIONS_VERSION_KEY = 'unicare_demo_notifications_v3'

export const initialNotifications: NotificationItem[] = [
  // ================= USER: กิตติภูมิ =================
  {
    id: 101,
    title: 'เรื่องร้องเรียนได้รับการอัปเดต',
    description: 'เจ้าหน้าที่เข้าตรวจสอบเหตุ "ไฟส่องสว่างดับ บริเวณวงเวียนหอพัก" (เคส #ISS-2026-101) เรียบร้อยแล้ว',
    time: '15 นาทีที่แล้ว',
    type: 'status',
    isRead: false,
    link: '/my-reports',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    targetRole: 'user',
    targetEmail: 'kittipoom@example.com',
    targetName: 'กิตติภูมิ',
    issueId: 'ISS-2026-101',
    readBy: [],
  },
  {
    id: 102,
    title: 'ปิดงานเรียบร้อย',
    description: 'เคส #ISS-2026-106 "เครื่องปรับอากาศห้องเรียน SC102 เสีย" ดำเนินการซ่อมบำรุงและแก้ไขสำเร็จ',
    time: '1 วันที่แล้ว',
    type: 'status',
    isRead: true,
    link: '/my-reports',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    targetRole: 'user',
    targetEmail: 'kittipoom@example.com',
    targetName: 'กิตติภูมิ',
    issueId: 'ISS-2026-106',
    readBy: ['kittipoom@example.com', 'กิตติภูมิ'],
  },

  // ================= USER: สมชาย ใจดี =================
  {
    id: 103,
    title: 'เจ้าหน้าที่กำลังดำเนินการ',
    description: 'เคส #ISS-2026-107 "ถังขยะชำรุด หอพักลักษณานิเวศ 2" เจ้าหน้าที่ฝ่ายอาคารกำลังเข้าเปลี่ยนถังใหม่',
    time: '25 นาทีที่แล้ว',
    type: 'status',
    isRead: false,
    link: '/my-reports',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    targetRole: 'user',
    targetEmail: 'somchai@example.com',
    targetName: 'สมชาย ใจดี',
    issueId: 'ISS-2026-107',
    readBy: [],
  },
  {
    id: 104,
    title: 'รับเรื่องร้องเรียนแล้ว',
    description: 'เคส #ISS-2026-102 "น้ำประปาไหลอ่อน อาคารวิทยาศาสตร์" เจ้าหน้าที่รับเรื่องและประสานกองอาคารแล้ว',
    time: '2 วันที่แล้ว',
    type: 'status',
    isRead: true,
    link: '/my-reports',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    targetRole: 'user',
    targetEmail: 'somchai@example.com',
    targetName: 'สมชาย ใจดี',
    issueId: 'ISS-2026-102',
    readBy: ['somchai@example.com', 'สมชาย ใจดี'],
  },

  // ================= USER: นภัสสร แสงทอง =================
  {
    id: 105,
    title: 'เรื่องร้องเรียนได้รับการอัปเดต',
    description: 'เจ้าหน้าที่เข้าตรวจสอบเหตุ "เสียงเปิดเพลงยามวิกาล วงเวียนหอพัก" (เคส #ISS-2026-108) แล้ว',
    time: '10 นาทีที่แล้ว',
    type: 'status',
    isRead: false,
    link: '/my-reports',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    targetRole: 'user',
    targetEmail: 'napatsorn@example.com',
    targetName: 'นภัสสร แสงทอง',
    issueId: 'ISS-2026-108',
    readBy: [],
  },
  {
    id: 106,
    title: 'เจ้าหน้าที่รับเรื่องร้องเรียนแล้ว',
    description: 'เคส #ISS-2026-103 "ท่อระบายน้ำอุดตัน อาคารเรียนรวม 5" บรรจุลงแผนลอกท่อระบายน้ำเร่งด่วน',
    time: '3 วันที่แล้ว',
    type: 'status',
    isRead: true,
    link: '/my-reports',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    targetRole: 'user',
    targetEmail: 'napatsorn@example.com',
    targetName: 'นภัสสร แสงทอง',
    issueId: 'ISS-2026-103',
    readBy: ['napatsorn@example.com', 'นภัสสร แสงทอง'],
  },

  // ================= USER: กิตติพงษ์ ศรีสุข =================
  {
    id: 107,
    title: 'กำลังดำเนินการซ่อมแซม',
    description: 'เคส #ISS-2026-104 "ไฟทางเดินดับ ทางเดินเชื่อมอาคาร 7" ทีมช่างไฟฟ้าเข้าดำเนินการเปลี่ยนหลอดไฟแล้ว',
    time: '45 นาทีที่แล้ว',
    type: 'status',
    isRead: false,
    link: '/my-reports',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    targetRole: 'user',
    targetEmail: 'kittipong@example.com',
    targetName: 'กิตติพงษ์ ศรีสุข',
    issueId: 'ISS-2026-104',
    readBy: [],
  },
  {
    id: 108,
    title: 'เจ้าหน้าที่รับเรื่องร้องเรียนแล้ว',
    description: 'เคส #ISS-2026-109 "ท่อระบายน้ำชำรุด โรงอาหารกลาง" รับเรื่องและมอบหมายงานเรียบร้อย',
    time: '2 วันที่แล้ว',
    type: 'status',
    isRead: true,
    link: '/my-reports',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    targetRole: 'user',
    targetEmail: 'kittipong@example.com',
    targetName: 'กิตติพงษ์ ศรีสุข',
    issueId: 'ISS-2026-109',
    readBy: ['kittipong@example.com', 'กิตติพงษ์ ศรีสุข'],
  },

  // ================= USER: พิมพ์ชนก วัฒนะ =================
  {
    id: 109,
    title: 'เจ้าหน้าที่เข้าตรวจสอบพื้นที่',
    description: 'เคส #ISS-2026-105 "กิ่งไม้ใหญ่หักพาดสายไฟ หน้าสถาปัตย์" ทีมภูมิทัศน์กำลังตัดแต่งกิ่งไม้',
    time: '1 ชั่วโมงที่แล้ว',
    type: 'status',
    isRead: false,
    link: '/my-reports',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    targetRole: 'user',
    targetEmail: 'pimchanok@example.com',
    targetName: 'พิมพ์ชนก วัฒนะ',
    issueId: 'ISS-2026-105',
    readBy: [],
  },
  {
    id: 110,
    title: 'เจ้าหน้าที่รับเรื่องร้องเรียนแล้ว',
    description: 'เคส #ISS-2026-110 "โต๊ะ-เก้าอี้ชำรุด ห้อง 204" รับเรื่องส่งฝ่ายซ่อมบำรุงพัสดุแล้ว',
    time: '3 วันที่แล้ว',
    type: 'status',
    isRead: true,
    link: '/my-reports',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    targetRole: 'user',
    targetEmail: 'pimchanok@example.com',
    targetName: 'พิมพ์ชนก วัฒนะ',
    issueId: 'ISS-2026-110',
    readBy: ['pimchanok@example.com', 'พิมพ์ชนก วัฒนะ'],
  },

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

  // ================= ADMIN: นัฐกรณ์ =================
  {
    id: 301,
    title: 'มอบหมายงานเคสใหม่',
    description: 'คุณได้รับมอบหมายให้รับผิดชอบเคส #ISS-2026-101 (แสงสว่าง - บริเวณวงเวียนหอพัก)',
    time: '20 นาทีที่แล้ว',
    type: 'status',
    isRead: false,
    link: '/admin/issues',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    targetRole: 'admin',
    targetEmail: 'Natthakon030948@gmail.com',
    targetName: 'นัฐกรณ์',
    issueId: 'ISS-2026-101',
    readBy: [],
  },
  {
    id: 302,
    title: 'มีคำร้องเรียนใหม่ส่งเข้ามา',
    description: 'เคส #ISS-2026-108 "เสียงรบกวนยามวิกาล" แจ้งโดย นภัสสร แสงทอง กรุณาตรวจสอบ',
    time: '1 ชั่วโมงที่แล้ว',
    type: 'urgent',
    isRead: false,
    link: '/admin/reports',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    targetRole: 'admin',
    targetEmail: 'Natthakon030948@gmail.com',
    targetName: 'นัฐกรณ์',
    issueId: 'ISS-2026-108',
    readBy: [],
  },

  // ================= ADMIN: Chanokporn =================
  {
    id: 303,
    title: 'มอบหมายงานเคสใหม่',
    description: 'คุณได้รับมอบหมายให้รับผิดชอบเคส #ISS-2026-102 (น้ำ / น้ำเสีย - อาคารวิทยาศาสตร์)',
    time: '25 นาทีที่แล้ว',
    type: 'status',
    isRead: false,
    link: '/admin/issues',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    targetRole: 'admin',
    targetEmail: 'Chanokporn0953inbluesky@gmail.com',
    targetName: 'Chanokporn',
    issueId: 'ISS-2026-102',
    readBy: [],
  },

  // ================= ADMIN: Apisit =================
  {
    id: 304,
    title: 'แจ้งเตือนเคสเร่งด่วนมาก',
    description: 'เคส #ISS-2026-103 "ท่อระบายน้ำอุดตัน อาคารเรียนรวม 5" ได้รับมอบหมายให้คุณดูแล',
    time: '35 นาทีที่แล้ว',
    type: 'urgent',
    isRead: false,
    link: '/admin/issues',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    targetRole: 'admin',
    targetEmail: 'a0611862595@gmail.com',
    targetName: 'Apisit',
    issueId: 'ISS-2026-103',
    readBy: [],
  },

  // ================= ADMIN: กฤตภาส =================
  {
    id: 305,
    title: 'มอบหมายงานเคสใหม่',
    description: 'คุณได้รับมอบหมายให้รับผิดชอบเคส #ISS-2026-104 (แสงสว่าง - ทางเดินเชื่อมอาคาร 7)',
    time: '40 นาทีที่แล้ว',
    type: 'status',
    isRead: false,
    link: '/admin/issues',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    targetRole: 'admin',
    targetEmail: 'niceseeza90@gmail.com',
    targetName: 'กฤตภาส',
    issueId: 'ISS-2026-104',
    readBy: [],
  },

  // ================= ADMIN: Natthaphum =================
  {
    id: 306,
    title: 'มอบหมายงานเคสใหม่',
    description: 'คุณได้รับมอบหมายให้รับผิดชอบเคส #ISS-2026-105 (ต้นไม้ / พื้นที่สีเขียว - ลานหน้าสถาปัตย์)',
    time: '50 นาทีที่แล้ว',
    type: 'status',
    isRead: false,
    link: '/admin/issues',
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    targetRole: 'admin',
    targetEmail: 'sriviboon7710@gmail.com',
    targetName: 'Natthaphum',
    issueId: 'ISS-2026-105',
    readBy: [],
  },

  // ================= ADMIN: Kittipoom =================
  {
    id: 307,
    title: 'เคสได้รับการแก้ไขสำเร็จแล้ว',
    description: 'เคสที่คุณรับผิดชอบ #ISS-2026-106 "อากาศ / มลพิษ" ดำเนินการเสร็จสมบูรณ์แล้ว',
    time: '1 วันที่แล้ว',
    type: 'status',
    isRead: true,
    link: '/admin/issues',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    targetRole: 'admin',
    targetEmail: 'chimon.ny.w@gmail.com',
    targetName: 'Kittipoom',
    issueId: 'ISS-2026-106',
    readBy: ['chimon.ny.w@gmail.com', 'Kittipoom'],
  },

  // ================= ADMIN: Achiraya =================
  {
    id: 308,
    title: 'มอบหมายงานเคสใหม่',
    description: 'คุณได้รับมอบหมายให้รับผิดชอบเคส #ISS-2026-107 (ขยะ / ของเสีย - หอพักลักษณานิเวศ 2)',
    time: '1 ชั่วโมงที่แล้ว',
    type: 'status',
    isRead: false,
    link: '/admin/issues',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    targetRole: 'admin',
    targetEmail: 'jiranyanov1980@gmail.com',
    targetName: 'Achiraya',
    issueId: 'ISS-2026-107',
    readBy: [],
  },

  // ================= BROADCAST FOR ALL ADMINS =================
  {
    id: 309,
    title: 'สรุปการดำเนินงานระบบประจำวัน',
    description: 'มีเรื่องร้องเรียนใหม่ 4 รายการ และดำเนินการแก้ไขเสร็จสิ้น 2 รายการในสัปดาห์นี้',
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

    // Upgrade/reset to v3 with comprehensive per-user mock data if version mismatch or empty
    if (version !== 'v3' || !saved) {
      window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(initialNotifications))
      window.localStorage.setItem(NOTIFICATIONS_VERSION_KEY, 'v3')
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
      window.localStorage.setItem(NOTIFICATIONS_VERSION_KEY, 'v3')
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
