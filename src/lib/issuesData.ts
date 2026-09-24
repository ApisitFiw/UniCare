export type UrgencyLevel = 'เร่งด่วนมาก' | 'เร่งด่วน' | 'ปกติ'

export type IssueItem = {
  id: string
  date: string
  category: string
  area: string
  description: string
  adminName: string
  adminInitial: string
  reporterName?: string
  reporterEmail?: string
  status: 'pending' | 'in_progress' | 'resolved'
  statusLabel: string
  urgency?: UrgencyLevel
}

export type TimelineEntry = {
  statusText: string
  time: string
  note: string
  author: string
  color: string
}

export const STANDARD_CATEGORIES = [
  'เสียงรบกวน',
  'ขยะ / ของเสีย',
  'น้ำ / น้ำเสีย',
  'อากาศ / มลพิษ',
  'แสงสว่าง',
  'ต้นไม้ / พื้นที่สีเขียว',
  'อื่น ๆ',
] as const

export type StandardCategory = (typeof STANDARD_CATEGORIES)[number]

export const initialMockIssues: IssueItem[] = [
  {
    id: 'ISS-2026-101',
    date: '07 ก.ย. 2568 - 14:20',
    category: 'เสียงรบกวน',
    area: 'หอพักลักษณานิเวศ 3',
    description: 'เสียงดนตรีเปิดล้ำ 23.00 น. รบกวนเวลาพักผ่อน',
    adminName: 'นัฐกรณ์ (Admin)',
    adminInitial: 'นก',
    reporterName: 'กิตติภูมิ',
    reporterEmail: 'kittipoom@example.com',
    status: 'in_progress',
    statusLabel: 'กำลังดำเนินการ',
    urgency: 'เร่งด่วนมาก',
  },
  {
    id: 'ISS-2026-102',
    date: '06 ก.ย. 2568 - 11:10',
    category: 'ขยะ / ของเสีย',
    area: 'โรงอาหารกลาง',
    description: 'ถังขยะล้น ส่งกลิ่นเหม็นและมีแมลงวัน',
    adminName: 'Chanokporn (Admin)',
    adminInitial: 'CH',
    reporterName: 'สมชาย ใจดี',
    reporterEmail: 'somchai@example.com',
    status: 'resolved',
    statusLabel: 'แก้ไขสำเร็จ',
    urgency: 'เร่งด่วน',
  },
  {
    id: 'ISS-2026-103',
    date: '07 ก.ย. 2568 - 16:45',
    category: 'น้ำ / น้ำเสีย',
    area: 'อาคารเรียนรวม 5',
    description: 'ท่อระบายน้ำอุดตัน น้ำระบายไม่ทันเมื่อฝนตก',
    adminName: 'Apisit (Admin)',
    adminInitial: 'AP',
    reporterName: 'นภัสสร แสงทอง',
    reporterEmail: 'napatsorn@example.com',
    status: 'pending',
    statusLabel: 'รอดำเนินการ',
    urgency: 'เร่งด่วนมาก',
  },
  {
    id: 'ISS-2026-104',
    date: '08 ก.ย. 2568 - 09:15',
    category: 'แสงสว่าง',
    area: 'ทางเดินเชื่อมอาคารเรียนรวม 7 - ศูนย์บรรณสาร',
    description: 'ไฟทางเดินดับตลอดแนวช่วงค่ำ เสี่ยงต่อความปลอดภัยของนักศึกษาและบุคลากร',
    adminName: 'กฤตภาส (Admin)',
    adminInitial: 'กภ',
    reporterName: 'กิตติพงษ์ ศรีสุข',
    reporterEmail: 'kittipong@example.com',
    status: 'in_progress',
    statusLabel: 'กำลังดำเนินการ',
    urgency: 'เร่งด่วน',
  },
  {
    id: 'ISS-2026-105',
    date: '08 ก.ย. 2568 - 13:40',
    category: 'ต้นไม้ / พื้นที่สีเขียว',
    area: 'ลานกิจกรรมหน้าอาคารสถาปัตยกรรมศาสตร์',
    description: 'กิ่งไม้ขนาดใหญ่หักพาดสายไฟและกีดขวางทางสัญจร หวั่นเกิดอันตรายเมื่อมีลมแรง',
    adminName: 'Natthaphum (Admin)',
    adminInitial: 'NP',
    reporterName: 'พิมพ์ชนก วัฒนะ',
    reporterEmail: 'pimchanok@example.com',
    status: 'pending',
    statusLabel: 'รอดำเนินการ',
    urgency: 'เร่งด่วน',
  },
  {
    id: 'ISS-2026-106',
    date: '09 ก.ย. 2568 - 10:25',
    category: 'อากาศ / มลพิษ',
    area: 'ด้านหลังอาคารวิจัยและนวัตกรรม',
    description: 'มีกลิ่นสารเคมีคล้ายควันไหม้รบกวนห้องเรียนและห้องปฏิบัติการ',
    adminName: 'Kittipoom (Admin)',
    adminInitial: 'KP',
    reporterName: 'กิตติภูมิ',
    reporterEmail: 'kittipoom@example.com',
    status: 'resolved',
    statusLabel: 'แก้ไขสำเร็จ',
    urgency: 'ปกติ',
  },
  {
    id: 'ISS-2026-107',
    date: '09 ก.ย. 2568 - 15:50',
    category: 'ขยะ / ของเสีย',
    area: 'หอพักลักษณานิเวศ 2',
    description: 'ถังขยะแยกประเภทชำรุดและขยะล้น ส่งกลิ่นรบกวนบริเวณทางเดินหอพัก',
    adminName: 'Achiraya (Admin)',
    adminInitial: 'AC',
    reporterName: 'สมชาย ใจดี',
    reporterEmail: 'somchai@example.com',
    status: 'in_progress',
    statusLabel: 'กำลังดำเนินการ',
    urgency: 'เร่งด่วน',
  },
  {
    id: 'ISS-2026-108',
    date: '10 ก.ย. 2568 - 08:30',
    category: 'เสียงรบกวน',
    area: 'วงเวียนหอพักนักศึกษา - ประตูทางเข้ามหาวิทยาลัย',
    description: 'รถจักรยานยนต์ดัดแปลงท่อไอเสียเสียงดังและเปิดเครื่องเสียงรบกวนยามวิกาล',
    adminName: 'นัฐกรณ์ (Admin)',
    adminInitial: 'นก',
    reporterName: 'นภัสสร แสงทอง',
    reporterEmail: 'napatsorn@example.com',
    status: 'pending',
    statusLabel: 'รอดำเนินการ',
    urgency: 'ปกติ',
  },
  {
    id: 'ISS-2026-109',
    date: '10 ก.ย. 2568 - 11:15',
    category: 'น้ำ / น้ำเสีย',
    area: 'โรงอาหารกลาง',
    description: 'ท่อระบายน้ำบริเวณจุดล้างจานชำรุด มีน้ำขังเอ่อล้นและส่งกลิ่น',
    adminName: 'Chanokporn (Admin)',
    adminInitial: 'CH',
    reporterName: 'กิตติพงษ์ ศรีสุข',
    reporterEmail: 'kittipong@example.com',
    status: 'in_progress',
    statusLabel: 'กำลังดำเนินการ',
    urgency: 'เร่งด่วนมาก',
  },
  {
    id: 'ISS-2026-110',
    date: '10 ก.ย. 2568 - 14:00',
    category: 'แสงสว่าง',
    area: 'อาคารเรียนรวม 5',
    description: 'หลอดไฟทางเดินชั้น 2 ขาด 2 จุด ทางเดินมืดช่วงค่ำ',
    adminName: 'Apisit (Admin)',
    adminInitial: 'AP',
    reporterName: 'พิมพ์ชนก วัฒนะ',
    reporterEmail: 'pimchanok@example.com',
    status: 'in_progress',
    statusLabel: 'กำลังดำเนินการ',
    urgency: 'ปกติ',
  },
]

export const initialTimelineHistory: Record<string, TimelineEntry[]> = {
  'ISS-2026-101': [
    {
      statusText: 'เปลี่ยนสถานะเป็น: กำลังดำเนินการ',
      time: '07 ก.ย. 2568, 14:30 น.',
      note: 'เจ้าหน้าที่เข้าตรวจสอบพื้นที่และประสานงานผู้เกี่ยวข้องเรียบร้อย',
      author: 'นัฐกรณ์ (Admin)',
      color: 'bg-blue-600',
    },
    {
      statusText: 'สร้างเรื่องร้องเรียน (Reported)',
      time: '07 ก.ย. 2568, 14:20 น.',
      note: 'ผู้ใช้งานแจ้งเรื่องร้องเรียนผ่านระบบ UNICARE',
      author: 'ระบบอัตโนมัติ',
      color: 'bg-amber-500',
    },
  ],
  'ISS-2026-102': [
    {
      statusText: 'เปลี่ยนสถานะเป็น: แก้ไขสำเร็จ',
      time: '06 ก.ย. 2568, 16:00 น.',
      note: 'เจ้าหน้าที่ดำเนินการเก็บขยะและทำความสะอาดพื้นที่เรียบร้อยแล้ว',
      author: 'นัฐกรณ์ (Admin)',
      color: 'bg-emerald-600',
    },
    {
      statusText: 'สร้างเรื่องร้องเรียน (Reported)',
      time: '06 ก.ย. 2568, 11:10 น.',
      note: 'ผู้ใช้งานแจ้งเรื่องร้องเรียนผ่านระบบ UNICARE',
      author: 'ระบบอัตโนมัติ',
      color: 'bg-amber-500',
    },
  ],
  'ISS-2026-103': [
    {
      statusText: 'สร้างเรื่องร้องเรียน (Reported)',
      time: '07 ก.ย. 2568, 16:45 น.',
      note: 'ผู้ใช้งานแจ้งเรื่องร้องเรียนผ่านระบบ UNICARE',
      author: 'ระบบอัตโนมัติ',
      color: 'bg-amber-500',
    },
  ],
  'ISS-2026-104': [
    {
      statusText: 'เปลี่ยนสถานะเป็น: กำลังดำเนินการ',
      time: '08 ก.ย. 2568, 10:00 น.',
      note: 'ช่างไฟฟ้าเข้าสำรวจและตรวจสอบสายส่งกำลังไฟทางเดิน',
      author: 'กฤตภาส (Admin)',
      color: 'bg-blue-600',
    },
    {
      statusText: 'สร้างเรื่องร้องเรียน (Reported)',
      time: '08 ก.ย. 2568, 09:15 น.',
      note: 'บุคลากรแจ้งเหตุไฟดับบริเวณทางเดินผ่านระบบ UNICARE',
      author: 'ระบบอัตโนมัติ',
      color: 'bg-amber-500',
    },
  ],
  'ISS-2026-105': [
    {
      statusText: 'สร้างเรื่องร้องเรียน (Reported)',
      time: '08 ก.ย. 2568, 13:40 น.',
      note: 'รับแจ้งเหตุกิ่งไม้หักพาดสายไฟ ประสานงานฝ่ายอาคารและสถานที่เตรียมเข้าตัดแต่งกิ่ง',
      author: 'Natthaphum (Admin)',
      color: 'bg-amber-500',
    },
  ],
  'ISS-2026-106': [
    {
      statusText: 'เปลี่ยนสถานะเป็น: แก้ไขสำเร็จ',
      time: '09 ก.ย. 2568, 15:30 น.',
      note: 'เจ้าหน้าที่สิ่งแวดล้อมเข้าตรวจสอบ พบการทดสอบระบบบำบัดอากาศ ดำเนินการปรับจูนระบบฟิลเตอร์กลิ่นเรียบร้อยแล้ว',
      author: 'Kittipoom (Admin)',
      color: 'bg-emerald-600',
    },
    {
      statusText: 'เปลี่ยนสถานะเป็น: กำลังดำเนินการ',
      time: '09 ก.ย. 2568, 11:00 น.',
      note: 'ทีมตรวจสอบเข้าวัดระดับมลพิษในอากาศและตรวจสอบแหล่งกำเนิดกลิ่น',
      author: 'Kittipoom (Admin)',
      color: 'bg-blue-600',
    },
    {
      statusText: 'สร้างเรื่องร้องเรียน (Reported)',
      time: '09 ก.ย. 2568, 10:25 น.',
      note: 'ผู้ใช้งานแจ้งปัญหากลิ่นสารเคมีผ่านระบบ UNICARE',
      author: 'ระบบอัตโนมัติ',
      color: 'bg-amber-500',
    },
  ],
  'ISS-2026-107': [
    {
      statusText: 'เปลี่ยนสถานะเป็น: กำลังดำเนินการ',
      time: '10 ก.ย. 2568, 09:00 น.',
      note: 'ฝ่ายช่างอาคารและแม่บ้านนำถังขยะสำรองมาสับเปลี่ยน และทำความสะอาดคราบขยะบริเวณทางเดินเรียบร้อย',
      author: 'Achiraya (Admin)',
      color: 'bg-blue-600',
    },
    {
      statusText: 'สร้างเรื่องร้องเรียน (Reported)',
      time: '09 ก.ย. 2568, 15:50 น.',
      note: 'นักศึกษาแจ้งเหตุถังขยะชำรุดและขยะล้นส่งกลิ่นผ่านระบบ UNICARE',
      author: 'ระบบอัตโนมัติ',
      color: 'bg-amber-500',
    },
  ],
  'ISS-2026-108': [
    {
      statusText: 'สร้างเรื่องร้องเรียน (Reported)',
      time: '10 ก.ย. 2568, 08:30 น.',
      note: 'รับเรื่องร้องเรียนจากผู้พักอาศัย ประสานงานฝ่ายรักษาความปลอดภัยตั้งจุดตรวจวัดระดับเสียงและเตือนผู้ขับขี่',
      author: 'นัฐกรณ์ (Admin)',
      color: 'bg-amber-500',
    },
  ],
  'ISS-2026-109': [
    {
      statusText: 'เปลี่ยนสถานะเป็น: กำลังดำเนินการ',
      time: '10 ก.ย. 2568, 12:00 น.',
      note: 'เจ้าหน้าที่ฝ่ายอาคารและสถานที่เข้าตรวจสอบท่อระบายน้ำจุดล้างจานในโรงอาหาร',
      author: 'Chanokporn (Admin)',
      color: 'bg-blue-600',
    },
    {
      statusText: 'สร้างเรื่องร้องเรียน (Reported)',
      time: '10 ก.ย. 2568, 11:15 น.',
      note: 'ผู้ใช้งานแจ้งปัญหาน้ำท่วมขังและท่อระบายน้ำชำรุดผ่านระบบ UNICARE',
      author: 'ระบบอัตโนมัติ',
      color: 'bg-amber-500',
    },
  ],
  'ISS-2026-110': [
    {
      statusText: 'เปลี่ยนสถานะเป็น: กำลังดำเนินการ',
      time: '10 ก.ย. 2568, 15:00 น.',
      note: 'ช่างไฟฟ้ารับเรื่องเตรียมนำหลอดไฟ LED ไปเปลี่ยนทดแทนที่อาคารเรียนรวม 5 ชั้น 2',
      author: 'Apisit (Admin)',
      color: 'bg-blue-600',
    },
    {
      statusText: 'สร้างเรื่องร้องเรียน (Reported)',
      time: '10 ก.ย. 2568, 14:00 น.',
      note: 'ผู้ใช้งานแจ้งปัญหาหลอดไฟทางเดินขาดผ่านระบบ UNICARE',
      author: 'ระบบอัตโนมัติ',
      color: 'bg-amber-500',
    },
  ],
}

export type CategoryMetadata = {
  id: number
  name: StandardCategory
  description: string
  status: string
}

export const DEFAULT_CATEGORY_METADATA: CategoryMetadata[] = [
  {
    id: 1,
    name: 'ขยะ / ของเสีย',
    description: 'ปัญหาขยะล้นถัง ขยะตกค้าง ขยะอันตราย หรือกลิ่นเหม็นรบกวน',
    status: 'เปิดใช้งาน',
  },
  {
    id: 2,
    name: 'เสียงรบกวน',
    description: 'ปัญหาเสียงดัง ยานพาหนะ กิจกรรม หรือการก่อสร้างรบกวน',
    status: 'เปิดใช้งาน',
  },
  {
    id: 3,
    name: 'น้ำ / น้ำเสีย',
    description: 'ปัญหาน้ำรั่วซึม น้ำท่วมขัง ท่อระบายน้ำอุดตัน หรือน้ำเสีย',
    status: 'เปิดใช้งาน',
  },
  {
    id: 4,
    name: 'อากาศ / มลพิษ',
    description: 'ปัญหาฝุ่นละออง ควันไฟ กลิ่นสารเคมี หรือมลพิษทางอากาศ',
    status: 'เปิดใช้งาน',
  },
  {
    id: 5,
    name: 'แสงสว่าง',
    description: 'ปัญหาไฟทางเดินดับ ไฟกะพริบ แสงสว่างไม่เพียงพอ หรือส่องรบกวน',
    status: 'เปิดใช้งาน',
  },
  {
    id: 6,
    name: 'ต้นไม้ / พื้นที่สีเขียว',
    description: 'ปัญหากิ่งไม้หัก ต้นไม้ล้ม กิ่งไม้ยื่นกีดขวาง หรือพื้นที่สีเขียวเสียหาย',
    status: 'เปิดใช้งาน',
  },
  {
    id: 7,
    name: 'อื่น ๆ',
    description: 'ปัญหาและข้อเสนอแนะอื่น ๆ ทั่วไปที่ไม่เข้าหมวดหมู่หลัก',
    status: 'เปิดใช้งาน',
  },
]

export function getCategoryIcon(name: string): string {
  if (name.includes('ขยะ')) return '🗑️'
  if (name.includes('น้ำ')) return '💧'
  if (name.includes('อากาศ') || name.includes('มลพิษ')) return '🌫️'
  if (name.includes('แสง') || name.includes('ไฟ')) return '💡'
  if (name.includes('ต้นไม้')) return '🌳'
  if (name.includes('เสียง')) return '🔊'
  return '📋'
}

export function matchCategory(issueCategory: string, targetCategory: string): boolean {
  if (!issueCategory) return false
  const cleanIssue = issueCategory.trim().toLowerCase()
  const cleanTarget = targetCategory.trim().toLowerCase()
  if (cleanIssue === cleanTarget) return true

  if (cleanTarget === 'ขยะ / ของเสีย' && cleanIssue.includes('ขยะ')) return true
  if (cleanTarget === 'น้ำ / น้ำเสีย' && cleanIssue.includes('น้ำ')) return true
  if (cleanTarget === 'อากาศ / มลพิษ' && (cleanIssue.includes('อากาศ') || cleanIssue.includes('มลพิษ'))) return true
  if (cleanTarget === 'เสียงรบกวน' && cleanIssue.includes('เสียง')) return true
  if (cleanTarget === 'แสงสว่าง' && (cleanIssue.includes('แสง') || cleanIssue.includes('ไฟ'))) return true
  if (
    cleanTarget === 'ต้นไม้ / พื้นที่สีเขียว' &&
    (cleanIssue.includes('ต้นไม้') || cleanIssue.includes('พื้นที่เขียว') || cleanIssue.includes('พื้นที่สีเขียว'))
  )
    return true
  if (cleanTarget === 'อื่น ๆ' && (cleanIssue.includes('อื่น') || cleanIssue.includes('ทั่วไป'))) return true

  return false
}

export function getCurrentAdminDisplayName(): string {
  if (typeof window !== 'undefined') {
    try {
      const savedAdmin = window.localStorage.getItem('unicare_demo_admin_profile')
      if (savedAdmin) {
        const parsed = JSON.parse(savedAdmin)
        if (parsed?.fullName) return `${parsed.fullName} (Admin)`
      }
      const savedSession =
        window.sessionStorage.getItem('unicare_demo_session') ||
        window.localStorage.getItem('unicare_demo_session')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        if (session?.role === 'admin' && session?.name) {
          return `${session.name} (Admin)`
        }
      }
    } catch {
      // ignore
    }
  }
  return 'นัฐกรณ์ (Admin)'
}

export function getCurrentUserDisplayName(): string {
  if (typeof window !== 'undefined') {
    try {
      const savedUser = window.localStorage.getItem('unicare_demo_user_profile')
      if (savedUser) {
        const parsed = JSON.parse(savedUser)
        if (parsed?.fullName) return parsed.fullName
      }
      const savedSession =
        window.sessionStorage.getItem('unicare_demo_session') ||
        window.localStorage.getItem('unicare_demo_session')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        if (session?.role === 'user' && session?.name) {
          return session.name
        }
      }
    } catch {
      // ignore
    }
  }
  return 'กิตติภูมิ'
}

export function getSystemAdminNames(): string[] {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem('unicare_demo_system_users')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const admins = parsed
            .filter((u: any) => u.role === 'admin' && u.name)
            .map((u: any) => u.name as string)
          if (admins.length > 0) return admins
        }
      }
    } catch {
      // ignore
    }
  }
  return [
    'นัฐกรณ์',
    'Chanokporn',
    'Apisit',
    'กฤตภาส',
    'Natthaphum',
    'Kittipoom',
    'Achiraya',
  ]
}

export function getAdminInitials(name: string): string {
  const clean = name.replace(/\(Admin\)/g, '').replace(/ผู้ดูแลระบบ/g, '').trim()
  if (clean === 'นัฐกรณ์') return 'นก'
  if (clean === 'กฤตภาส') return 'กภ'
  if (clean.toLowerCase() === 'chanokporn') return 'CH'
  if (clean.toLowerCase() === 'apisit') return 'AP'
  if (clean.toLowerCase() === 'natthaphum') return 'NP'
  if (clean.toLowerCase() === 'kittipoom') return 'KP'
  if (clean.toLowerCase() === 'achiraya') return 'AC'
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`
  return clean.slice(0, 2).toUpperCase() || 'AD'
}

export function normalizeIssueAdminName(
  rawAdminName?: string | null,
  fallbackIndex = 0,
): {
  adminName: string
  adminInitial: string
} {
  const validAdmins = getSystemAdminNames()
  const defaultAdmin = validAdmins[fallbackIndex % validAdmins.length] || 'นัฐกรณ์'

  if (!rawAdminName) {
    const formatted = `${defaultAdmin} (Admin)`
    return { adminName: formatted, adminInitial: getAdminInitials(formatted) }
  }

  const clean = rawAdminName.replace(/\(Admin\)/g, '').replace(/ผู้ดูแลระบบ/g, '').trim()

  // Exact or substring match with active admin list from User Management
  const matched = validAdmins.find(
    (a) =>
      a.toLowerCase() === clean.toLowerCase() ||
      clean.toLowerCase().includes(a.toLowerCase()) ||
      a.toLowerCase().includes(clean.toLowerCase()),
  )
  if (matched) {
    const formatted = `${matched} (Admin)`
    return { adminName: formatted, adminInitial: getAdminInitials(formatted) }
  }

  // Legacy mock names mapping to real admins
  if (clean.includes('อภิสิทธิ์') || clean.toLowerCase() === 'apisit') {
    const apisit = validAdmins.find((a) => a.toLowerCase() === 'apisit') || 'Apisit'
    const formatted = `${apisit} (Admin)`
    return { adminName: formatted, adminInitial: getAdminInitials(formatted) }
  }
  if (clean.includes('ธีรภัทร')) {
    const target = validAdmins[fallbackIndex % validAdmins.length] || 'กฤตภาส'
    const formatted = `${target} (Admin)`
    return { adminName: formatted, adminInitial: getAdminInitials(formatted) }
  }
  if (clean.includes('นัฐกรณ์') || clean.includes('ไพรพฤกษ์')) {
    const nat = validAdmins.find((a) => a.includes('นัฐกรณ์')) || 'นัฐกรณ์'
    const formatted = `${nat} (Admin)`
    return { adminName: formatted, adminInitial: getAdminInitials(formatted) }
  }

  const formatted = `${defaultAdmin} (Admin)`
  return { adminName: formatted, adminInitial: getAdminInitials(formatted) }
}

export function getAllCurrentIssues(): IssueItem[] {
  if (typeof window === 'undefined') {
    return initialMockIssues
  }

  let mappedFromLocal: IssueItem[] = []
  try {
    const savedReports = window.localStorage.getItem('unicare_demo_issue_reports')
    if (savedReports) {
      const parsed = JSON.parse(savedReports)
      if (Array.isArray(parsed) && parsed.length > 0) {
        mappedFromLocal = parsed
          .filter((item: any) => {
            const rawStatus = (item.status || 'Pending').toLowerCase()
            if (rawStatus === 'closed' || rawStatus === 'rejected') return false
            const rawId = String(item.issue_id ?? item.id ?? '')
            if (rawId.startsWith('ISS-') || initialMockIssues.some((m) => m.id === rawId)) return true
            if (item.source === 'admin') return true
            return rawStatus === 'in_progress' || rawStatus === 'resolved' || rawStatus === 'pending'
          })
          .map((item: any, idx: number) => {
            const rawStatus = (item.status || 'Pending').toLowerCase()
            let statusKey: 'pending' | 'in_progress' | 'resolved' = 'pending'
            let statusLabel = 'รอดำเนินการ'
            if (rawStatus === 'in_progress') {
              statusKey = 'in_progress'
              statusLabel = 'กำลังดำเนินการ'
            } else if (rawStatus === 'resolved' || rawStatus === 'closed') {
              statusKey = 'resolved'
              statusLabel = 'แก้ไขสำเร็จ'
            }

            const rawId = item.issue_id ?? item.id
            const displayId = String(rawId).startsWith('ISS-')
              ? String(rawId)
              : `ISS-2026-${String(rawId).padStart(3, '0')}`

            const originalMock = initialMockIssues.find((m) => m.id === displayId)

            let urgency: 'เร่งด่วนมาก' | 'เร่งด่วน' | 'ปกติ' = originalMock?.urgency || 'ปกติ'
            if (item.urgency === 'เร่งด่วนมาก' || item.urgency === 'เร่งด่วน' || item.urgency === 'ปกติ') {
              urgency = item.urgency
            } else if (item.severity === 'High' || item.severity === 'Critical') {
              urgency = 'เร่งด่วนมาก'
            } else if (item.severity === 'Medium') {
              urgency = 'เร่งด่วน'
            } else if (item.severity === 'Low') {
              urgency = 'ปกติ'
            }

            const dateStr = item.date_created
              ? new Date(item.date_created).toLocaleDateString('th-TH', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : originalMock?.date || 'วันนี้'

            const itemAdminName = item.adminName || item.admin_name || originalMock?.adminName
            const normalized = normalizeIssueAdminName(itemAdminName, idx)
            const itemReporterName = item.reporter_name || item.reporterName || originalMock?.reporterName || 'ผู้ใช้งานทั่วไป'
            const itemReporterEmail = item.reporter_email || item.reporterEmail || originalMock?.reporterEmail || ''

            return {
              id: displayId,
              date: dateStr,
              category: item.issue_categories?.category_name || item.title || originalMock?.category || 'อื่น ๆ',
              area: item.issue_areas?.area_name || item.location || originalMock?.area || 'มหาวิทยาลัยวลัยลักษณ์',
              description: item.description || item.title || originalMock?.description || 'รายละเอียดเรื่องร้องเรียน',
              adminName: normalized.adminName,
              adminInitial: normalized.adminInitial,
              reporterName: itemReporterName,
              reporterEmail: itemReporterEmail,
              status: statusKey,
              statusLabel,
              urgency,
            }
          })
      }
    }
  } catch {
    // ignore
  }

  const existingIds = new Set(mappedFromLocal.map((i) => i.id))
  const fallbackItems = initialMockIssues
    .filter((p) => !existingIds.has(p.id))
    .map((item, idx) => {
      const normalized = normalizeIssueAdminName(item.adminName, idx)
      return {
        ...item,
        adminName: normalized.adminName,
        adminInitial: normalized.adminInitial,
      }
    })
  return [...mappedFromLocal, ...fallbackItems]
}

export function getDefaultCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {
    'เสียงรบกวน': 0,
    'ขยะ / ของเสีย': 0,
    'น้ำ / น้ำเสีย': 0,
    'อากาศ / มลพิษ': 0,
    'แสงสว่าง': 0,
    'ต้นไม้ / พื้นที่สีเขียว': 0,
    'อื่น ๆ': 0,
  }

  initialMockIssues.forEach((issue) => {
    let matched = false
    for (const cat of STANDARD_CATEGORIES) {
      if (matchCategory(issue.category, cat)) {
        counts[cat] = (counts[cat] || 0) + 1
        matched = true
        break
      }
    }
    if (!matched) {
      counts['อื่น ๆ'] = (counts['อื่น ๆ'] || 0) + 1
    }
  })

  return counts
}

export function getCategoryCounts(): Record<string, number> {
  const issues = getAllCurrentIssues()
  const counts: Record<string, number> = {
    'เสียงรบกวน': 0,
    'ขยะ / ของเสีย': 0,
    'น้ำ / น้ำเสีย': 0,
    'อากาศ / มลพิษ': 0,
    'แสงสว่าง': 0,
    'ต้นไม้ / พื้นที่สีเขียว': 0,
    'อื่น ๆ': 0,
  }

  issues.forEach((issue) => {
    let matched = false
    for (const cat of STANDARD_CATEGORIES) {
      if (matchCategory(issue.category, cat)) {
        counts[cat] = (counts[cat] || 0) + 1
        matched = true
        break
      }
    }
    if (!matched) {
      counts['อื่น ๆ'] = (counts['อื่น ๆ'] || 0) + 1
    }
  })

  return counts
}

export function getSavedCategoryMetadata(): CategoryMetadata[] {
  if (typeof window === 'undefined') {
    return DEFAULT_CATEGORY_METADATA
  }
  try {
    const saved = window.localStorage.getItem('unicare_category_metadata')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_CATEGORY_METADATA
}

export function getDisabledCategoryNames(): string[] {
  const metadata = getSavedCategoryMetadata()
  return metadata
    .filter((cat) => cat.status === 'ปิดใช้งาน' || cat.status === 'ปิดรับแจ้ง')
    .map((cat) => cat.name)
}

export type LocationGroupedRiskArea = {
  id: string
  name: string
  lat: number
  lng: number
  issues: IssueItem[]
  issueCount: number
  highestUrgency: 'เร่งด่วนมาก' | 'เร่งด่วน' | 'ปกติ'
  highestUrgencyColor: string
  primaryProblem: string
  category?: string
  isPinned?: boolean
}

export type CampusPlace = {
  name: string
  category: string
  defaultLat: number
  defaultLng: number
}

export const ALL_REPORT_PLACES: CampusPlace[] = [
  // อาคารเรียน (พิกัดตาม OpenStreetMap ม.วลัยลักษณ์)
  { name: 'อาคารเรียนรวม 1', category: 'อาคารเรียน', defaultLat: 8.643685, defaultLng: 99.896745 },
  { name: 'อาคารเรียนรวม 3', category: 'อาคารเรียน', defaultLat: 8.644644, defaultLng: 99.896678 },
  { name: 'อาคารเรียนรวม 5', category: 'อาคารเรียน', defaultLat: 8.644655, defaultLng: 99.898119 },
  { name: 'อาคารเรียนรวม 7', category: 'อาคารเรียน', defaultLat: 8.643690, defaultLng: 99.898136 },
  { name: 'อาคารเรียนรวม ST', category: 'อาคารเรียน', defaultLat: 8.644292, defaultLng: 99.899070 },

  // หอพักลักษณานิเวศ (พิกัดตาม OpenStreetMap ม.วลัยลักษณ์)
  { name: 'หอพักลักษณานิเวศ 1', category: 'หอพัก', defaultLat: 8.647719, defaultLng: 99.897350 },
  { name: 'หอพักลักษณานิเวศ 2', category: 'หอพัก', defaultLat: 8.647725, defaultLng: 99.896270 },
  { name: 'หอพักนักศึกษาหญิง 2', category: 'หอพัก', defaultLat: 8.647725, defaultLng: 99.896270 },
  { name: 'หอพักลักษณานิเวศ 3', category: 'หอพัก', defaultLat: 8.648252, defaultLng: 99.895099 },
  { name: 'หอพักนักศึกษาชาย 3', category: 'หอพัก', defaultLat: 8.648252, defaultLng: 99.895099 },
  { name: 'หอพักลักษณานิเวศ 4', category: 'หอพัก', defaultLat: 8.648243, defaultLng: 99.893073 },
  { name: 'หอพักลักษณานิเวศ 5', category: 'หอพัก', defaultLat: 8.647697, defaultLng: 99.892052 },
  { name: 'หอพักลักษณานิเวศ 7', category: 'หอพัก', defaultLat: 8.648308, defaultLng: 99.891510 },
  { name: 'หอพักลักษณานิเวศ 10', category: 'หอพัก', defaultLat: 8.648793, defaultLng: 99.892760 },
  { name: 'หอพักลักษณานิเวศ 11', category: 'หอพัก', defaultLat: 8.648858, defaultLng: 99.895649 },
  { name: 'หอพักลักษณานิเวศ 14', category: 'หอพัก', defaultLat: 8.649015, defaultLng: 99.897208 },
  { name: 'หอพักลักษณานิเวศ 16', category: 'หอพัก', defaultLat: 8.647698, defaultLng: 99.889579 },
  { name: 'หอพักลักษณานิเวศ 17', category: 'หอพัก', defaultLat: 8.647711, defaultLng: 99.888578 },
  { name: 'หอพักลักษณานิเวศ 18', category: 'หอพัก', defaultLat: 8.648137, defaultLng: 99.889388 },
  // หอพัก/ที่พักที่ไม่มีบนแผนที่ OpenStreetMap (ยังไม่ได้ปักหมุด)
  { name: 'WU Residence A', category: 'หอพัก', defaultLat: 8.6472, defaultLng: 99.9030 },
  { name: 'WU Residence B', category: 'หอพัก', defaultLat: 8.6474, defaultLng: 99.9033 },
  { name: 'WU Residence C', category: 'หอพัก', defaultLat: 8.6476, defaultLng: 99.9036 },

  // โรงอาหาร (พิกัดตาม OpenStreetMap ม.วลัยลักษณ์)
  { name: 'โรงอาหารกลาง', category: 'โรงอาหาร', defaultLat: 8.647428, defaultLng: 99.894577 },
  { name: 'โรงกิจ', category: 'โรงอาหาร', defaultLat: 8.647474, defaultLng: 99.894104 },
  { name: 'โรงมืด', category: 'โรงอาหาร', defaultLat: 8.6474, defaultLng: 99.8942 },

  // ห้องสมุด (พิกัดตาม OpenStreetMap ม.วลัยลักษณ์)
  { name: 'ศูนย์บรรณสารและสื่อการศึกษา', category: 'ห้องสมุด', defaultLat: 8.642673, defaultLng: 99.899053 },
  { name: 'ห้องสมุด', category: 'ห้องสมุด', defaultLat: 8.642673, defaultLng: 99.899053 },

  // สนามกีฬา
  { name: 'สนามฟุตซอลในร่มมาตรฐาน', category: 'สนามกีฬา', defaultLat: 8.649657, defaultLng: 99.891230 },
  { name: 'สนามกีฬาเทนนิส', category: 'สนามกีฬา', defaultLat: 8.647386, defaultLng: 99.890922 },
  { name: 'สนามเทนนิส', category: 'สนามกีฬา', defaultLat: 8.647386, defaultLng: 99.890922 },
  { name: 'สนามฟุตซอลกลางแจ้ง', category: 'สนามกีฬา', defaultLat: 8.6492, defaultLng: 99.8915 },
  { name: 'สนามฟุตบอลหญ้าเทียม', category: 'สนามกีฬา', defaultLat: 8.6488, defaultLng: 99.8910 },
  { name: 'สนามบาสเกตบอล', category: 'สนามกีฬา', defaultLat: 8.6480, defaultLng: 99.8910 },
  { name: 'สนามไดร์ฟกอล์ฟ', category: 'สนามกีฬา', defaultLat: 8.6398, defaultLng: 99.8940 },
  { name: 'สนามแบดมินตัน', category: 'สนามกีฬา', defaultLat: 8.6495, defaultLng: 99.8910 },

  // ถนน / ทางเดิน
  { name: 'ทางเดินเชื่อมอาคารเรียนรวม 7 - ศูนย์บรรณสาร', category: 'ถนน / ทางเดิน', defaultLat: 8.643180, defaultLng: 99.898600 },
  { name: 'ทางเดินบริเวณอาคารเรียน', category: 'ถนน / ทางเดิน', defaultLat: 8.6445, defaultLng: 99.8975 },
  { name: 'ทางเดินบริเวณหอพัก', category: 'ถนน / ทางเดิน', defaultLat: 8.6465, defaultLng: 99.9020 },
  { name: 'ถนนบริเวณโรงอาหาร', category: 'ถนน / ทางเดิน', defaultLat: 8.6474, defaultLng: 99.8945 },
  { name: 'วงเวียนหอพักนักศึกษา - ประตูทางเข้ามหาวิทยาลัย', category: 'ถนน / ทางเดิน', defaultLat: 8.6475, defaultLng: 99.9025 },
  { name: 'วงเวียนหอพัก', category: 'ถนน / ทางเดิน', defaultLat: 8.6475, defaultLng: 99.9025 },

  // พื้นที่ส่วนกลางอื่นๆ
  { name: 'ลานกิจกรรมหน้าอาคารสถาปัตยกรรมศาสตร์', category: 'พื้นที่กิจกรรม', defaultLat: 8.644405, defaultLng: 99.892989 },
  { name: 'ด้านหลังอาคารวิจัยและนวัตกรรม', category: 'พื้นที่วิจัย', defaultLat: 8.640352, defaultLng: 99.899105 },
  { name: 'พื้นที่ริมสระน้ำ', category: 'พื้นที่พักผ่อน', defaultLat: 8.6440, defaultLng: 99.9018 },
]

export type PinnedLocation = {
  id: string
  name: string
  category?: string
  lat: number
  lng: number
  description?: string
  createdAt?: string
}

// 25 สถานที่ที่มีชื่อและตำแหน่งชัดเจนบน OpenStreetMap มหาวิทยาลัยวลัยลักษณ์
export const DEFAULT_PINNED_LOCATIONS: PinnedLocation[] = [
  // --- อาคารเรียน ---
  {
    id: 'pin-bld-1',
    name: 'อาคารเรียนรวม 1',
    category: 'อาคารเรียน',
    lat: 8.643685,
    lng: 99.896745,
    description: 'อาคารเรียนรวม 1 มหาวิทยาลัยวลัยลักษณ์',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-bld-3',
    name: 'อาคารเรียนรวม 3',
    category: 'อาคารเรียน',
    lat: 8.644644,
    lng: 99.896678,
    description: 'อาคารเรียนรวม 3 มหาวิทยาลัยวลัยลักษณ์',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-bld-5',
    name: 'อาคารเรียนรวม 5',
    category: 'อาคารเรียน',
    lat: 8.644655,
    lng: 99.898119,
    description: 'อาคารเรียนรวม 5 มหาวิทยาลัยวลัยลักษณ์',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-bld-7',
    name: 'อาคารเรียนรวม 7',
    category: 'อาคารเรียน',
    lat: 8.643690,
    lng: 99.898136,
    description: 'อาคารเรียนรวม 7 มหาวิทยาลัยวลัยลักษณ์',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-bld-st',
    name: 'อาคารเรียนรวม ST',
    category: 'อาคารเรียน',
    lat: 8.644292,
    lng: 99.899070,
    description: 'อาคารศาสตราจารย์ ดร. สมบัติ ธำรงธัญวงศ์ (ST)',
    createdAt: '2026-09-01',
  },

  // --- ห้องสมุด / ศูนย์บรรณสาร ---
  {
    id: 'pin-lib-1',
    name: 'ศูนย์บรรณสารและสื่อการศึกษา',
    category: 'ห้องสมุด',
    lat: 8.642673,
    lng: 99.899053,
    description: 'ศูนย์บรรณสารและสื่อการศึกษา (ห้องสมุดกลาง)',
    createdAt: '2026-09-01',
  },

  // --- หอพักลักษณานิเวศ ---
  {
    id: 'pin-dorm-1',
    name: 'หอพักลักษณานิเวศ 1',
    category: 'หอพัก',
    lat: 8.647719,
    lng: 99.897350,
    description: 'หอพักนักศึกษา ลักษณานิเวศ 1',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-dorm-2',
    name: 'หอพักลักษณานิเวศ 2',
    category: 'หอพัก',
    lat: 8.647725,
    lng: 99.896270,
    description: 'หอพักนักศึกษา ลักษณานิเวศ 2 (หอพักนักศึกษาหญิง 2)',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-dorm-3',
    name: 'หอพักลักษณานิเวศ 3',
    category: 'หอพัก',
    lat: 8.648252,
    lng: 99.895099,
    description: 'หอพักนักศึกษา ลักษณานิเวศ 3 (หอพักนักศึกษาชาย 3)',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-dorm-4',
    name: 'หอพักลักษณานิเวศ 4',
    category: 'หอพัก',
    lat: 8.648243,
    lng: 99.893073,
    description: 'หอพักนักศึกษา ลักษณานิเวศ 4',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-dorm-5',
    name: 'หอพักลักษณานิเวศ 5',
    category: 'หอพัก',
    lat: 8.647697,
    lng: 99.892052,
    description: 'หอพักนักศึกษา ลักษณานิเวศ 5',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-dorm-7',
    name: 'หอพักลักษณานิเวศ 7',
    category: 'หอพัก',
    lat: 8.648308,
    lng: 99.891510,
    description: 'หอพักนักศึกษา ลักษณานิเวศ 7',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-dorm-10',
    name: 'หอพักลักษณานิเวศ 10',
    category: 'หอพัก',
    lat: 8.648793,
    lng: 99.892760,
    description: 'หอพักนักศึกษา ลักษณานิเวศ 10',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-dorm-11',
    name: 'หอพักลักษณานิเวศ 11',
    category: 'หอพัก',
    lat: 8.648858,
    lng: 99.895649,
    description: 'หอพักนักศึกษา ลักษณานิเวศ 11',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-dorm-14',
    name: 'หอพักลักษณานิเวศ 14',
    category: 'หอพัก',
    lat: 8.649015,
    lng: 99.897208,
    description: 'หอพักนักศึกษา ลักษณานิเวศ 14',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-dorm-16',
    name: 'หอพักลักษณานิเวศ 16',
    category: 'หอพัก',
    lat: 8.647698,
    lng: 99.889579,
    description: 'หอพักนักศึกษา ลักษณานิเวศ 16',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-dorm-17',
    name: 'หอพักลักษณานิเวศ 17',
    category: 'หอพัก',
    lat: 8.647711,
    lng: 99.888578,
    description: 'หอพักนักศึกษา ลักษณานิเวศ 17',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-dorm-18',
    name: 'หอพักลักษณานิเวศ 18',
    category: 'หอพัก',
    lat: 8.648137,
    lng: 99.889388,
    description: 'หอพักนักศึกษา ลักษณานิเวศ 18',
    createdAt: '2026-09-01',
  },

  // --- โรงอาหาร & กิจกรรม ---
  {
    id: 'pin-canteen-1',
    name: 'โรงอาหารกลาง',
    category: 'โรงอาหาร',
    lat: 8.647428,
    lng: 99.894577,
    description: 'โรงอาหารกลางศูนย์อาหารนักศึกษา (โรงอาหาร 1)',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-activity-hall',
    name: 'โรงกิจ',
    category: 'โรงอาหาร',
    lat: 8.647474,
    lng: 99.894104,
    description: 'โรงกิจ (ตึกกิจกรรมนักศึกษา)',
    createdAt: '2026-09-01',
  },

  // --- กีฬา ---
  {
    id: 'pin-sports-futsal',
    name: 'สนามฟุตซอลในร่มมาตรฐาน',
    category: 'สนามกีฬา',
    lat: 8.649657,
    lng: 99.891230,
    description: 'ศูนย์กีฬาในร่ม มหาวิทยาลัยวลัยลักษณ์',
    createdAt: '2026-09-01',
  },
  {
    id: 'pin-sports-tennis',
    name: 'สนามกีฬาเทนนิส',
    category: 'สนามกีฬา',
    lat: 8.647386,
    lng: 99.890922,
    description: 'สนามกีฬาเทนนิส (สนามเทนนิสเก่า)',
    createdAt: '2026-09-01',
  },

  // --- ทางเดิน / พื้นที่กิจกรรม / วิจัย ---
  {
    id: 'pin-walkway-st7-lib',
    name: 'ทางเดินเชื่อมอาคารเรียนรวม 7 - ศูนย์บรรณสาร',
    category: 'ถนน / ทางเดิน',
    lat: 8.643180,
    lng: 99.898600,
    description: 'ทางเดินมีหลังคาคลุมเชื่อมระหว่างอาคารเรียนรวม 7 และศูนย์บรรณสาร',
    createdAt: '2026-09-02',
  },
  {
    id: 'pin-plaza-arch',
    name: 'ลานกิจกรรมหน้าอาคารสถาปัตยกรรมศาสตร์',
    category: 'พื้นที่กิจกรรม',
    lat: 8.644405,
    lng: 99.892989,
    description: 'ลานอเนกประสงค์หน้าคณะสถาปัตยกรรมศาสตร์และการออกแบบ',
    createdAt: '2026-09-02',
  },
  {
    id: 'pin-res-back',
    name: 'ด้านหลังอาคารวิจัยและนวัตกรรม',
    category: 'พื้นที่วิจัย',
    lat: 8.640352,
    lng: 99.899105,
    description: 'พื้นที่ศูนย์เครื่องมือวิทยาศาสตร์และห้องวิจัย (อาคารวิจัย)',
    createdAt: '2026-09-03',
  },
]

export const PINNED_LOCATIONS_STORAGE_KEY = 'unicare_pinned_locations'
export const PINNED_LOCATIONS_VERSION_KEY = 'unicare_pinned_locations_v3'

export function getDeletedPinNames(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = window.localStorage.getItem('unicare_deleted_pin_names')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        return parsed.map((s: string) => String(s).toLowerCase().trim())
      }
    }
  } catch {
    // ignore
  }
  return []
}

export function markPinAsDeleted(nameOrId: string): void {
  if (typeof window === 'undefined' || !nameOrId) return
  try {
    const list = getDeletedPinNames()
    const clean = String(nameOrId).toLowerCase().trim()
    if (!list.includes(clean)) {
      list.push(clean)
      window.localStorage.setItem('unicare_deleted_pin_names', JSON.stringify(list))
    }
  } catch {
    // ignore
  }
}

export function unmarkPinAsDeleted(nameOrId: string): void {
  if (typeof window === 'undefined' || !nameOrId) return
  try {
    const list = getDeletedPinNames()
    const clean = String(nameOrId).toLowerCase().trim()
    const filtered = list.filter((item) => item !== clean)
    window.localStorage.setItem('unicare_deleted_pin_names', JSON.stringify(filtered))
  } catch {
    // ignore
  }
}

export function getPinnedLocations(): PinnedLocation[] {
  if (typeof window === 'undefined') {
    return DEFAULT_PINNED_LOCATIONS
  }
  const deletedNames = getDeletedPinNames()
  try {
    const version = window.localStorage.getItem(PINNED_LOCATIONS_VERSION_KEY)
    if (version !== '3.0') {
      // Migrate to new verified 25 OSM pins with exact coordinates
      window.localStorage.setItem(PINNED_LOCATIONS_VERSION_KEY, '3.0')
      window.localStorage.setItem(PINNED_LOCATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_PINNED_LOCATIONS))
      return DEFAULT_PINNED_LOCATIONS.filter(
        (p) =>
          !deletedNames.includes(p.name.toLowerCase().trim()) &&
          !deletedNames.includes(p.id.toLowerCase().trim())
      )
    }

    const saved = window.localStorage.getItem(PINNED_LOCATIONS_STORAGE_KEY)
    if (saved !== null) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (p) =>
            !deletedNames.includes(p.name.toLowerCase().trim()) &&
            !deletedNames.includes(p.id.toLowerCase().trim())
        )
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_PINNED_LOCATIONS.filter(
    (p) =>
      !deletedNames.includes(p.name.toLowerCase().trim()) &&
      !deletedNames.includes(p.id.toLowerCase().trim())
  )
}

export function resetPinnedLocationsToDefault(): PinnedLocation[] {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('unicare_deleted_pin_names')
      window.localStorage.setItem(PINNED_LOCATIONS_VERSION_KEY, '3.0')
      window.localStorage.setItem(
        PINNED_LOCATIONS_STORAGE_KEY,
        JSON.stringify(DEFAULT_PINNED_LOCATIONS)
      )
      window.dispatchEvent(new Event('unicare-pinned-locations-updated'))
    } catch {
      // ignore
    }
  }
  return DEFAULT_PINNED_LOCATIONS
}

export function savePinnedLocation(data: {
  id?: string
  originalName?: string
  name: string
  category?: string
  lat: number
  lng: number
  description?: string
}): PinnedLocation {
  const current = [...getPinnedLocations()]
  let result: PinnedLocation

  const cleanName = data.name.trim().toLowerCase()
  const cleanOrig = data.originalName?.trim().toLowerCase()

  // Find existing pin: by id first, then by originalName, then by name
  let existingIndex = -1
  if (data.id) {
    existingIndex = current.findIndex((p) => p.id === data.id)
  }
  if (existingIndex < 0 && cleanOrig) {
    existingIndex = current.findIndex(
      (p) => p.name.trim().toLowerCase() === cleanOrig
    )
  }
  if (existingIndex < 0) {
    existingIndex = current.findIndex(
      (p) => p.name.trim().toLowerCase() === cleanName
    )
  }

  if (existingIndex >= 0) {
    result = {
      ...current[existingIndex],
      name: data.name.trim(),
      category: data.category || current[existingIndex].category,
      lat: data.lat,
      lng: data.lng,
      description:
        data.description !== undefined
          ? data.description.trim()
          : current[existingIndex].description,
    }
    current[existingIndex] = result
  } else {
    result = {
      id: data.id || `pin-${Date.now()}`,
      name: data.name.trim(),
      category: data.category || 'สถานที่ทั่วไป',
      lat: data.lat,
      lng: data.lng,
      description: data.description ? data.description.trim() : '',
      createdAt: new Date().toISOString().split('T')[0],
    }
    current.push(result)
  }

  // Restore name / id from deleted blacklist if previously deleted
  unmarkPinAsDeleted(data.name)
  if (data.id) unmarkPinAsDeleted(data.id)
  // If renamed, mark old name as deleted so old name disappears
  if (cleanOrig && cleanOrig !== cleanName) {
    markPinAsDeleted(cleanOrig)
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        PINNED_LOCATIONS_STORAGE_KEY,
        JSON.stringify(current)
      )
      window.dispatchEvent(new Event('unicare-pinned-locations-updated'))
    } catch {
      // ignore
    }
  }

  return result
}

export function deletePinnedLocation(idOrName: string): boolean {
  if (!idOrName) return false
  const current = getPinnedLocations()
  const clean = idOrName.trim().toLowerCase()

  const found = current.find(
    (p) => p.id === idOrName || p.name.trim().toLowerCase() === clean
  )
  if (found) {
    markPinAsDeleted(found.id)
    markPinAsDeleted(found.name)
  } else {
    markPinAsDeleted(idOrName)
  }

  const filtered = current.filter(
    (p) =>
      p.id !== idOrName &&
      p.name.trim().toLowerCase() !== clean
  )

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        PINNED_LOCATIONS_STORAGE_KEY,
        JSON.stringify(filtered)
      )
      window.dispatchEvent(new Event('unicare-pinned-locations-updated'))
    } catch {
      // ignore
    }
  }

  return true
}

export const KNOWN_CAMPUS_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  // โรงอาหาร & กิจกรรม
  'โรงอาหารกลาง': { lat: 8.647428, lng: 99.894577 },
  'โรงอาหาร': { lat: 8.647428, lng: 99.894577 },
  'โรงกิจ': { lat: 8.647474, lng: 99.894104 },
  'ตึกกิจกรรม': { lat: 8.647474, lng: 99.894104 },
  'โรงมืด': { lat: 8.6474, lng: 99.8942 },

  // อาคารเรียนรวม
  'อาคารเรียนรวม 1': { lat: 8.643685, lng: 99.896745 },
  'อาคารเรียนรวม 3': { lat: 8.644644, lng: 99.896678 },
  'อาคารเรียนรวม 5': { lat: 8.644655, lng: 99.898119 },
  'อาคารเรียนรวม 7': { lat: 8.643690, lng: 99.898136 },
  'อาคารเรียนรวม ST': { lat: 8.644292, lng: 99.899070 },
  'อาคารเรียนรวม': { lat: 8.644655, lng: 99.898119 },

  // ห้องสมุด / ศูนย์บรรณสาร
  'ศูนย์บรรณสารและสื่อการศึกษา': { lat: 8.642673, lng: 99.899053 },
  'ศูนย์บรรณสาร': { lat: 8.642673, lng: 99.899053 },
  'ห้องสมุด': { lat: 8.642673, lng: 99.899053 },

  // หอพักลักษณานิเวศ
  'หอพักลักษณานิเวศ 1': { lat: 8.647719, lng: 99.897350 },
  'หอพักลักษณานิเวศ 2': { lat: 8.647725, lng: 99.896270 },
  'หอพักนักศึกษาหญิง 2': { lat: 8.647725, lng: 99.896270 },
  'หอพักลักษณานิเวศ 3': { lat: 8.648252, lng: 99.895099 },
  'หอพักนักศึกษาชาย 3': { lat: 8.648252, lng: 99.895099 },
  'หอพักลักษณานิเวศ 4': { lat: 8.648243, lng: 99.893073 },
  'หอพักลักษณานิเวศ 5': { lat: 8.647697, lng: 99.892052 },
  'หอพักลักษณานิเวศ 7': { lat: 8.648308, lng: 99.891510 },
  'หอพักลักษณานิเวศ 10': { lat: 8.648793, lng: 99.892760 },
  'หอพักลักษณานิเวศ 11': { lat: 8.648858, lng: 99.895649 },
  'หอพักลักษณานิเวศ 14': { lat: 8.649015, lng: 99.897208 },
  'หอพักลักษณานิเวศ 16': { lat: 8.647698, lng: 99.889579 },
  'หอพักลักษณานิเวศ 17': { lat: 8.647711, lng: 99.888578 },
  'หอพักลักษณานิเวศ 18': { lat: 8.648137, lng: 99.889388 },
  'หอพักนักศึกษา': { lat: 8.6480, lng: 99.8940 },
  'หอพัก': { lat: 8.6480, lng: 99.8940 },
  'WU Residence A': { lat: 8.6472, lng: 99.9030 },
  'WU Residence B': { lat: 8.6474, lng: 99.9033 },
  'WU Residence C': { lat: 8.6476, lng: 99.9036 },

  // พื้นที่กิจกรรม / ทางเดิน / วิจัย
  'ทางเดินเชื่อมอาคารเรียนรวม 7 - ศูนย์บรรณสาร': { lat: 8.643180, lng: 99.898600 },
  'ลานกิจกรรมหน้าอาคารสถาปัตยกรรมศาสตร์': { lat: 8.644405, lng: 99.892989 },
  'อาคารสถาปัตยกรรมศาสตร์': { lat: 8.644405, lng: 99.892989 },
  'ลานกิจกรรม': { lat: 8.644405, lng: 99.892989 },
  'ด้านหลังอาคารวิจัยและนวัตกรรม': { lat: 8.640352, lng: 99.899105 },
  'อาคารวิจัยและนวัตกรรม': { lat: 8.640352, lng: 99.899105 },
  'วงเวียนหอพักนักศึกษา - ประตูทางเข้ามหาวิทยาลัย': { lat: 8.6475, lng: 99.9025 },
  'วงเวียนหอพัก': { lat: 8.6475, lng: 99.9025 },
  'พื้นที่ริมสระน้ำ': { lat: 8.6440, lng: 99.9018 },

  // กีฬา
  'สนามฟุตซอลในร่มมาตรฐาน': { lat: 8.649657, lng: 99.891230 },
  'ศูนย์กีฬาในร่ม': { lat: 8.649657, lng: 99.891230 },
  'สนามกีฬาเทนนิส': { lat: 8.647386, lng: 99.890922 },
  'สนามเทนนิส': { lat: 8.647386, lng: 99.890922 },
  'สนามกีฬา': { lat: 8.6485, lng: 99.8910 },
  'สนามฟุตบอลหญ้าเทียม': { lat: 8.6488, lng: 99.8910 },
  'สนามฟุตซอลกลางแจ้ง': { lat: 8.6492, lng: 99.8915 },
  'สนามบาสเกตบอล': { lat: 8.6480, lng: 99.8910 },
  'สนามไดร์ฟกอล์ฟ': { lat: 8.6398, lng: 99.8940 },
  'สนามแบดมินตัน': { lat: 8.6495, lng: 99.8910 },
}

export function resolveLocationCoordinates(areaName: string): { lat: number; lng: number } {
  if (!areaName) return { lat: 8.6434, lng: 99.8984 }

  const clean = areaName.trim().toLowerCase()

  // 1. Check pinned locations saved by admin in localStorage
  const pinnedList = getPinnedLocations()

  // 1a. Exact match in pinned locations
  const exactPinned = pinnedList.find((p) => p.name.trim().toLowerCase() === clean)
  if (exactPinned) {
    return { lat: exactPinned.lat, lng: exactPinned.lng }
  }

  // 1b. Substring/fuzzy match in pinned locations
  for (const p of pinnedList) {
    const pName = p.name.trim().toLowerCase()
    if (clean.includes(pName) || pName.includes(clean)) {
      return { lat: p.lat, lng: p.lng }
    }
  }

  // 2. Direct match in KNOWN_CAMPUS_LOCATIONS
  if (KNOWN_CAMPUS_LOCATIONS[areaName]) {
    return KNOWN_CAMPUS_LOCATIONS[areaName]
  }

  // 3. Keyword match in KNOWN_CAMPUS_LOCATIONS
  for (const [key, coords] of Object.entries(KNOWN_CAMPUS_LOCATIONS)) {
    if (clean.includes(key.toLowerCase()) || key.toLowerCase().includes(clean)) {
      return coords
    }
  }

  // 4. Fallback: deterministic offset around campus center
  let hash = 0
  for (let i = 0; i < areaName.length; i++) {
    hash = (hash << 5) - hash + areaName.charCodeAt(i)
    hash |= 0
  }
  const latOffset = ((Math.abs(hash) % 100) - 50) * 0.00004
  const lngOffset = ((Math.abs(hash >> 3) % 100) - 50) * 0.00004
  return {
    lat: 8.6434 + latOffset,
    lng: 99.8984 + lngOffset,
  }
}

export function normalizeAreaName(rawArea: string): string {
  if (!rawArea) return 'มหาวิทยาลัยวลัยลักษณ์'
  const trimmed = rawArea.trim()
  const lower = trimmed.toLowerCase()

  // Alias common equivalents to canonical names
  if (
    lower.includes('หอพักนักศึกษาชาย 3') ||
    lower.includes('หอพักชาย 3') ||
    lower.includes('หอ 3 ชาย') ||
    lower === 'หอพักลักษณานิเวศ 3' ||
    lower === 'ลักษณานิเวศ 3'
  ) {
    return 'หอพักลักษณานิเวศ 3'
  }
  if (
    lower.includes('หอพักนักศึกษาหญิง 2') ||
    lower.includes('หอพักหญิง 2') ||
    lower.includes('หอ 2 หญิง') ||
    lower === 'หอพักลักษณานิเวศ 2' ||
    lower === 'ลักษณานิเวศ 2'
  ) {
    return 'หอพักลักษณานิเวศ 2'
  }
  if (lower === 'ห้องสมุด' || lower.includes('ศูนย์บรรณสาร')) {
    return 'ศูนย์บรรณสารและสื่อการศึกษา'
  }
  if (lower === 'สนามเทนนิส' || lower === 'สนามกีฬาเทนนิส') {
    return 'สนามกีฬาเทนนิส'
  }
  if (lower.includes('อาคารเรียนรวม st') || lower.includes('อาคาร st') || lower.includes('สมบัติ ธำรงธัญวงศ์')) {
    return 'อาคารเรียนรวม ST'
  }
  if (lower.includes('สถาปัตยกรรม') || lower.includes('สถาปัตย์')) {
    return 'ลานกิจกรรมหน้าอาคารสถาปัตยกรรมศาสตร์'
  }
  if (lower.includes('วิจัยและนวัตกรรม') || lower.includes('อาคารวิจัย')) {
    return 'ด้านหลังอาคารวิจัยและนวัตกรรม'
  }
  if (lower.includes('เชื่อมอาคารเรียนรวม 7')) {
    return 'ทางเดินเชื่อมอาคารเรียนรวม 7 - ศูนย์บรรณสาร'
  }
  if (lower.includes('โรงอาหารกลาง') || lower === 'โรงอาหาร' || lower.includes('โรงอาหาร 1')) {
    return 'โรงอาหารกลาง'
  }
  if (lower === 'โรงกิจ' || lower.includes('ตึกกิจกรรม')) {
    return 'โรงกิจ'
  }

  // 1. Check pinned locations
  const pinnedList = getPinnedLocations()
  for (const p of pinnedList) {
    if (trimmed.toLowerCase().includes(p.name.toLowerCase())) {
      return p.name
    }
  }

  // 2. Check report places
  for (const place of ALL_REPORT_PLACES) {
    if (trimmed.toLowerCase().includes(place.name.toLowerCase())) {
      return place.name
    }
  }

  // 3. Path parts parsing
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').map((p) => p.trim())
    for (const part of parts) {
      if (
        part.includes('อาคาร') ||
        part.includes('หอพัก') ||
        part.includes('โรงอาหาร') ||
        part.includes('โรงมืด') ||
        part.includes('โรงกิจ') ||
        part.includes('ห้องสมุด') ||
        part.includes('สนาม') ||
        part.includes('สถาปัตย์') ||
        part.includes('วิจัย') ||
        part.includes('วงเวียน') ||
        part.includes('Residence')
      ) {
        return part
      }
    }
    return parts[1] || parts[0]
  }
  return trimmed
}

export function getGroupedRiskAreas(issues?: IssueItem[], includeAllPinned = true): LocationGroupedRiskArea[] {
  const allIssues = issues || getAllCurrentIssues()

  const groups: Record<string, IssueItem[]> = {}

  allIssues.forEach((issue) => {
    const norm = normalizeAreaName(issue.area)
    if (!groups[norm]) {
      groups[norm] = []
    }
    groups[norm].push(issue)
  })

  const pinnedList = getPinnedLocations()
  const deletedNames = getDeletedPinNames()
  const results: LocationGroupedRiskArea[] = []
  const processedAreas = new Set<string>()

  let index = 1
  for (const [areaName, groupIssues] of Object.entries(groups)) {
    const cleanArea = areaName.toLowerCase().trim()
    if (
      deletedNames.includes(cleanArea) ||
      deletedNames.some((d) => d && (cleanArea === d || cleanArea.includes(d) || d.includes(cleanArea)))
    ) {
      continue
    }

    const matchingPin = pinnedList.find(
      (p) =>
        p.name.toLowerCase() === areaName.toLowerCase() ||
        areaName.toLowerCase().includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(areaName.toLowerCase())
    )
    if (
      matchingPin &&
      (deletedNames.includes(matchingPin.id.toLowerCase().trim()) ||
        deletedNames.includes(matchingPin.name.toLowerCase().trim()))
    ) {
      continue
    }

    processedAreas.add(areaName.toLowerCase())

    // Sort issues inside group: highest urgency first, then pending/in_progress, then newest
    const sortedIssues = [...groupIssues].sort((a, b) => {
      const urgencyScore = (u?: string) => {
        if (u === 'เร่งด่วนมาก') return 3
        if (u === 'เร่งด่วน') return 2
        return 1
      }
      return urgencyScore(b.urgency) - urgencyScore(a.urgency)
    })

    // Highest urgency determination
    let highestUrgency: 'เร่งด่วนมาก' | 'เร่งด่วน' | 'ปกติ' = 'ปกติ'
    if (sortedIssues.some((i) => i.urgency === 'เร่งด่วนมาก')) {
      highestUrgency = 'เร่งด่วนมาก'
    } else if (sortedIssues.some((i) => i.urgency === 'เร่งด่วน')) {
      highestUrgency = 'เร่งด่วน'
    }

    const color =
      highestUrgency === 'เร่งด่วนมาก'
        ? '#ef4444' // Red
        : highestUrgency === 'เร่งด่วน'
          ? '#f59e0b' // Yellow
          : '#10b981' // Green

    const coords = resolveLocationCoordinates(areaName)

    const primaryIssue = sortedIssues[0]
    const primaryProblem = primaryIssue
      ? primaryIssue.description
      : 'มีปัญหาในพื้นที่'

    results.push({
      id: matchingPin ? matchingPin.id : `loc-${index++}`,
      name: matchingPin ? matchingPin.name : areaName,
      lat: coords.lat,
      lng: coords.lng,
      issues: sortedIssues,
      issueCount: sortedIssues.length,
      highestUrgency,
      highestUrgencyColor: color,
      primaryProblem,
      category: matchingPin?.category,
      isPinned: !!matchingPin,
    })
  }

  // Add pinned locations that currently have 0 issues
  if (includeAllPinned) {
    for (const pinned of pinnedList) {
      if (
        deletedNames.includes(pinned.id.toLowerCase().trim()) ||
        deletedNames.includes(pinned.name.toLowerCase().trim())
      ) {
        continue
      }
      const alreadyProcessed = Array.from(processedAreas).some(
        (a) =>
          a === pinned.name.toLowerCase() ||
          a.includes(pinned.name.toLowerCase()) ||
          pinned.name.toLowerCase().includes(a)
      )
      if (!alreadyProcessed) {
        results.push({
          id: pinned.id,
          name: pinned.name,
          lat: pinned.lat,
          lng: pinned.lng,
          issues: [],
          issueCount: 0,
          highestUrgency: 'ปกติ',
          highestUrgencyColor: '#0284c7', // Sky blue for pinned locations with no issues yet
          primaryProblem: 'จุดปักหมุดสถานที่ (ยังไม่มีรายงานปัญหา)',
          category: pinned.category,
          isPinned: true,
        })
      }
    }
  }

  // Sort groups:
  // 1. Locations with issues by urgency (เร่งด่วนมาก -> เร่งด่วน -> ปกติ), then by issueCount desc
  // 2. Locations without issues (pinned places)
  return results.sort((a, b) => {
    if (a.issueCount > 0 && b.issueCount === 0) return -1
    if (a.issueCount === 0 && b.issueCount > 0) return 1

    const urgencyScore = (u: string) => {
      if (u === 'เร่งด่วนมาก') return 3
      if (u === 'เร่งด่วน') return 2
      return 1
    }
    const diff = urgencyScore(b.highestUrgency) - urgencyScore(a.highestUrgency)
    if (diff !== 0) return diff
    return b.issueCount - a.issueCount
  })
}

