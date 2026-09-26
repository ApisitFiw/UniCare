import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabaseClient'
import type { IssueItem, UrgencyLevel } from '@/lib/issuesData'
import type { FeedbackItem } from '@/lib/feedbackData'

/**
 * Interface representing a Supabase Profile
 */
export interface SupabaseProfile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'user'
  avatar_url?: string | null
  department?: string | null
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
    const savedNotifs = localStorage.getItem('unicare_demo_notifications_v4')
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
          localStorage.setItem('unicare_demo_notifications_v4', JSON.stringify(cleanNotifs))
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
          1: item.speed_rating || item.overall_rating || 5,
          2: item.speed_rating || item.overall_rating || 5,
          3: item.communication_rating || item.overall_rating || 5,
          4: item.communication_rating || item.overall_rating || 5,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: item.overall_rating || 5,
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
 * Insert new feedback to Supabase
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

    const payload = {
      issue_id: targetIssueId,
      user_id: userId,
      overall_rating: fb.rating,
      speed_rating: fb.criteriaScores?.[1] || fb.rating,
      communication_rating: fb.criteriaScores?.[3] || fb.rating,
      is_resolved_confirmed: fb.isSolved,
      comment: fb.comment,
    }

    const { error } = await supabase.from('feedbacks').insert(payload)
    if (error) {
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
// 5. PROFILES / USERS
// -------------------------------------------------------------

/**
 * Fetch all profiles from Supabase
 */
export async function fetchProfilesFromSupabase(): Promise<SupabaseProfile[] | null> {
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
  role?: 'admin' | 'user'
  department?: string
  avatar_url?: string | null
}): Promise<boolean> {
  try {
    const payload: Record<string, any> = {
      email: profile.email.trim(),
      full_name: profile.full_name.trim(),
      role: profile.role || 'user',
      department: profile.department || 'มหาวิทยาลัยวลัยลักษณ์',
      updated_at: new Date().toISOString(),
    }
    if (profile.avatar_url !== undefined) {
      payload.avatar_url = profile.avatar_url
    }
    if (profile.id) {
      payload.id = profile.id
    }

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'email' })
    if (error) {
      console.warn('upsertProfileInSupabase error:', error.message)
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', email.trim())
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
