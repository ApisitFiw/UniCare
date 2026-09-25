'use client'

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import CaseClarificationDrawer from '@/components/CaseClarificationDrawer'
import { supabase } from '@/lib/supabaseClient'
import { getDemoSession } from '@/lib/demoAuth'
import {
  FolderOpen,
  Clock,
  RotateCw,
  CheckCircle2,
  Search,
  PenSquare,
  MessageCircle,
  X,
  History,
  MapPin,
  Plus,
  Paperclip,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import {
  type IssueItem,
  type TimelineEntry,
  type PinnedLocation,
  initialMockIssues,
  initialTimelineHistory,
  STANDARD_CATEGORIES,
  ALL_REPORT_PLACES,
  getPinnedLocations,
  getDisabledCategoryNames,
  getCurrentAdminDisplayName,
  getAdminInitials,
  getSystemAdminNames,
  normalizeIssueAdminName,
  getCategoryIcon,
  sortIssuesLatestFirst,
  normalizeCategoryName,
  matchCategory,
} from '@/lib/issuesData'
import { addNotification } from '@/lib/notifications'

function IssuesUrlWatcher({
  onSelectIssue,
  onCreateIssue,
  onSelectCategory,
}: {
  onSelectIssue: (issueId: string) => void
  onCreateIssue: (area?: string) => void
  onSelectCategory: (category: string) => void
}) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const issueId = searchParams.get('issueId')
    const area = searchParams.get('area')
    const mode = searchParams.get('mode')
    const category = searchParams.get('category')

    if (issueId) {
      onSelectIssue(issueId)
    } else if (mode === 'create' || area) {
      onCreateIssue(area || undefined)
    } else if (category) {
      onSelectCategory(category)
    }
  }, [searchParams, onSelectIssue, onCreateIssue, onSelectCategory])

  return null
}

export default function StatusTrackingPage() {
  const [issues, setIssues] = useState<IssueItem[]>(() => sortIssuesLatestFirst(initialMockIssues))
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Pagination State (10 issues per page)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageInput, setPageInput] = useState<string>('')
  const ITEMS_PER_PAGE = 10

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, categoryFilter])

  // Modal State for Status & Timeline
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<'create' | 'quick_timeline'>('create')
  const [activeModalIssue, setActiveModalIssue] = useState<IssueItem | null>(null)
  const [isQuickTimelineModal, setIsQuickTimelineModal] = useState<boolean>(false)

  // Deep linking and auto-opening modal state
  const autoOpenedRef = useRef<string | null>(null)
  const [highlightIssueId, setHighlightIssueId] = useState<string | null>(null)

  // Quick Timeline Form State
  const [newStatus, setNewStatus] = useState<string>('กำลังดำเนินการ')
  const [actionNote, setActionNote] = useState<string>('')
  const [evidenceFileName, setEvidenceFileName] = useState<string>('')

  // Pinned & Report Locations from Categories & Risk Areas Page
  const [pinnedList, setPinnedList] = useState<PinnedLocation[]>([])
  const [isCustomArea, setIsCustomArea] = useState<boolean>(false)
  const [customAreaText, setCustomAreaText] = useState<string>('')

  useEffect(() => {
    setPinnedList(getPinnedLocations())
    const handleUpdate = () => setPinnedList(getPinnedLocations())
    window.addEventListener('unicare-pinned-locations-updated', handleUpdate)
    return () => window.removeEventListener('unicare-pinned-locations-updated', handleUpdate)
  }, [])

  const groupedLocations = useMemo(() => {
    const result: Record<string, { name: string; isPinned: boolean }[]> = {}
    const pinnedMap = new Map<string, PinnedLocation>()
    pinnedList.forEach((p) => {
      pinnedMap.set(p.name.trim().toLowerCase(), p)
    })

    // Group ALL_REPORT_PLACES by category
    ALL_REPORT_PLACES.forEach((p) => {
      const cat = p.category || 'สถานที่ทั่วไป'
      if (!result[cat]) result[cat] = []
      const isPinned = pinnedMap.has(p.name.trim().toLowerCase())
      result[cat].push({ name: p.name, isPinned })
    })

    // Add any custom pinned location created by admin not in ALL_REPORT_PLACES
    const allReportPlaceNames = new Set(ALL_REPORT_PLACES.map((p) => p.name.trim().toLowerCase()))
    pinnedList.forEach((p) => {
      if (!allReportPlaceNames.has(p.name.trim().toLowerCase())) {
        const cat = p.category || 'สถานที่ปักหมุดเพิ่มเติม'
        if (!result[cat]) result[cat] = []
        result[cat].push({ name: p.name, isPinned: true })
      }
    })

    return result
  }, [pinnedList])

  // Filter out any disabled categories from category management
  const [disabledCategories, setDisabledCategories] = useState<string[]>([])
  useEffect(() => {
    setDisabledCategories(getDisabledCategoryNames())
    const handleCatUpdate = () => setDisabledCategories(getDisabledCategoryNames())
    window.addEventListener('unicare-category-metadata-updated', handleCatUpdate)
    return () => window.removeEventListener('unicare-category-metadata-updated', handleCatUpdate)
  }, [])

  const activeCategories = useMemo(() => {
    return STANDARD_CATEGORIES.filter((cat) => !disabledCategories.includes(cat))
  }, [disabledCategories])

  // Create Issue Form State
  const [createCategory, setCreateCategory] = useState<string>(activeCategories[0] || STANDARD_CATEGORIES[0] || 'ขยะ / ของเสีย')
  const [createArea, setCreateArea] = useState<string>(ALL_REPORT_PLACES[0]?.name || 'อาคารเรียนรวม 1')
  const [createDescription, setCreateDescription] = useState<string>('')
  const [createStatus, setCreateStatus] = useState<string>('รอดำเนินการ')
  const [createEvidenceFile, setCreateEvidenceFile] = useState<string>('')

  const [createAdmin, setCreateAdmin] = useState<string>('')
  const [modalAdmin, setModalAdmin] = useState<string>('')

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [timelineHistory, setTimelineHistory] = useState<Record<string, TimelineEntry[]>>(initialTimelineHistory)

  // Chat Drawer State (Case Comments & Clarification)
  const [activeChatIssue, setActiveChatIssue] = useState<IssueItem | null>(null)

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Load saved history & issues from localStorage and Supabase
  useEffect(() => {
    const loadData = () => {
      // 1. Load saved timeline history from localStorage if available
      try {
        const savedTimeline = window.localStorage.getItem('unicare_demo_timeline_history')
        if (savedTimeline) {
          const parsed = JSON.parse(savedTimeline)
          if (typeof parsed === 'object' && parsed !== null) {
            const cleanedTimeline: Record<string, TimelineEntry[]> = {}
            for (const [k, entries] of Object.entries(parsed)) {
              if (Array.isArray(entries)) {
                cleanedTimeline[k] = entries.map((e: TimelineEntry) => {
                  if (e.author && (e.author.includes('ธีรภัทร') || e.author.includes('อภิสิทธิ์'))) {
                    return { ...e, author: normalizeIssueAdminName(e.author).adminName }
                  }
                  return e
                })
              }
            }
            setTimelineHistory((prev) => ({ ...prev, ...cleanedTimeline }))
          }
        }
      } catch {
        // Ignore
      }

      // 2. Load demo reports from localStorage if available (เฉพาะเรื่องที่รับเรื่องแล้ว หรือแอดมินสร้าง)
      try {
        const savedReports = window.localStorage.getItem('unicare_demo_issue_reports')
        if (savedReports) {
          const parsed = JSON.parse(savedReports)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mappedFromLocal: IssueItem[] = parsed
              .filter((item: any) => {
                const rawStatus = (item.status || 'Pending').toLowerCase()
                // คำร้องที่ถูกปฏิเสธจะไม่แสดงในติดตามสถานะ
                if (rawStatus === 'closed' || rawStatus === 'rejected') return false
                // คำร้องที่สร้างโดยแอดมินโดยตรง
                if (item.source === 'admin') return true
                // คำร้องจากผู้ใช้ทั่วไป หรือแอดมินสร้าง
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

                const rawAdmin = item.adminName || item.admin_name
                const normalized = normalizeIssueAdminName(rawAdmin, idx)

                return {
                  id: displayId,
                  date: item.date_created
                    ? new Date(item.date_created).toLocaleDateString('th-TH', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'วันนี้',
                  category: normalizeCategoryName(item.category || item.issue_categories?.category_name || item.title || 'อื่น ๆ'),
                  area: item.issue_areas?.area_name || item.location || 'มหาวิทยาลัยวลัยลักษณ์',
                  description: item.description || item.title || 'รายละเอียดเรื่องร้องเรียน',
                  adminName: normalized.adminName,
                  adminInitial: normalized.adminInitial,
                  status: statusKey,
                  statusLabel,
                }
              })

            setIssues(() => {
              const existingIds = new Set(mappedFromLocal.map((i) => i.id))
              const combined = [
                ...mappedFromLocal,
                ...initialMockIssues
                  .filter((p) => !existingIds.has(p.id))
                  .map((p, idx) => {
                    const normalized = normalizeIssueAdminName(p.adminName, idx)
                    return {
                      ...p,
                      adminName: normalized.adminName,
                      adminInitial: normalized.adminInitial,
                    }
                  }),
              ]
              return sortIssuesLatestFirst(combined)
            })
          }
        }
      } catch {
        // Ignore
      }
    }

    loadData()

    window.addEventListener('storage', loadData)
    window.addEventListener('unicare-demo-reports-updated', loadData)
    window.addEventListener('unicare-profile-updated', loadData)
    window.addEventListener('unicare-demo-users-updated', loadData)

    return () => {
      window.removeEventListener('storage', loadData)
      window.removeEventListener('unicare-demo-reports-updated', loadData)
      window.removeEventListener('unicare-profile-updated', loadData)
      window.removeEventListener('unicare-demo-users-updated', loadData)
    }
  }, [])

  // Open Quick Timeline Modal from Banner Button
  const handleOpenQuickTimelineModal = () => {
    setIsQuickTimelineModal(true)
    setModalMode('create')
    const target = issues.length > 0 ? issues[0] : initialMockIssues[0]
    setActiveModalIssue(target)
    setNewStatus(target.statusLabel)
    setActionNote('')
    setEvidenceFileName('')
    setModalAdmin(target.adminName)
    setIsModalOpen(true)
  }

  // Open Status Modal from Table Row
  const handleOpenStatusModal = (issue: IssueItem) => {
    setIsQuickTimelineModal(false)
    setModalMode('quick_timeline')
    setActiveModalIssue(issue)
    setNewStatus(issue.statusLabel)
    setActionNote('')
    setEvidenceFileName('')
    setModalAdmin(issue.adminName)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setActiveModalIssue(null)
    autoOpenedRef.current = null
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname)
    }
    setTimeout(() => {
      setHighlightIssueId(null)
    }, 6000)
  }

  // Handle opening issue modal from URL query params (e.g. ?issueId=ISS-2026-101)
  const handleSelectIssueFromUrl = useCallback(
    (issueId: string) => {
      if (autoOpenedRef.current === issueId) return
      const cleanTarget = issueId.trim().toLowerCase()
      const found = issues.find((item) => {
        const itemId = item.id.toLowerCase()
        return (
          itemId === cleanTarget ||
          itemId.replace(/[^a-z0-9]/g, '') === cleanTarget.replace(/[^a-z0-9]/g, '') ||
          itemId.endsWith(cleanTarget)
        )
      })

      if (found) {
        autoOpenedRef.current = issueId
        handleOpenStatusModal(found)
        setHighlightIssueId(found.id)

        // Clear search or status filters if they would hide this row
        setStatusFilter('all')
        setSearchQuery('')

        // Navigate table to the page containing this issue
        const idx = issues.findIndex((i) => i.id === found.id)
        if (idx !== -1) {
          const targetPage = Math.floor(idx / ITEMS_PER_PAGE) + 1
          setCurrentPage(targetPage)
        }
      }
    },
    [issues]
  )

  const handleCreateIssueFromUrl = useCallback(
    (areaParam?: string) => {
      const key = `create-${areaParam || 'default'}`
      if (autoOpenedRef.current === key) return
      autoOpenedRef.current = key

      setIsQuickTimelineModal(true)
      setModalMode('create')
      if (areaParam) {
        setCreateArea(areaParam)
        const inList =
          ALL_REPORT_PLACES.some((p) => p.name.toLowerCase() === areaParam.toLowerCase()) ||
          pinnedList.some((p) => p.name.toLowerCase() === areaParam.toLowerCase())
        if (!inList) {
          setIsCustomArea(true)
          setCustomAreaText(areaParam)
        }
      }
      setIsModalOpen(true)
    },
    [pinnedList]
  )

  const handleSelectCategoryFromUrl = useCallback((catParam: string) => {
    const normalized = normalizeCategoryName(catParam)
    setCategoryFilter(normalized)
    setCurrentPage(1)
  }, [])

  // Direct check on mount / issues updates
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const issueId = params.get('issueId')
    const area = params.get('area')
    const mode = params.get('mode')
    const category = params.get('category')

    if (issueId) {
      handleSelectIssueFromUrl(issueId)
    } else if (mode === 'create' || area) {
      handleCreateIssueFromUrl(area || undefined)
    } else if (category) {
      handleSelectCategoryFromUrl(category)
    }
  }, [issues, handleSelectIssueFromUrl, handleCreateIssueFromUrl, handleSelectCategoryFromUrl])

  // Generate next issue ID
  const getNextIssueId = () => {
    let maxNum = 100
    issues.forEach((i) => {
      const parts = i.id.split('-')
      const num = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    })
    return `ISS-2026-${maxNum + 1}`
  }

  // Submit Handler for Creating New Issue
  const handleCreateIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createDescription.trim()) return

    setIsSubmitting(true)

    const nextId = getNextIssueId()
    const numericId = parseInt(nextId.split('-').pop() || '104', 10)

    let statusKey: 'pending' | 'in_progress' | 'resolved' = 'pending'
    if (createStatus === 'กำลังดำเนินการ') statusKey = 'in_progress'
    if (createStatus === 'แก้ไขสำเร็จ') statusKey = 'resolved'

    const now = new Date()
    const thaiDate = now.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const formattedTime =
      now.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.'

    const authorName = createAdmin || getCurrentAdminDisplayName()
    const adminInitials = getAdminInitials(authorName)

    const newIssue: IssueItem = {
      id: nextId,
      date: thaiDate,
      category: createCategory,
      area: createArea,
      description: createDescription.trim(),
      adminName: authorName,
      adminInitial: adminInitials,
      status: statusKey,
      statusLabel: createStatus,
    }

    const initialEntry: TimelineEntry = {
      statusText: 'สร้างเรื่องร้องเรียน (Reported)',
      time: formattedTime,
      note: createDescription.trim() + (createEvidenceFile ? ` [แนบไฟล์: ${createEvidenceFile}]` : ''),
      author: authorName,
      color: statusKey === 'in_progress' ? 'bg-blue-600' : 'bg-amber-500',
    }

    // 1. Update timeline history in state & localStorage
    const updatedHistory = {
      ...timelineHistory,
      [nextId]: [initialEntry],
    }
    setTimelineHistory(updatedHistory)
    try {
      window.localStorage.setItem('unicare_demo_timeline_history', JSON.stringify(updatedHistory))
    } catch {
      // Ignore
    }

    // 2. Update issues state
    setIssues((prev) => [newIssue, ...prev])

    // 3. Update issue in localStorage (unicare_demo_issue_reports)
    try {
      const savedReports = window.localStorage.getItem('unicare_demo_issue_reports')
      const currentReports = savedReports ? JSON.parse(savedReports) : []
      const newReportForStorage = {
        issue_id: numericId,
        title: createCategory,
        description: createDescription.trim(),
        severity: 'Medium',
        status: statusKey === 'in_progress' ? 'In_Progress' : statusKey === 'resolved' ? 'Resolved' : 'Pending',
        date_created: now.toISOString(),
        admin_name: authorName,
        adminName: authorName,
        adminInitial: adminInitials,
        reporter_name: authorName,
        evidence_count: createEvidenceFile ? 1 : 0,
        issue_categories: { category_name: createCategory },
        issue_areas: { area_name: createArea },
        location: createArea,
        source: 'admin',
      }
      const updatedReports = [newReportForStorage, ...(Array.isArray(currentReports) ? currentReports : [])]
      window.localStorage.setItem('unicare_demo_issue_reports', JSON.stringify(updatedReports))
      window.dispatchEvent(new Event('unicare-demo-reports-updated'))

      // แจ้งเตือนผู้ดูแลระบบ
      addNotification({
        title: 'สร้างเคสใหม่สำเร็จ',
        description: `เคส #${nextId} (${createCategory} - ${createArea}) โดย ${authorName}`,
        type: 'status',
        isRead: false,
        link: '/admin/issues',
        targetRole: 'admin',
        issueId: nextId,
      })
    } catch {
      // Ignore
    }

    // 4. Sync to Supabase if possible
    try {
      await supabase.from('issue_reports').insert({
        issue_id: numericId,
        title: createCategory,
        description: createDescription.trim(),
        status: statusKey === 'in_progress' ? 'In_Progress' : 'Pending',
        date_created: now.toISOString(),
      })
    } catch {
      // Ignore
    }

    setIsSubmitting(false)
    setToastMessage(`สร้างเรื่องร้องเรียน #${nextId} สำเร็จแล้ว!`)
    setIsModalOpen(false)
    setActiveModalIssue(null)
    autoOpenedRef.current = null
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname)
    }
    setCreateDescription('')
    setCreateEvidenceFile('')
    setIsCustomArea(false)
    setCustomAreaText('')
  }

  // Submit Handler for Timeline Entry & Status Update
  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeModalIssue) return

    setIsSubmitting(true)

    let statusKey: 'pending' | 'in_progress' | 'resolved' = 'in_progress'
    if (newStatus === 'รอดำเนินการ') statusKey = 'pending'
    if (newStatus === 'แก้ไขสำเร็จ') statusKey = 'resolved'

    const finalStatusLabel = newStatus

    const now = new Date()
    const formattedTime =
      now.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.'

    const titleText = `เปลี่ยนสถานะเป็น: ${finalStatusLabel}`

    let entryColor = 'bg-blue-600'
    if (statusKey === 'resolved') entryColor = 'bg-emerald-600'
    else if (statusKey === 'pending') entryColor = 'bg-amber-500'

    const authorName = getCurrentAdminDisplayName()
    const assignedAdmin = modalAdmin || activeModalIssue.adminName || authorName
    const assignedInitial = getAdminInitials(assignedAdmin)

    const newEntry: TimelineEntry = {
      statusText: titleText,
      time: formattedTime,
      note: actionNote.trim() + (evidenceFileName ? ` [แนบไฟล์: ${evidenceFileName}]` : ''),
      author: authorName,
      color: entryColor,
    }

    // 1. Update timeline history in state & localStorage
    const updatedHistory = {
      ...timelineHistory,
      [activeModalIssue.id]: [newEntry, ...(timelineHistory[activeModalIssue.id] || [])],
    }
    setTimelineHistory(updatedHistory)
    try {
      window.localStorage.setItem('unicare_demo_timeline_history', JSON.stringify(updatedHistory))
    } catch {
      // Ignore
    }

    // 2. Update issue in state
    setIssues((prev) =>
      prev.map((item) =>
        item.id === activeModalIssue.id
          ? {
              ...item,
              status: statusKey,
              statusLabel: finalStatusLabel,
              adminName: assignedAdmin,
              adminInitial: assignedInitial,
            }
          : item,
      ),
    )

    // 3. Update issue in localStorage (unicare_demo_issue_reports)
    try {
      const savedReports = window.localStorage.getItem('unicare_demo_issue_reports')
      const parsed = savedReports ? JSON.parse(savedReports) : []
      if (Array.isArray(parsed)) {
        let dbFormatStatus = 'In_Progress'
        if (statusKey === 'pending') dbFormatStatus = 'Pending'
        if (statusKey === 'resolved') dbFormatStatus = 'Resolved'

        const numericId = parseInt(activeModalIssue.id.split('-').pop() || '', 10)
        let foundInReports = false
        const updatedReports = parsed.map((rep: any) => {
          const matchesNumeric = numericId && rep.issue_id === numericId
          const matchesId = rep.id === activeModalIssue.id
          if (matchesNumeric || matchesId) {
            foundInReports = true
            return {
              ...rep,
              status: dbFormatStatus,
              admin_name: assignedAdmin,
              adminName: assignedAdmin,
              adminInitial: assignedInitial,
            }
          }
          return rep
        })
        if (!foundInReports) {
          updatedReports.push({
            issue_id: numericId,
            id: activeModalIssue.id,
            title: activeModalIssue.category,
            description: activeModalIssue.description,
            location: activeModalIssue.area,
            status: dbFormatStatus,
            source: 'admin',
            admin_name: assignedAdmin,
            adminName: assignedAdmin,
            adminInitial: assignedInitial,
            urgency: activeModalIssue.urgency,
            date_created: new Date().toISOString(),
            issue_categories: { category_name: activeModalIssue.category },
            issue_areas: { area_name: activeModalIssue.area },
          })
        }
        window.localStorage.setItem('unicare_demo_issue_reports', JSON.stringify(updatedReports))
        window.dispatchEvent(new Event('unicare-demo-reports-updated'))
      }
    } catch {
      // Ignore
    }

    // 4. Send notification
    try {
      // 4.1 ส่งการแจ้งเตือนถึงผู้รายงานเคสโดยเฉพาะ (เฉพาะ User คนที่แจ้ง)
      addNotification({
        title: `อัปเดตสถานะเคส #${activeModalIssue.id}`,
        description: `เคส "${activeModalIssue.category} (${activeModalIssue.area})" ได้รับการเปลี่ยนสถานะเป็น "${finalStatusLabel}" โดย ${authorName}`,
        type: statusKey === 'resolved' ? 'status' : 'urgent',
        isRead: false,
        link: '/my-reports',
        targetRole: 'user',
        targetEmail: activeModalIssue.reporterEmail,
        targetName: activeModalIssue.reporterName,
        issueId: activeModalIssue.id,
      })

      // 4.2 ส่งการแจ้งเตือนในฝั่งผู้ดูแลระบบ (Admin)
      addNotification({
        title: `เคส #${activeModalIssue.id} มีการเปลี่ยนสถานะ`,
        description: `เคส "${activeModalIssue.category} (${activeModalIssue.area})" เปลี่ยนสถานะเป็น "${finalStatusLabel}" โดย ${authorName}`,
        type: 'status',
        isRead: false,
        link: '/admin/issues',
        targetRole: 'admin',
        issueId: activeModalIssue.id,
      })
    } catch {
      // Ignore
    }

    // 4. Sync to Supabase if numeric issue_id
    try {
      const numericId = parseInt(activeModalIssue.id.split('-').pop() || '', 10)
      if (!isNaN(numericId) && numericId > 0) {
        let dbStatus = 'In_Progress'
        if (statusKey === 'pending') dbStatus = 'Pending'
        if (statusKey === 'resolved') dbStatus = 'Resolved'
        await supabase.from('issue_reports').update({ status: dbStatus }).eq('issue_id', numericId)
      }
    } catch {
      // Ignored
    }

    setIsSubmitting(false)
    setToastMessage(`บันทึกไทม์ไลน์ #${activeModalIssue.id} สถานะ "${finalStatusLabel}" สำเร็จแล้ว!`)
    setIsModalOpen(false)
    setActiveModalIssue(null)
    autoOpenedRef.current = null
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  const filteredIssues = useMemo(() => {
    const list = issues.filter((item) => {
      const cleanQuery = searchQuery.toLowerCase().trim()
      const matchesTimelineAuthor = timelineHistory[item.id]?.some(
        (entry) => entry.author && entry.author.toLowerCase().includes(cleanQuery),
      )

      const matchesSearch =
        !cleanQuery ||
        item.id.toLowerCase().includes(cleanQuery) ||
        item.area.toLowerCase().includes(cleanQuery) ||
        item.category.toLowerCase().includes(cleanQuery) ||
        item.description.toLowerCase().includes(cleanQuery) ||
        (item.adminName && item.adminName.toLowerCase().includes(cleanQuery)) ||
        (item.adminInitial && item.adminInitial.toLowerCase().includes(cleanQuery)) ||
        matchesTimelineAuthor

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || matchCategory(item.category, categoryFilter)
      return matchesSearch && matchesStatus && matchesCategory
    })

    return sortIssuesLatestFirst(list)
  }, [issues, searchQuery, statusFilter, categoryFilter, timelineHistory])

  // Pagination Logic
  const totalPages = Math.ceil(filteredIssues.length / ITEMS_PER_PAGE) || 1
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)

  const paginatedIssues = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE
    return filteredIssues.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredIssues, safeCurrentPage])

  const startIndex = filteredIssues.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1
  const endIndex = Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredIssues.length)

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value)
  }

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetPage = parseInt(pageInput, 10)
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      setCurrentPage(targetPage)
      setPageInput('')
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f4f7f5] text-slate-800 antialiased font-['Prompt',sans-serif]">
      <Suspense fallback={null}>
        <IssuesUrlWatcher
          onSelectIssue={handleSelectIssueFromUrl}
          onCreateIssue={handleCreateIssueFromUrl}
          onSelectCategory={handleSelectCategoryFromUrl}
        />
      </Suspense>
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="ระบบติดตามและจัดการสถานะการแก้ไข (Status Tracking & Action Log)"
          subtitle="บันทึก ติดตามไทม์ไลน์ และระบบสนทนาซักถามข้อมูลเพิ่มเติม (Case Comments & Clarification)"
          role="ADMIN"
        />

        <main className="p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* 1. Hero Banner */}
          <section className="relative rounded-2xl overflow-hidden hero-gradient text-white p-7 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="relative z-10 space-y-1.5 max-w-xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                ติดตามสถานะและบันทึกประวัติการแก้ไข
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-normal leading-relaxed">
                จัดการสถานะเคส (Issue Timeline), บันทึกหมายเหตุการแก้ไข และระบบสนทนาซักถามข้อมูลเพิ่มเติม (Case Comments & Clarification)
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenQuickTimelineModal}
              className="relative z-10 bg-white text-[#0e4435] font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:bg-emerald-50 active:scale-95 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างหรือบันทึกไทม์ไลน์ด่วน</span>
            </button>
          </section>

          {/* 2. Metric Cards 4 ช่อง */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center text-2xl shrink-0">
                📢
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">เรื่องทั้งหมด</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                  {issues.length} <span className="text-xs font-normal text-slate-400">เคส</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center text-2xl shrink-0">
                ⏳
              </div>
              <div>
                <p className="text-[11px] text-amber-600 font-semibold">รอดำเนินการ</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                  {issues.filter((i) => i.status === 'pending').length}{' '}
                  <span className="text-xs font-normal text-slate-400">เคส</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-2xl shrink-0">
                🔄
              </div>
              <div>
                <p className="text-[11px] text-blue-600 font-semibold">กำลังดำเนินการ</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                  {issues.filter((i) => i.status === 'in_progress').length}{' '}
                  <span className="text-xs font-normal text-slate-400">เคส</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-2xl shrink-0">
                ✅
              </div>
              <div>
                <p className="text-[11px] text-emerald-600 font-semibold">แก้ไขสำเร็จ</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                  {issues.filter((i) => i.status === 'resolved').length}{' '}
                  <span className="text-xs font-normal text-slate-400">เคส</span>
                </p>
              </div>
            </div>
          </section>

          {/* 3. Issue Table */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="text-base">📋</span>
                    <span>รายการเรื่องร้องเรียนและประวัติสถานะ (Issue Reports)</span>
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {filteredIssues.length} รายการ
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  คลิกไอคอนแชทเพื่อเปิดระบบซักถามข้อมูลเพิ่มเติม (Case Comments & Clarification) หรือคลิกปุ่มอัปเดตสถานะ
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหารหัสเคส, พื้นที่, ผู้รับผิดชอบ..."
                    className="pl-9 pr-4 py-2 border border-slate-200 bg-[#f8faf9] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 w-64 text-slate-700"
                  />
                </div>
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-slate-200 bg-[#f8faf9] px-3 py-2 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                  title="กรองตามหมวดหมู่ปัญหา"
                >
                  <option value="all">📂 ทุกหมวดหมู่</option>
                  {STANDARD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryIcon(cat)} {cat}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-slate-200 bg-[#f8faf9] px-3 py-2 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                  title="กรองตามสถานะการแก้ไข"
                >
                  <option value="all">📋 ทุกสถานะ</option>
                  <option value="pending">⏳ รอดำเนินการ</option>
                  <option value="in_progress">🔄 กำลังดำเนินการ</option>
                  <option value="resolved">✅ แก้ไขสำเร็จ</option>
                </select>
              </div>
            </div>

            {categoryFilter !== 'all' && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                <span className="font-semibold text-slate-700">กำลังกรองตามหมวดหมู่:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <span>{getCategoryIcon(categoryFilter)}</span>
                  <span>{categoryFilter}</span>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className="ml-1 text-emerald-600 hover:text-rose-600 cursor-pointer font-bold"
                    title="ล้างตัวกรองหมวดหมู่"
                  >
                    ✕
                  </button>
                </span>
                <span className="text-[11px] text-slate-500">พบ {filteredIssues.length} เคส</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8faf9] text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">รหัสเคส / วันที่</th>
                    <th className="py-3 px-4">หมวดหมู่ / พื้นที่ (Area)</th>
                    <th className="py-3 px-4">รายละเอียดปัญหา</th>
                    <th className="py-3 px-4">ผู้รับผิดชอบ (Admin)</th>
                    <th className="py-3 px-4">สถานะปัจจุบัน</th>
                    <th className="py-3 px-4 text-center">จัดการสถานะ / แชทซักถาม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedIssues.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        ไม่พบข้อมูลเรื่องร้องเรียนที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    paginatedIssues.map((item) => (
                      <tr
                        key={item.id}
                        className={`transition ${
                          highlightIssueId === item.id
                            ? 'bg-emerald-50/90 ring-2 ring-emerald-500/40'
                            : 'hover:bg-[#f6faf8]'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#154c3c]">#{item.id}</span>
                          <div className="text-[10px] text-slate-400">{item.date}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 flex items-center gap-1.5">
                            <span className="text-sm">{getCategoryIcon(item.category)}</span>
                            <span>{item.category}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>{item.area}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs">
                          {item.description}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {item.adminInitial}
                            </div>
                            <span className="text-xs font-medium text-slate-700">{item.adminName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {item.status === 'in_progress' && (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-semibold inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                              {item.statusLabel}
                            </span>
                          )}
                          {item.status === 'resolved' && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-semibold inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              {item.statusLabel}
                            </span>
                          )}
                          {item.status === 'pending' && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-semibold inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                              {item.statusLabel}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center justify-center gap-2">
                            {/* Chat Drawer Trigger (Case Comments & Clarification) */}
                            <button
                              type="button"
                              onClick={() => setActiveChatIssue(item)}
                              title="เปิดระบบสนทนาซักถามข้อมูลเพิ่มเติม (Case Comments & Clarification)"
                              className="w-8 h-8 rounded-xl bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition flex items-center justify-center relative shrink-0 shadow-xs cursor-pointer group"
                            >
                              <MessageCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            </button>

                            {/* Status Modal Trigger */}
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(item)}
                              className="w-28 py-1.5 bg-[#1b5e4a] text-white rounded-xl text-[11px] font-medium hover:bg-[#144737] transition shadow-xs inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                            >
                              <PenSquare className="w-3 h-3" />
                              <span>อัปเดตสถานะ</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredIssues.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <div className="text-[11px] text-slate-500">
                  แสดง <span className="font-semibold text-slate-800">{startIndex} - {endIndex}</span> จากทั้งหมด{' '}
                  <span className="font-semibold text-slate-800">{filteredIssues.length}</span> รายการ
                  {totalPages > 1 && (
                    <span className="ml-1 text-slate-400">
                      (หน้า <span className="font-semibold text-[#1b5e4a]">{safeCurrentPage}</span> / {totalPages})
                    </span>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={safeCurrentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                      title="หน้าก่อนหน้า"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Number Buttons */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-8 h-8 px-2 rounded-lg font-semibold text-xs transition cursor-pointer ${
                            safeCurrentPage === pageNum
                              ? 'bg-[#1b5e4a] text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={safeCurrentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                      title="หน้าถัดไป"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Page Jump Input (ช่องให้กรอกจำนวนหน้า) */}
                    <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
                      <span className="text-[11px] text-slate-500">ไปที่หน้า:</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={pageInput}
                        onChange={handlePageInputChange}
                        placeholder={String(safeCurrentPage)}
                        className="w-12 text-center py-1 px-1.5 border border-slate-200 bg-[#f8faf9] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 font-medium"
                      />
                      <span className="text-[11px] text-slate-400">/ {totalPages}</span>
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-[#1b5e4a] hover:text-white text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                      >
                        ไป
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ================= STATUS & TIMELINE MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in">
            {/* Header */}
            <div className="hero-gradient px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                {modalMode === 'create' ? (
                  <Plus className="w-4 h-4" />
                ) : (
                  <History className="w-4 h-4" />
                )}
                <h3 className="font-bold text-sm">
                  {modalMode === 'create'
                    ? 'สร้างเรื่องร้องเรียนใหม่ (Create Issue Report)'
                    : 'บันทึกไทม์ไลน์ด่วน (Quick Timeline & Action Log)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto text-xs">
              {/* Top Segmented Controls: แบ่งครึ่ง Modal (สร้าง vs บันทึกไทม์ไลน์ด่วน) */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalMode('create')}
                  className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    modalMode === 'create'
                      ? 'bg-[#1b5e4a] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้าง</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('quick_timeline')
                    if (!activeModalIssue && issues.length > 0) {
                      setActiveModalIssue(issues[0])
                      setNewStatus(issues[0].statusLabel)
                    }
                  }}
                  className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    modalMode === 'quick_timeline'
                      ? 'bg-[#1b5e4a] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>บันทึกไทม์ไลน์ด่วน</span>
                </button>
              </div>

              {/* Form Content depending on modalMode */}
              {modalMode === 'create' ? (
                <form onSubmit={handleCreateIssueSubmit} className="space-y-4">
                  {/* Create Form Fields */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      หมวดหมู่เรื่องร้องเรียน (Issue Category) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={createCategory}
                      onChange={(e) => setCreateCategory(e.target.value)}
                      className="w-full border border-slate-200 bg-[#f8faf9] px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 font-medium cursor-pointer"
                      required
                    >
                      {(activeCategories.length > 0 ? activeCategories : STANDARD_CATEGORIES).map((cat) => (
                        <option key={cat} value={cat}>
                          {getCategoryIcon(cat)} {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-semibold text-slate-700 text-xs">
                        สถานที่ / อาคารที่เกิดเหตุ (Area / Location) <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const nextCustom = !isCustomArea
                          setIsCustomArea(nextCustom)
                          if (nextCustom) {
                            setCreateArea(customAreaText)
                          } else {
                            setCreateArea(ALL_REPORT_PLACES[0]?.name || 'อาคารเรียนรวม 1')
                          }
                        }}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium underline flex items-center gap-1 cursor-pointer"
                      >
                        {isCustomArea ? '📋 เลือกจากรายการสถานที่' : '✏️ พิมพ์ระบุสถานที่เอง'}
                      </button>
                    </div>

                    {!isCustomArea ? (
                      <div className="space-y-1">
                        <select
                          value={createArea}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '__custom__') {
                              setIsCustomArea(true)
                              setCreateArea(customAreaText)
                            } else {
                              setCreateArea(val)
                            }
                          }}
                          className="w-full border border-slate-200 bg-[#f8faf9] px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 font-medium cursor-pointer"
                          required
                        >
                          <option value="" disabled>-- เลือกสถานที่ / อาคารที่เกิดเหตุ --</option>
                          {Object.entries(groupedLocations).map(([cat, places]) => (
                            <optgroup key={cat} label={`📂 ${cat}`}>
                              {places.map((place) => (
                                <option key={place.name} value={place.name}>
                                  {place.isPinned ? `📍 ${place.name} (ปักหมุดแล้ว)` : place.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          <option value="__custom__">✨ ระบุสถานที่อื่น ๆ ด้วยตนเอง...</option>
                        </select>
                        <p className="text-[11px] text-slate-500">
                          สถานที่ทั้งหมดอ้างอิงตามหน้าหมวดหมู่และพื้นที่เสี่ยง (สัญลักษณ์ 📍 คือจุดที่มีการปักหมุดบนแผนที่แล้ว)
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={createArea}
                          onChange={(e) => {
                            setCreateArea(e.target.value)
                            setCustomAreaText(e.target.value)
                          }}
                          placeholder="ระบุชื่อสถานที่ หรืออาคาร เช่น อาคารวิชาการ 1, ห้องประชุมใหญ่..."
                          className="w-full border border-slate-200 bg-[#f8faf9] px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
                          required
                          autoFocus
                        />
                        <p className="text-[11px] text-slate-500">
                          พิมพ์ระบุสถานที่ได้โดยอิสระ หรือกดปุ่ม &quot;เลือกจากรายการสถานที่&quot; ด้านบนเพื่อเลือกตามหมวดหมู่
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      สถานะเริ่มต้น (Initial Status)
                    </label>
                    <select
                      value={createStatus}
                      onChange={(e) => setCreateStatus(e.target.value)}
                      className="w-full border border-slate-200 bg-[#f8faf9] px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-700 font-medium cursor-pointer"
                    >
                      <option value="รอดำเนินการ">⏳ รอดำเนินการ (Pending)</option>
                      <option value="กำลังดำเนินการ">🔄 กำลังดำเนินการ (In Progress)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      เจ้าหน้าที่ผู้รับผิดชอบ (Person in Charge)
                    </label>
                    <select
                      value={createAdmin || getCurrentAdminDisplayName()}
                      onChange={(e) => setCreateAdmin(e.target.value)}
                      className="w-full border border-slate-200 bg-[#f8faf9] px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-700 font-medium cursor-pointer"
                    >
                      {getSystemAdminNames().map((name) => (
                        <option key={name} value={`${name} (Admin)`}>
                          {name} (Admin)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      รายละเอียดเรื่องร้องเรียน (Issue Description) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={createDescription}
                      onChange={(e) => setCreateDescription(e.target.value)}
                      placeholder="ระบุรายละเอียดปัญหาที่เกิดขึ้น ข้อเท็จจริง หรือข้อมูลที่ได้รับแจ้ง..."
                      className="w-full border border-slate-200 bg-[#f8faf9] p-3 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      แนบไฟล์หรือรูปภาพหลักฐาน (Evidence File / Photo)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition border border-slate-200">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>เลือกไฟล์แนบ</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setCreateEvidenceFile(file.name)
                          }}
                        />
                      </label>
                      {createEvidenceFile ? (
                        <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                          <span className="truncate max-w-xs">{createEvidenceFile}</span>
                          <button
                            type="button"
                            onClick={() => setCreateEvidenceFile('')}
                            className="text-slate-400 hover:text-rose-500 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">ยังไม่ได้เลือกไฟล์ (ไม่บังคับ)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-[#1b5e4a] text-white rounded-xl font-medium hover:bg-[#144737] transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>กำลังสร้าง...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>สร้างเรื่องร้องเรียน</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
                  {/* Quick Timeline Mode Form */}
                  {/* Select Case Dropdown */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      เลือกเรื่องร้องเรียน / รหัสเคส (Select Issue)
                    </label>
                    <select
                      value={activeModalIssue?.id || ''}
                      onChange={(e) => {
                        const found = issues.find((item) => item.id === e.target.value)
                        if (found) {
                          setActiveModalIssue(found)
                          setNewStatus(found.statusLabel)
                        }
                      }}
                      className="w-full border border-slate-200 bg-[#f8faf9] px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 font-medium cursor-pointer"
                    >
                      {issues.map((i) => (
                        <option key={i.id} value={i.id}>
                          #{i.id} : {getCategoryIcon(i.category)} {i.category} - {i.area} ({i.statusLabel})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Case Summary Card */}
                  {activeModalIssue && (
                    <div className="bg-[#f8faf9] p-3.5 rounded-xl border border-slate-200 flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1b5e4a]">#{activeModalIssue.id}</span>
                          <span className="text-[10px] text-slate-400">({activeModalIssue.date})</span>
                        </div>
                        <div className="font-semibold text-slate-800 text-xs mt-0.5 truncate flex items-center gap-1.5">
                          <span>{getCategoryIcon(activeModalIssue.category)}</span>
                          <span>{activeModalIssue.category} — {activeModalIssue.area}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {activeModalIssue.description}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0 ${
                          activeModalIssue.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : activeModalIssue.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {activeModalIssue.statusLabel}
                      </span>
                    </div>
                  )}

                  {/* Responsible Admin Display & Reassignment */}
                  <div className="flex flex-col gap-2 text-xs bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/70">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">เจ้าหน้าที่ผู้รับผิดชอบเคส:</span>
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        {modalAdmin || activeModalIssue?.adminName || ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60">
                      <span className="text-slate-600 font-medium">มอบหมาย / เปลี่ยนผู้รับผิดชอบ:</span>
                      <select
                        value={modalAdmin || activeModalIssue?.adminName || ''}
                        onChange={(e) => setModalAdmin(e.target.value)}
                        className="bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        {getSystemAdminNames().map((name) => (
                          <option key={name} value={`${name} (Admin)`}>
                            {name} (Admin)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ปรับปรุงสถานะ (Update Status)
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full border border-slate-200 bg-[#f8faf9] px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-700 font-medium cursor-pointer"
                    >
                      <option value="รอดำเนินการ">⏳ รอดำเนินการ (Pending)</option>
                      <option value="กำลังดำเนินการ">🔄 กำลังดำเนินการ (In Progress)</option>
                      <option value="แก้ไขสำเร็จ">✅ แก้ไขสำเร็จ (Resolved)</option>
                      <option value="ยกเลิก / ไม่สามารถดำเนินการได้">❌ ยกเลิก / ไม่สามารถดำเนินการได้</option>
                    </select>
                  </div>

                  {/* Action Note */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      บันทึกรายละเอียด / หมายเหตุการปฏิบัติงาน (Action Log Details) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="ระบุรายละเอียดความคืบหน้า ผลการตรวจสอบ หรือข้อความชี้แจง..."
                      className="w-full border border-slate-200 bg-[#f8faf9] p-3 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
                      required
                    ></textarea>
                  </div>

                  {/* File Attachment */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      แนบไฟล์หรือรูปภาพหลักฐาน (Evidence File / Photo)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition border border-slate-200">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>เลือกไฟล์แนบ</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setEvidenceFileName(file.name)
                          }}
                        />
                      </label>
                      {evidenceFileName ? (
                        <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                          <span className="truncate max-w-xs">{evidenceFileName}</span>
                          <button
                            type="button"
                            onClick={() => setEvidenceFileName('')}
                            className="text-slate-400 hover:text-rose-500 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">ยังไม่ได้เลือกไฟล์ (ไม่บังคับ)</span>
                      )}
                    </div>
                  </div>

                  {/* Timeline History */}
                  {activeModalIssue && (
                    <div className="border-t border-slate-100 pt-4 mt-2">
                      <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-[#1b5e4a]" /> ประวัติไทม์ไลน์ของเคส #{activeModalIssue.id}
                      </h4>
                      {(!timelineHistory[activeModalIssue.id] || timelineHistory[activeModalIssue.id].length === 0) ? (
                        <div className="p-4 text-center text-slate-400 bg-[#f8faf9] rounded-xl border border-dashed border-slate-200 text-[11px]">
                          ยังไม่มีประวัติไทม์ไลน์สำหรับเคสนี้ บันทึกไทม์ไลน์รายการแรกได้เลย
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                          {timelineHistory[activeModalIssue.id].map((t, idx) => (
                            <div
                              key={idx}
                              className="flex items-start space-x-3 p-3 bg-[#f8faf9] rounded-xl border border-slate-100"
                            >
                              <div className={`w-2 h-2 mt-1.5 rounded-full ${t.color} shrink-0`}></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between font-semibold text-slate-700">
                                  <span className="truncate">{t.statusText}</span>
                                  <span className="text-slate-400 font-normal shrink-0 text-[10px] ml-2">{t.time}</span>
                                </div>
                                <p className="text-slate-500 mt-0.5 leading-relaxed">{t.note}</p>
                                <div className="text-[10px] text-[#1b5e4a] mt-1 font-medium">
                                  - บันทึกโดย: {t.author}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-[#1b5e4a] text-white rounded-xl font-medium hover:bg-[#144737] transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>กำลังบันทึก...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>บันทึกไทม์ไลน์ด่วน</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= CLARIFICATION CHAT DRAWER ================= */}
      <CaseClarificationDrawer
        isOpen={Boolean(activeChatIssue)}
        reportId={activeChatIssue ? activeChatIssue.id : null}
        reportTitle={
          activeChatIssue
            ? `${getCategoryIcon(activeChatIssue.category)} ${activeChatIssue.category} - ${activeChatIssue.area}`
            : undefined
        }
        onClose={() => setActiveChatIssue(null)}
        currentUserRole="admin"
        currentUserName={getCurrentAdminDisplayName()}
      />

      {/* ================= TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-800 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-emerald-600 animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
