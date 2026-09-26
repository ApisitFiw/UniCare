import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabaseClient'
import type { IssueItem, UrgencyLevel, TimelineEntry } from '@/lib/issuesData'
import type { FeedbackItem } from '@/lib/feedbackData'

/**
 * Interface representing a Supabase Profile
 */
export interface SupabaseProfile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'user' | string
  avatar_url?: string | null
  department?: string | null
  phone?: string | null
  username?: string | null
  prefix?: string | null
  first_name?: string | null
  last_name?: string | null
  nickname?: string | null
  gender?: string | null
  birth_date?: string | null
  dormitory?: string | null
  building?: string | null
  floor?: string | null
  room_number?: string | null
  residence_location?: string | null
  address_line?: string | null
  subdistrict?: string | null
  district?: string | null
  province?: string | null
  postal_code?: string | null
  status?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Interface representing a Supabase Category
 */
export interface SupabaseCategory {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  is_active?: boolean
  created_at?: string
}

/**
 * Interface representing a Supabase Risk Area
 */
export interface SupabaseRiskArea {
  id: string
  name: string
  frequent_issues?: string | null
  risk_level: string
  latitude: number
  longitude: number
  color?: string | null
  created_at?: string
}

// -------------------------------------------------------------
// 1. ISSUES & REPORTS
// -------------------------------------------------------------

/**
 * Helper to map raw issues array from Supabase into IssueItem[]
 */
function mapRawIssues(data: any[]): IssueItem[] {
  if (!Array.isArray(data)) return []
  return data.map((item: any) => {
    // Map priority to UrgencyLevel
    let urgency: UrgencyLevel = 'ปกติ'
    if (item.priority === 'urgent' || item.priority === 'high' || item.priority === 'very_high') {
      urgency = item.priority === 'urgent' ? 'เร่งด่วนมาก' : 'เร่งด่วน'
    }

    // Map status to label
    let statusLabel = 'รอดำเนินการ'
    if (item.status === 'in_progress') statusLabel = 'กำลังดำเนินการ'
    else if (item.status === 'resolved') statusLabel = 'แก้ไขสำเร็จ'
    else if (item.status === 'rejected') statusLabel = 'ปฏิเสธเรื่อง'

    // Date formatting with 4-digit year for correct sorting
    const createdDate = item.created_at ? new Date(item.created_at) : new Date()
    const formattedDate = `${createdDate.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })} - ${createdDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`

    const adminFullName = item.assignee?.full_name || 'นัฐกรณ์'
    const adminName = adminFullName.includes('(Admin)') ? adminFullName : `${adminFullName} (Admin)`
    const adminInitial = adminFullName.substring(0, 2)

    return {
      id: item.ticket_number || item.id,
      supabaseId: item.id,
      rawId: item.id,
      date: formattedDate,
      category: item.categories?.name || item.title || 'ทั่วไป',
      area: item.risk_areas?.name || item.location_detail || 'มหาวิทยาลัยวลัยลักษณ์',
      description: item.description || item.title || 'ไม่มีรายละเอียด',
      adminName,
      adminInitial,
      reporterName: item.reporter?.full_name || 'ผู้ใช้งาน',
      reporterEmail: item.reporter?.email || 'user@wu.ac.th',
      status: (item.status as any) || 'pending',
      statusLabel,
      urgency,
    }
  })
}

/**
 * Cache helpers for offline resilience
 */
export function getCachedIssues(): IssueItem[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('unicare_cached_supabase_issues')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return null
}

export function setCachedIssues(issues: IssueItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('unicare_cached_supabase_issues', JSON.stringify(issues))
  } catch {}
}

/**
 * Purge deleted issue from all local browser storage caches immediately
 */
export function removeIssueFromLocalStorage(idOrTicket: string) {
  if (typeof window === 'undefined' || !idOrTicket) return
  const clean = String(idOrTicket).replace(/^#/, '').trim().toLowerCase()
  const numMatch = clean.match(/\d+$/)
  const numericPart = numMatch ? numMatch[0] : ''

  // 1. Remove from cached Supabase issues
  try {
    const cached = localStorage.getItem('unicare_cached_supabase_issues')
    if (cached) {
      const list = JSON.parse(cached)
      if (Array.isArray(list)) {
        const updated = list.filter((item: any) => {
          const itemId = String(item.id || '').replace(/^#/, '').trim().toLowerCase()
          const subId = String(item.supabaseId || item.rawId || '').toLowerCase()
          if (itemId === clean || subId === clean) return false
          if (numericPart && itemId.endsWith(numericPart)) return false
          return true
        })
        localStorage.setItem('unicare_cached_supabase_issues', JSON.stringify(updated))
      }
    }
  } catch {}

  // 2. Remove from unicare_demo_issue_reports
  try {
    const reports = localStorage.getItem('unicare_demo_issue_reports')
    if (reports) {
      const list = JSON.parse(reports)
      if (Array.isArray(list)) {
        const updated = list.filter((item: any) => {
          const itemId = String(item.id || '').replace(/^#/, '').trim().toLowerCase()
          const itemCode = String(item.code || '').replace(/^#/, '').trim().toLowerCase()
          const issueId = String(item.issue_id || '').toLowerCase()
          const subId = String(item.supabaseId || '').toLowerCase()
          if (itemId === clean || itemCode === clean || issueId === clean || subId === clean) return false
          if (numericPart && (itemId.endsWith(numericPart) || itemCode.endsWith(numericPart) || issueId === numericPart)) return false
          return true
        })
        localStorage.setItem('unicare_demo_issue_reports', JSON.stringify(updated))
      }
    }
  } catch {}

  // 3. Remove from timeline
  try {
    const timeline = localStorage.getItem('unicare_demo_timeline_history')
    if (timeline) {
      const map = JSON.parse(timeline)
      if (typeof map === 'object' && map !== null) {
        for (const key of Object.keys(map)) {
          const cleanKey = key.replace(/^#/, '').trim().toLowerCase()
          if (cleanKey === clean || (numericPart && cleanKey.endsWith(numericPart))) {
            delete map[key]
          }
        }
        localStorage.setItem('unicare_demo_timeline_history', JSON.stringify(map))
      }
    }
  } catch {}

  // 4. Notify open windows & tabs
  window.dispatchEvent(new Event('storage'))
  window.dispatchEvent(new Event('unicare-demo-reports-updated'))
  window.dispatchEvent(new Event('unicare-issues-sync'))
}

/**
 * Reconcile local storage reports with Supabase live issues
 * If an issue was created / synced to Supabase but is no longer in Supabase, remove it.
 */
export function syncSupabaseIssuesWithLocalStorage(remoteIssues: IssueItem[]) {
  if (typeof window === 'undefined' || !Array.isArray(remoteIssues)) return
  try {
    const remoteCleanKeys = new Set(
      remoteIssues.map((r) => r.id.replace(/^#/, '').trim().toLowerCase())
    )
    const remoteNumKeys = new Set(
      remoteIssues
        .map((r) => {
          const m = r.id.match(/\d+$/)
          return m ? m[0] : ''
        })
        .filter(Boolean)
    )

    // 1. Purge unicare_demo_issue_reports of any issue not in remote Supabase issues
    const savedReports = localStorage.getItem('unicare_demo_issue_reports')
    if (savedReports) {
      const currentList = JSON.parse(savedReports)
      if (Array.isArray(currentList)) {
        const filteredList = currentList.filter((item: any) => {
          const itemId = String(item.id || '').replace(/^#/, '').trim().toLowerCase()
          const itemCode = String(item.code || '').replace(/^#/, '').trim().toLowerCase()
          const issueId = String(item.issue_id || '').toLowerCase()
          const numMatch = (itemId || itemCode || issueId).match(/\d+$/)

          return (
            remoteCleanKeys.has(itemId) ||
            remoteCleanKeys.has(itemCode) ||
            (numMatch && remoteNumKeys.has(numMatch[0]))
          )
        })
        if (filteredList.length !== currentList.length) {
          localStorage.setItem('unicare_demo_issue_reports', JSON.stringify(filteredList))
        }
      }
    }

    // 2. Purge unicare_demo_timeline_history of any issue not in remote Supabase issues
    const savedTimeline = localStorage.getItem('unicare_demo_timeline_history')
    if (savedTimeline) {
      const parsedTimeline = JSON.parse(savedTimeline)
      if (typeof parsedTimeline === 'object' && parsedTimeline !== null) {
        let changed = false
        for (const key of Object.keys(parsedTimeline)) {
          const cleanKey = key.replace(/^#/, '').trim().toLowerCase()
          const m = cleanKey.match(/\d+$/)
          const inRemote = remoteCleanKeys.has(cleanKey) || (m && remoteNumKeys.has(m[0]))
          if (!inRemote) {
            delete parsedTimeline[key]
            changed = true
          }
        }
        if (changed) {
          localStorage.setItem('unicare_demo_timeline_history', JSON.stringify(parsedTimeline))
        }
      }
    }

    // 3. Purge unicare_feedbacks of any issue not in remote Supabase issues
    const savedFeedbacks = localStorage.getItem('unicare_feedbacks')
    if (savedFeedbacks) {
      const parsedFeedbacks = JSON.parse(savedFeedbacks)
      if (Array.isArray(parsedFeedbacks)) {
        const cleanFeedbacks = parsedFeedbacks.filter((item: any) => {
          const issueId = String(item.issueId || item.reportCode || '').replace(/^#/, '').trim().toLowerCase()
          const m = issueId.match(/\d+$/)
          return remoteCleanKeys.has(issueId) || (m && remoteNumKeys.has(m[0]))
        })
        if (cleanFeedbacks.length !== parsedFeedbacks.length) {
          localStorage.setItem('unicare_feedbacks', JSON.stringify(cleanFeedbacks))
        }
      }
    }

    // 4. Purge unicare_demo_notifications tied to deleted issues
    const savedNotifs = localStorage.getItem('unicare_demo_notifications')
    if (savedNotifs) {
      const parsedNotifs = JSON.parse(savedNotifs)
      if (Array.isArray(parsedNotifs)) {
        const cleanNotifs = parsedNotifs.filter((item: any) => {
          if (!item.issueId) return true // Keep general broadcasts
          const issueId = String(item.issueId).replace(/^#/, '').trim().toLowerCase()
          const m = issueId.match(/\d+$/)
          return remoteCleanKeys.has(issueId) || (m && remoteNumKeys.has(m[0]))
        })
        if (cleanNotifs.length !== parsedNotifs.length) {
          localStorage.setItem('unicare_demo_notifications', JSON.stringify(cleanNotifs))
        }
      }
    }

    // USER ACCOUNTS ARE FULLY PRESERVED (unicare_demo_session, unicare_demo_user_profile, unicare_demo_users, etc.)
  } catch {}
}

/**
 * Fetch all issues from Supabase joined with categories, risk areas, and profiles.
 * Features automatic fallback to direct REST and cached issues if network/offline occurs.
 */
export async function fetchIssuesFromSupabase(): Promise<IssueItem[] | null> {
  const query = '*, categories(id, name), risk_areas(id, name), reporter:profiles!reporter_id(id, full_name, email), assignee:profiles!assigned_to(id, full_name, email)'

  // 1. Try Supabase Client
  try {
    const { data, error } = await supabase.from('issues').select(query).order('created_at', { ascending: false })

    if (!error && Array.isArray(data)) {
      const mapped = mapRawIssues(data)
      setCachedIssues(mapped)
      syncSupabaseIssuesWithLocalStorage(mapped)
      return mapped
    }

    if (error) {
      const isNetworkError =
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('fetch failed')

      if (!isNetworkError) {
        console.warn('Supabase issues fetch error:', error.message)
      }
    }
  } catch (clientErr: any) {
    const isNetwork =
      clientErr?.message?.includes('Failed to fetch') ||
      clientErr?.message?.includes('NetworkError')

    if (!isNetwork) {
      console.warn('Supabase issues client error:', clientErr?.message)
    }
  }

  // 2. Direct REST Fallback (bypasses any stale token / auth interceptor issue)
  if (typeof window !== 'undefined') {
    try {
      const endpoint = `${supabaseUrl}/rest/v1/issues?select=${encodeURIComponent(query)}&order=created_at.desc`
      const res = await fetch(endpoint, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      })
      if (res.ok) {
        const raw = await res.json()
        if (Array.isArray(raw)) {
          const mapped = mapRawIssues(raw)
          setCachedIssues(mapped)
          syncSupabaseIssuesWithLocalStorage(mapped)
          return mapped
        }
      }
    } catch {
      // Offline or network unreachable
    }
  }

  // 3. Fallback to cached Supabase issues in localStorage only if network failed
  const cached = getCachedIssues()
  if (cached) {
    return cached
  }

  return []
}

/**
 * Insert a new issue to Supabase
 */
export async function createIssueInSupabase(issue: {
  ticketNumber: string
  title: string
  description: string
  categoryName?: string
  category?: string
  areaName?: string
  location?: string
  locationDetail?: string
  urgency?: UrgencyLevel
  reporterName?: string
  reporterEmail?: string
  reporterPhone?: string
  assignedAdminName?: string
  status?: 'pending' | 'in_progress' | 'resolved' | 'rejected'
}): Promise<boolean> {
  try {
    const catName = issue.categoryName || issue.category
    const area = issue.areaName || issue.location

    // 1. Resolve category_id
    let categoryId: string | null = null
    if (catName) {
      const { data: cats } = await supabase.from('categories').select('id, name')
      const matched = cats?.find((c) => c.name.toLowerCase().includes(catName.toLowerCase()) || catName.toLowerCase().includes(c.name.toLowerCase()))
      if (matched) categoryId = matched.id
      else if (cats && cats.length > 0) categoryId = cats[0].id
    }

    // 2. Resolve risk_area_id
    let riskAreaId: string | null = null
    if (area) {
      const { data: areas } = await supabase.from('risk_areas').select('id, name')
      const matched = areas?.find((a) => a.name.toLowerCase().includes(area.toLowerCase()) || area.toLowerCase().includes(a.name.toLowerCase()))
      if (matched) riskAreaId = matched.id
      else if (areas && areas.length > 0) riskAreaId = areas[0].id
    }

    // 3. Resolve reporter_id
    let reporterId: string | null = null
    const { data: profs } = await supabase.from('profiles').select('id, full_name, email, role')
    if (profs && profs.length > 0) {
      const matched = profs.find((p) => (issue.reporterEmail && p.email.toLowerCase() === issue.reporterEmail.toLowerCase()) || (issue.reporterName && p.full_name.includes(issue.reporterName)))
      reporterId = matched ? matched.id : profs.find((p) => p.role === 'user')?.id || profs[0].id
    }

    // 4. Resolve assigned admin
    let assignedAdminId: string | null = null
    if (issue.assignedAdminName && profs) {
      const cleanAdmin = issue.assignedAdminName.replace(/\(Admin\)/i, '').trim().toLowerCase()
      const matchedAdmin = profs.find((p) => p.role === 'admin' && (
        p.full_name.toLowerCase().includes(cleanAdmin) ||
        cleanAdmin.includes(p.full_name.toLowerCase()) ||
        (cleanAdmin.includes('apisit') && p.full_name.includes('อภิสิทธิ์')) ||
        (cleanAdmin.includes('อภิสิทธิ์') && p.full_name.toLowerCase().includes('apisit'))
      ))
      if (matchedAdmin) assignedAdminId = matchedAdmin.id
    }
    if (!assignedAdminId && profs) {
      const defaultAdmin = profs.find((p) => p.role === 'admin')
      if (defaultAdmin) assignedAdminId = defaultAdmin.id
    }

    // Priority mapping
    let priority = 'medium'
    if (issue.urgency === 'เร่งด่วนมาก') priority = 'high'
    else if (issue.urgency === 'ปกติ') priority = 'low'

    const payload = {
      ticket_number: issue.ticketNumber,
      title: issue.title || issue.description.substring(0, 50),
      description: issue.description,
      category_id: categoryId,
      risk_area_id: riskAreaId,
      location_detail: issue.locationDetail || area || '',
      status: issue.status || 'pending',
      priority,
      reporter_id: reporterId,
      assigned_to: assignedAdminId,
    }

    const { error } = await supabase.from('issues').insert(payload)
    if (error) {
      console.warn('createIssueInSupabase insert error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('createIssueInSupabase failed:', err)
    return false
  }
}

/**
 * Update issue status and assigned admin in Supabase
 */
export async function updateIssueStatusInSupabase(
  ticketNumberOrId: string,
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected',
  assignedAdminName?: string,
  fallbackReportData?: {
    title?: string
    description?: string
    category?: string
    area?: string
    locationDetail?: string
    urgency?: string
    reporterName?: string
    reporterEmail?: string
    reporterPhone?: string
  }
): Promise<boolean> {
  try {
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    }

    // If assignedAdminName is provided, find matching admin profile
    if (assignedAdminName) {
      const cleanName = assignedAdminName.replace(/\(Admin\)/i, '').trim().toLowerCase()
      const { data: profs } = await supabase.from('profiles').select('id, full_name, role').eq('role', 'admin')
      const matched = profs?.find((p) => {
        const fn = p.full_name.toLowerCase()
        return fn.includes(cleanName) || cleanName.includes(fn) ||
          (cleanName.includes('apisit') && fn.includes('อภิสิทธิ์')) ||
          (cleanName.includes('อภิสิทธิ์') && fn.includes('apisit'))
      })
      if (matched) {
        updatePayload.assigned_to = matched.id
      }
    }

    const cleanTicket = ticketNumberOrId.replace(/^#/, '').trim()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanTicket)
    const formattedTicket = (!cleanTicket.startsWith('ISS-') && !isUuid && /^\d+$/.test(cleanTicket))
      ? `ISS-2026-${cleanTicket.padStart(3, '0')}`
      : cleanTicket

    let updateQuery = supabase.from('issues').update(updatePayload)
    if (isUuid) {
      updateQuery = updateQuery.or(`ticket_number.eq.${cleanTicket},id.eq.${cleanTicket}`)
    } else if (formattedTicket !== cleanTicket) {
      updateQuery = updateQuery.or(`ticket_number.eq.${cleanTicket},ticket_number.eq.${formattedTicket}`)
    } else {
      updateQuery = updateQuery.eq('ticket_number', cleanTicket)
    }

    const { data: updatedRows, error } = await updateQuery.select('id')

    if (error) {
      console.warn('updateIssueStatusInSupabase error:', error.message)
      return false
    }

    // If 0 rows were updated, and fallbackReportData is provided, create it in Supabase!
    if ((!updatedRows || updatedRows.length === 0) && fallbackReportData) {
      await createIssueInSupabase({
        ticketNumber: formattedTicket,
        title: fallbackReportData.title || 'เรื่องร้องเรียน',
        description: fallbackReportData.description || 'รายละเอียดเรื่องร้องเรียน',
        category: fallbackReportData.category,
        areaName: fallbackReportData.area,
        locationDetail: fallbackReportData.locationDetail,
        urgency: fallbackReportData.urgency as any,
        reporterName: fallbackReportData.reporterName,
        reporterEmail: fallbackReportData.reporterEmail,
        reporterPhone: fallbackReportData.reporterPhone,
        assignedAdminName,
        status,
      })
    }

    return true
  } catch (err) {
    console.warn('updateIssueStatusInSupabase failed:', err)
    return false
  }
}

// -------------------------------------------------------------
// 2. FEEDBACKS & RATINGS
// -------------------------------------------------------------

/**
 * Fetch all feedbacks from Supabase joined with issues and profiles.
 */
export async function fetchFeedbacksFromSupabase(): Promise<FeedbackItem[] | null> {
  try {
    const query = '*, issues(id, ticket_number, title, categories(name), risk_areas(name)), profiles(id, full_name, email)'
    const { data, error } = await supabase.from('feedbacks').select(query).order('created_at', { ascending: false })

    if (error || !data) {
      if (error && !error.message?.includes('Failed to fetch') && !error.message?.includes('NetworkError')) {
        console.warn('Supabase feedbacks fetch error:', error?.message)
      }
      return null
    }

    const mapped: FeedbackItem[] = data.map((item: any) => {
      const ticketNum = item.issues?.ticket_number || item.issue_id
      const jsonScores = (typeof item.criteria_scores === 'object' && item.criteria_scores) || {}
      return {
        id: item.id,
        issueId: ticketNum,
        reportCode: ticketNum.startsWith('#') ? ticketNum : `#${ticketNum}`,
        userName: item.profiles?.full_name || 'ผู้ใช้งาน',
        category: item.issues?.categories?.name || 'ทั่วไป',
        categoryIcon: '',
        location: item.issues?.risk_areas?.name || 'มหาวิทยาลัยวลัยลักษณ์',
        rating: item.overall_rating || 5,
        isSolved: item.is_resolved_confirmed ?? true,
        comment: item.comment || '',
        reinspected: false,
        createdAt: item.created_at || new Date().toISOString(),
        criteriaScores: {
          1: item.speed_rating ?? jsonScores['1'] ?? jsonScores[1] ?? item.overall_rating ?? 5,
          2: item.timeliness_rating ?? jsonScores['2'] ?? jsonScores[2] ?? item.overall_rating ?? 5,
          3: item.communication_rating ?? jsonScores['3'] ?? jsonScores[3] ?? item.overall_rating ?? 5,
          4: item.professionalism_rating ?? jsonScores['4'] ?? jsonScores[4] ?? item.overall_rating ?? 5,
          5: item.update_status_rating ?? jsonScores['5'] ?? jsonScores[5] ?? item.overall_rating ?? 5,
          6: item.clarity_rating ?? jsonScores['6'] ?? jsonScores[6] ?? item.overall_rating ?? 5,
          7: item.cleanliness_rating ?? jsonScores['7'] ?? jsonScores[7] ?? item.overall_rating ?? 5,
          8: item.resolution_rating ?? jsonScores['8'] ?? jsonScores[8] ?? item.overall_rating ?? 5,
          9: item.prevention_rating ?? jsonScores['9'] ?? jsonScores[9] ?? item.overall_rating ?? 5,
          10: item.system_satisfaction_rating ?? jsonScores['10'] ?? jsonScores[10] ?? item.overall_rating ?? 5,
        },
      }
    })

    return mapped
  } catch (err) {
    console.warn('fetchFeedbacksFromSupabase failed:', err)
    return null
  }
}

/**
 * Insert new feedback to Supabase supporting all 10 criteria dimensions
 */
export async function createFeedbackInSupabase(fb: FeedbackItem): Promise<boolean> {
  try {
    // 1. Resolve issue UUID by ticket_number or id
    const cleanTicket = String(fb.issueId).replace(/^#/, '').trim()
    const { data: issues } = await supabase
      .from('issues')
      .select('id, ticket_number')
      .or(`ticket_number.eq.${cleanTicket},id.eq.${cleanTicket}`)
      .limit(1)

    let targetIssueId: string | null = issues?.[0]?.id || null

    // If not found, use first available issue or null
    if (!targetIssueId) {
      const { data: firstIssue } = await supabase.from('issues').select('id').limit(1)
      targetIssueId = firstIssue?.[0]?.id || null
    }

    if (!targetIssueId) {
      console.warn('No valid issue found in Supabase to attach feedback to')
      return false
    }

    // 2. Resolve user UUID
    const { data: profs } = await supabase.from('profiles').select('id, full_name, email, role')
    let userId: string | null = null
    if (profs && profs.length > 0) {
      const matched = profs.find((p) => p.full_name.includes(fb.userName) || fb.userName.includes(p.full_name))
      userId = matched ? matched.id : profs.find((p) => p.role === 'user')?.id || profs[0].id
    }

    const scores = fb.criteriaScores || {}
    const payload: Record<string, any> = {
      issue_id: targetIssueId,
      user_id: userId,
      overall_rating: fb.rating,
      speed_rating: scores[1] ?? fb.rating,
      timeliness_rating: scores[2] ?? fb.rating,
      communication_rating: scores[3] ?? fb.rating,
      professionalism_rating: scores[4] ?? fb.rating,
      update_status_rating: scores[5] ?? fb.rating,
      clarity_rating: scores[6] ?? fb.rating,
      cleanliness_rating: scores[7] ?? fb.rating,
      resolution_rating: scores[8] ?? fb.rating,
      prevention_rating: scores[9] ?? fb.rating,
      system_satisfaction_rating: scores[10] ?? fb.rating,
      criteria_scores: scores,
      is_resolved_confirmed: fb.isSolved,
      comment: fb.comment,
    }

    const { error } = await supabase.from('feedbacks').insert(payload)
    if (error) {
      // If error is due to missing columns in an older table schema, fallback to inserting core columns
      if (error.message?.includes('column') || error.code === '42703' || error.code === 'PGRST204') {
        const fallbackPayload = {
          issue_id: targetIssueId,
          user_id: userId,
          overall_rating: fb.rating,
          speed_rating: scores[1] ?? fb.rating,
          communication_rating: scores[3] ?? fb.rating,
          is_resolved_confirmed: fb.isSolved,
          comment: fb.comment,
        }
        const { error: fallbackErr } = await supabase.from('feedbacks').insert(fallbackPayload)
        if (fallbackErr) {
          console.warn('createFeedbackInSupabase fallback error:', fallbackErr.message)
          return false
        }
        return true
      }
      console.warn('createFeedbackInSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('createFeedbackInSupabase failed:', err)
    return false
  }
}

// -------------------------------------------------------------
// 3. CATEGORIES
// -------------------------------------------------------------

/**
 * Fetch all categories from Supabase
 */
export async function fetchCategoriesFromSupabase(): Promise<SupabaseCategory[] | null> {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true })
    if (error || !data) return null
    return data as SupabaseCategory[]
  } catch (err) {
    console.warn('fetchCategoriesFromSupabase failed:', err)
    return null
  }
}

/**
 * Upsert or insert a category into Supabase
 */
export async function saveCategoryToSupabase(category: {
  id?: string
  name: string
  description?: string
  icon?: string
  color?: string
  is_active?: boolean
}): Promise<boolean> {
  try {
    if (category.id && category.id.length === 36) {
      // UUID exists, update
      const { error } = await supabase.from('categories').update({
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        is_active: category.is_active ?? true,
      }).eq('id', category.id)
      return !error
    } else {
      // Insert
      const { error } = await supabase.from('categories').insert({
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        is_active: category.is_active ?? true,
      })
      return !error
    }
  } catch {
    return false
  }
}

/**
 * Delete a category from Supabase
 */
export async function deleteCategoryFromSupabase(idOrName: string): Promise<boolean> {
  try {
    if (idOrName.length === 36) {
      const { error } = await supabase.from('categories').delete().eq('id', idOrName)
      return !error
    } else {
      const { error } = await supabase.from('categories').delete().eq('name', idOrName)
      return !error
    }
  } catch {
    return false
  }
}

// -------------------------------------------------------------
// 4. RISK AREAS
// -------------------------------------------------------------

/**
 * Fetch all risk areas from Supabase
 */
export async function fetchRiskAreasFromSupabase(): Promise<SupabaseRiskArea[] | null> {
  try {
    const { data, error } = await supabase.from('risk_areas').select('*').order('created_at', { ascending: true })
    if (error || !data) return null
    return data as SupabaseRiskArea[]
  } catch (err) {
    console.warn('fetchRiskAreasFromSupabase failed:', err)
    return null
  }
}

/**
 * Save or update a risk area in Supabase
 */
export async function saveRiskAreaToSupabase(area: {
  id?: string
  name: string
  frequent_issues?: string
  risk_level?: string
  latitude: number
  longitude: number
  color?: string
}): Promise<boolean> {
  try {
    if (area.id && area.id.length === 36) {
      const { error } = await supabase.from('risk_areas').update({
        name: area.name,
        frequent_issues: area.frequent_issues,
        risk_level: area.risk_level || 'high',
        latitude: area.latitude,
        longitude: area.longitude,
        color: area.color,
      }).eq('id', area.id)
      return !error
    } else {
      const { error } = await supabase.from('risk_areas').insert({
        name: area.name,
        frequent_issues: area.frequent_issues,
        risk_level: area.risk_level || 'high',
        latitude: area.latitude,
        longitude: area.longitude,
        color: area.color,
      })
      return !error
    }
  } catch {
    return false
  }
}

/**
 * Delete a risk area from Supabase
 */
export async function deleteRiskAreaFromSupabase(idOrName: string): Promise<boolean> {
  try {
    if (idOrName.length === 36) {
      const { error } = await supabase.from('risk_areas').delete().eq('id', idOrName)
      return !error
    } else {
      const { error } = await supabase.from('risk_areas').delete().eq('name', idOrName)
      return !error
    }
  } catch {
    return false
  }
}

// -------------------------------------------------------------
// 5. ISSUE TIMELINES
// -------------------------------------------------------------

/**
 * Interface representing a Supabase Issue Timeline entry conforming to DataTable/issue_timelines.txt
 */
export interface SupabaseIssueTimeline {
  id: string
  issue_id: string
  status_text: string
  note?: string | null
  changed_status?: string | null
  changed_by?: string | null
  created_at: string
}

/**
 * Interface representing a Supabase Issue Comment conforming to DataTable/issue_comments.txt
 */
export interface SupabaseIssueComment {
  id: string
  issue_id: string
  sender_id?: string | null
  message: string
  attachment_url?: string | null
  attachment_name?: string | null
  created_at: string
}

/**
 * Insert a new timeline entry into the issue_timelines table in Supabase.
 * Conforms strictly to DataTable/issue_timelines.txt schema:
 * (id, issue_id, status_text, note, changed_status, changed_by, created_at)
 */
export async function addTimelineEntryToSupabase(entry: {
  ticketNumberOrId: string
  statusText: string
  note?: string
  authorName?: string
  authorId?: string
  changedStatus?: string
  evidenceFileName?: string
  evidenceFileUrl?: string
  fallbackIssueData?: {
    title?: string
    description?: string
    category?: string
    area?: string
    locationDetail?: string
    urgency?: string
    reporterName?: string
    reporterEmail?: string
  }
}): Promise<boolean> {
  try {
    const cleanTicket = entry.ticketNumberOrId.replace(/^#/, '').trim()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanTicket)
    const formattedTicket = !cleanTicket.startsWith('ISS-') && /^\d+$/.test(cleanTicket)
      ? `ISS-2026-${cleanTicket.padStart(3, '0')}`
      : cleanTicket

    // 1. Resolve the issue UUID
    let issueId: string | null = null
    if (isUuid) {
      const { data } = await supabase.from('issues').select('id, ticket_number').or(`ticket_number.eq.${cleanTicket},id.eq.${cleanTicket}`).limit(1)
      issueId = data?.[0]?.id || cleanTicket
    } else {
      const { data } = await supabase
        .from('issues')
        .select('id, ticket_number')
        .or(`ticket_number.eq.${cleanTicket},ticket_number.eq.${formattedTicket}`)
        .limit(1)
      issueId = data?.[0]?.id || null
    }

    // 1.1 If not found, and fallbackIssueData is provided, auto-create the issue in Supabase!
    if (!issueId && entry.fallbackIssueData) {
      try {
        const created = await createIssueInSupabase({
          ticketNumber: formattedTicket,
          title: entry.fallbackIssueData.title || 'เรื่องร้องเรียน',
          description: entry.fallbackIssueData.description || 'รายละเอียดเรื่องร้องเรียน',
          category: entry.fallbackIssueData.category,
          areaName: entry.fallbackIssueData.area,
          locationDetail: entry.fallbackIssueData.locationDetail || entry.fallbackIssueData.area,
          urgency: entry.fallbackIssueData.urgency as any,
          reporterName: entry.fallbackIssueData.reporterName,
          reporterEmail: entry.fallbackIssueData.reporterEmail,
          status: (entry.changedStatus as any) || 'pending',
        })
        if (created) {
          const { data: newIssue } = await supabase
            .from('issues')
            .select('id')
            .eq('ticket_number', formattedTicket)
            .maybeSingle()
          issueId = newIssue?.id || null
        }
      } catch (createErr) {
        console.warn('addTimelineEntryToSupabase auto-create issue error:', createErr)
      }
    }

    if (!issueId) {
      console.warn('addTimelineEntryToSupabase: issue not found for', cleanTicket)
      return false
    }

    // 2. Resolve author profile id (UUID referencing profiles(id))
    let changedById: string | null = null
    if (entry.authorId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.authorId)) {
      changedById = entry.authorId
    } else if (entry.authorName) {
      const cleanName = entry.authorName.replace(/\(Admin\)/i, '').trim().toLowerCase()
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', `%${cleanName}%`)
        .limit(1)
      changedById = profs?.[0]?.id || null
    }

    // Verify changedById actually exists in profiles to satisfy FK constraint
    if (changedById) {
      const { data: profExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', changedById)
        .maybeSingle()
      if (!profExists) {
        changedById = null
      }
    }

    // 3. Build note text (combining Action Log Details with Evidence File / Photo information)
    let noteText = entry.note?.trim() || ''
    if (entry.evidenceFileName) {
      const evidenceTag = entry.evidenceFileUrl && entry.evidenceFileUrl.startsWith('data:image/')
        ? `[แนบไฟล์: ${entry.evidenceFileName}|${entry.evidenceFileUrl}]`
        : `[แนบไฟล์: ${entry.evidenceFileName}]`
      noteText = noteText ? `${noteText}\n${evidenceTag}` : evidenceTag
    }

    const payload: Record<string, any> = {
      issue_id: issueId,
      status_text: entry.statusText,
      note: noteText || null,
      changed_status: entry.changedStatus || null,
      changed_by: changedById,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('issue_timelines').insert(payload)
    if (error) {
      console.error('Supabase issue_timelines insert error:', error.message, 'code:', error.code)
      if (error.code === '42501' || error.message?.includes('violates row-level security')) {
        console.error('⚠️ Supabase RLS Error: กรุณารันคำสั่งในไฟล์ DataTable/setup_timelines_and_comments.sql ที่ Supabase SQL Editor เพื่อเปิดสิทธิ์ RLS สำหรับ issue_timelines')
      }
      return false
    }
    return true
  } catch (err) {
    console.error('addTimelineEntryToSupabase failed:', err)
    return false
  }
}

/**
 * Fetch all timeline entries for a specific issue from Supabase issue_timelines.
 * Automatically resolves ticketNumber or UUID and returns structured TimelineEntry[].
 */
export async function fetchTimelineEntriesFromSupabase(
  ticketNumberOrId: string
): Promise<TimelineEntry[]> {
  try {
    if (!ticketNumberOrId) return []
    const cleanTicket = ticketNumberOrId.replace(/^#/, '').trim()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanTicket)

    // 1. Resolve issue UUID
    let issueId: string | null = null
    if (isUuid) {
      const { data } = await supabase.from('issues').select('id').eq('id', cleanTicket).maybeSingle()
      issueId = data?.id || cleanTicket
    } else {
      const formattedTicket = !cleanTicket.startsWith('ISS-') && /^\d+$/.test(cleanTicket)
        ? `ISS-2026-${cleanTicket.padStart(3, '0')}`
        : cleanTicket
      const { data } = await supabase
        .from('issues')
        .select('id')
        .or(`ticket_number.eq.${cleanTicket},ticket_number.eq.${formattedTicket}`)
        .limit(1)
      issueId = data?.[0]?.id || null
    }

    if (!issueId) return []

    // 2. Query issue_timelines joined with profiles for author details
    const { data, error } = await supabase
      .from('issue_timelines')
      .select('*, changed_by_profile:profiles!changed_by(id, full_name, role, email)')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })

    if (error) {
      if (!error.message?.includes('does not exist')) {
        console.warn('fetchTimelineEntriesFromSupabase error:', error.message)
      }
      return []
    }

    if (!data || !Array.isArray(data)) return []

    return data.map((row: any) => {
      const dateObj = row.created_at ? new Date(row.created_at) : new Date()
      const formattedTime = dateObj.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.'

      let entryColor = 'bg-blue-600'
      const st = `${row.changed_status || ''} ${row.status_text || ''}`.toLowerCase()
      if (st.includes('resolved') || st.includes('แก้ไข') || st.includes('สำเร็จ')) {
        entryColor = 'bg-emerald-600'
      } else if (st.includes('pending') || st.includes('รอ')) {
        entryColor = 'bg-amber-500'
      } else if (st.includes('reject') || st.includes('ยกเลิก') || st.includes('ปฏิเสธ')) {
        entryColor = 'bg-rose-600'
      }

      let cleanNote = row.note || ''
      let evidenceFileName: string | undefined
      let evidenceFileUrl: string | undefined
      const match = cleanNote.match(/\[แนบไฟล์:\s*([^\]|]+)(?:\|([^\]]+))?\]/)
      if (match) {
        evidenceFileName = match[1]?.trim()
        evidenceFileUrl = match[2]?.trim()
        cleanNote = cleanNote.replace(match[0], '').trim()
      }

      return {
        id: row.id,
        statusText: row.status_text || 'อัปเดตสถานะ',
        time: formattedTime,
        note: cleanNote || row.note || '',
        author: row.changed_by_profile?.full_name || 'เจ้าหน้าที่ / Admin',
        color: entryColor,
        changedStatus: row.changed_status || undefined,
        evidenceFile: evidenceFileName,
        evidenceUrl: evidenceFileUrl,
        createdAt: row.created_at,
      }
    })
  } catch (err) {
    console.warn('fetchTimelineEntriesFromSupabase failed:', err)
    return []
  }
}

/**
 * Fetch issue comments for a specific issue from Supabase issue_comments.
 * Conforming to DataTable/issue_comments.txt schema
 */
export async function fetchIssueCommentsFromSupabase(ticketNumberOrId: string) {
  try {
    const cleanTicket = ticketNumberOrId.replace(/^#/, '').trim()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanTicket)

    let issueId: string | null = null
    if (isUuid) {
      issueId = cleanTicket
    } else {
      const formattedTicket = !cleanTicket.startsWith('ISS-') && /^\d+$/.test(cleanTicket)
        ? `ISS-2026-${cleanTicket.padStart(3, '0')}`
        : cleanTicket
      const { data } = await supabase
        .from('issues')
        .select('id')
        .or(`ticket_number.eq.${cleanTicket},ticket_number.eq.${formattedTicket}`)
        .limit(1)
      issueId = data?.[0]?.id || null
    }

    if (!issueId) return []

    const { data, error } = await supabase
      .from('issue_comments')
      .select('*, sender:profiles!sender_id(id, full_name, email, role, avatar_url)')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true })

    if (error) {
      console.warn('fetchIssueCommentsFromSupabase error:', error.message)
      return []
    }
    return data || []
  } catch (err) {
    console.warn('fetchIssueCommentsFromSupabase failed:', err)
    return []
  }
}

/**
 * Update evidence metadata (evidence_count, evidence_files_json) on an issue row in Supabase.
 * Uses ticket_number to locate the row.
 */
export async function updateIssueEvidenceInSupabase(
  ticketNumber: string,
  evidenceFiles: Array<{ name: string; size: number; mimeType: string; type: string }>,
): Promise<boolean> {
  try {
    if (!ticketNumber || evidenceFiles.length === 0) return false

    const cleanTicket = ticketNumber.replace(/^#/, '').trim()

    // Build a lean JSON summary (no base64) to store in Supabase
    const evidenceSummary = evidenceFiles.map((f) => ({
      name: f.name,
      size: f.size,
      mimeType: f.mimeType,
      type: f.type,
    }))

    const updatePayload: Record<string, any> = {
      evidence_count: evidenceFiles.length,
      evidence_files_json: JSON.stringify(evidenceSummary),
      updated_at: new Date().toISOString(),
    }

    // Try by ticket_number first
    const { error: ticketErr } = await supabase
      .from('issues')
      .update(updatePayload)
      .eq('ticket_number', cleanTicket)

    if (!ticketErr) return true

    // Fallback: try formatted ticket
    const formattedTicket = !cleanTicket.startsWith('ISS-') && /^\d+$/.test(cleanTicket)
      ? `ISS-2026-${cleanTicket.padStart(3, '0')}`
      : cleanTicket

    const { error: formattedErr } = await supabase
      .from('issues')
      .update(updatePayload)
      .eq('ticket_number', formattedTicket)

    if (!formattedErr) return true

    console.warn('updateIssueEvidenceInSupabase errors:', ticketErr?.message, formattedErr?.message)
    return false
  } catch (err) {
    console.warn('updateIssueEvidenceInSupabase failed:', err)
    return false
  }
}

// -------------------------------------------------------------
// 6. PROFILES / USERS
// -------------------------------------------------------------

/**
 * Fetch all profiles from Supabase
 */
export async function fetchProfilesFromSupabase(): Promise<SupabaseProfile[] | null> {
  // 1. Direct REST fetch with anon key (bypasses expired JWT tokens)
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const endpoint = `${supabaseUrl}/rest/v1/profiles?select=*&order=created_at.asc`
      const res = await fetch(endpoint, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          return data as SupabaseProfile[]
        }
      }
    } catch {}
  }

  // 2. Fallback to Supabase client
  try {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
    if (error || !data) return null
    return data as SupabaseProfile[]
  } catch (err) {
    console.warn('fetchProfilesFromSupabase failed:', err)
    return null
  }
}

/**
 * Upsert profile in Supabase
 */
export async function upsertProfileInSupabase(profile: {
  id?: string
  email: string
  full_name: string
  role?: 'admin' | 'user' | string
  department?: string
  avatar_url?: string | null
  phone?: string | null
  username?: string | null
  prefix?: string | null
  first_name?: string | null
  last_name?: string | null
  nickname?: string | null
  gender?: string | null
  birth_date?: string | null
  dormitory?: string | null
  building?: string | null
  floor?: string | null
  room_number?: string | null
  residence_location?: string | null
  address_line?: string | null
  subdistrict?: string | null
  district?: string | null
  province?: string | null
  postal_code?: string | null
  status?: string | null
}): Promise<boolean> {
  try {
    const payload: Record<string, any> = {
      email: profile.email.trim(),
      full_name: profile.full_name.trim(),
      role: profile.role || 'user',
      department: profile.department || 'มหาวิทยาลัยวลัยลักษณ์',
      updated_at: new Date().toISOString(),
    }
    if (profile.avatar_url !== undefined) payload.avatar_url = profile.avatar_url
    if (profile.id) payload.id = profile.id
    if (profile.phone !== undefined) payload.phone = profile.phone
    if (profile.username !== undefined) payload.username = profile.username
    if (profile.prefix !== undefined) payload.prefix = profile.prefix
    if (profile.first_name !== undefined) payload.first_name = profile.first_name
    if (profile.last_name !== undefined) payload.last_name = profile.last_name
    if (profile.nickname !== undefined) payload.nickname = profile.nickname
    if (profile.gender !== undefined) payload.gender = profile.gender
    if (profile.birth_date !== undefined) payload.birth_date = profile.birth_date
    if (profile.dormitory !== undefined) payload.dormitory = profile.dormitory
    if (profile.building !== undefined) payload.building = profile.building
    if (profile.floor !== undefined) payload.floor = profile.floor
    if (profile.room_number !== undefined) payload.room_number = profile.room_number
    if (profile.residence_location !== undefined) payload.residence_location = profile.residence_location
    if (profile.address_line !== undefined) payload.address_line = profile.address_line
    if (profile.subdistrict !== undefined) payload.subdistrict = profile.subdistrict
    if (profile.district !== undefined) payload.district = profile.district
    if (profile.province !== undefined) payload.province = profile.province
    if (profile.postal_code !== undefined) payload.postal_code = profile.postal_code
    if (profile.status !== undefined) payload.status = profile.status

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'email' })
    if (error) {
      console.warn('upsertProfileInSupabase client error:', error.message)

      // 1. Direct REST Fallback with anon key (bypasses any stale auth tokens / RLS issues)
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const endpoint = `${supabaseUrl}/rest/v1/profiles?on_conflict=email`
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates,return=minimal',
            },
            body: JSON.stringify(payload),
          })
          if (res.ok) return true
        } catch {}
      }

      // 2. If error indicates column does not exist (before SQL migration), fallback to minimal payload
      if (error.message?.includes('column') || error.message?.includes('schema cache')) {
        const fallbackPayload = {
          email: profile.email.trim(),
          full_name: profile.full_name.trim(),
          role: profile.role || 'user',
          department: profile.department || 'มหาวิทยาลัยวลัยลักษณ์',
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        }
        const { error: fbErr } = await supabase.from('profiles').upsert(fallbackPayload, { onConflict: 'email' })
        if (fbErr) {
          console.warn('upsertProfileInSupabase fallback error:', fbErr.message)
          return false
        }
        return true
      }
      return false
    }
    return true
  } catch (err) {
    console.warn('upsertProfileInSupabase failed:', err)
    return false
  }
}

/**
 * Fetch a profile by email from Supabase
 */
export async function fetchProfileByEmailFromSupabase(email: string): Promise<SupabaseProfile | null> {
  try {
    if (!email) return null
    const cleanEmail = email.trim().toLowerCase()

    // 1. Direct REST fetch (bypasses expired JWT tokens)
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const endpoint = `${supabaseUrl}/rest/v1/profiles?email=ilike.${encodeURIComponent(cleanEmail)}&limit=1`
        const res = await fetch(endpoint, {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
        })
        if (res.ok) {
          const list = await res.json()
          if (Array.isArray(list) && list.length > 0) {
            return list[0] as SupabaseProfile
          }
        }
      } catch {}
    }

    // 2. Fallback to Supabase client
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', cleanEmail)
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return data as SupabaseProfile
  } catch {
    return null
  }
}

/**
 * Delete an issue from Supabase and clear local cache
 */
export async function deleteIssueFromSupabase(ticketOrId: string): Promise<boolean> {
  try {
    const cleanTicket = ticketOrId.replace(/^#/, '').trim()
    // 1. Delete from Supabase issues table by ticket_number
    const { error: ticketError } = await supabase.from('issues').delete().eq('ticket_number', cleanTicket)
    if (!ticketError) {
      removeIssueFromLocalStorage(cleanTicket)
      return true
    }

    // 2. Fallback: delete by id (UUID)
    const { error: idError } = await supabase.from('issues').delete().eq('id', ticketOrId)
    if (!idError) {
      removeIssueFromLocalStorage(cleanTicket)
      return true
    }

    console.warn('deleteIssueFromSupabase errors:', ticketError?.message, idError?.message)
    return false
  } catch (err) {
    console.warn('deleteIssueFromSupabase failed:', err)
    return false
  }
}
