'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Send,
  User,
  Shield,
  FileText,
  Loader2,
  WifiOff,
  MessageSquare,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { addNotification } from '@/lib/notifications'
import { getDemoSession } from '@/lib/authService'
import { getUserAllIssues, getAllCurrentIssues } from '@/lib/issuesData'

/**
 * Interface representing an Issue Comment conforming to DataTable/issue_comments.txt
 * (id, issue_id, sender_id, message, attachment_url, attachment_name, created_at)
 */
export interface IssueComment {
  id: string
  issue_id: string
  sender_id?: string | null
  message: string
  attachment_url?: string | null
  attachment_name?: string | null
  created_at: string
  // Display helper metadata
  sender_role?: 'admin' | 'user'
  sender_name?: string
  sender_avatar?: string | null
}

// Backward-compatible type alias
export type TicketMessage = IssueComment

export interface CaseClarificationDrawerProps {
  isOpen: boolean
  reportId?: string | number | null
  issueId?: string | number | null // Alias for backward compatibility
  reportTitle?: string
  issueTitle?: string // Alias
  onClose: () => void
  currentUserName?: string
  currentUserRole?: 'admin' | 'user' | 'ADMIN' | 'USER'
  currentUserId?: string
  reporterName?: string
  reporterEmail?: string
  assignedAdminName?: string
}

/**
 * Extracts sender metadata if stored inside message as <!--sender:{...}-->
 * and falls back to profile join or context defaults
 */
export function parseIssueComment(
  raw: any,
  defaults?: {
    reporterName?: string
    assignedAdminName?: string
    senderProfile?: { id?: string; full_name?: string; role?: string; email?: string } | null
  }
): IssueComment {
  let cleanMessage = raw.message || ''
  let senderName = raw.sender?.full_name || defaults?.senderProfile?.full_name || raw.sender_name
  let senderRole = raw.sender?.role || defaults?.senderProfile?.role || raw.sender_role
  let senderId = raw.sender_id

  if (cleanMessage.startsWith('<!--sender:')) {
    const endIdx = cleanMessage.indexOf('-->')
    if (endIdx !== -1) {
      try {
        const jsonStr = cleanMessage.substring('<!--sender:'.length, endIdx)
        const meta = JSON.parse(jsonStr)
        if (meta.name && !senderName) senderName = meta.name
        if (meta.id && !senderId) senderId = meta.id
        if (meta.role && !senderRole) senderRole = meta.role
        cleanMessage = cleanMessage.substring(endIdx + 3)
      } catch {
        // ignore parse error
      }
    }
  }

  // Normalize sender role
  const normalizedSenderRole: 'admin' | 'user' =
    String(senderRole || '').toLowerCase() === 'admin' ? 'admin' : 'user'

  // Fallbacks if senderName is still not set
  if (!senderName) {
    if (normalizedSenderRole === 'admin') {
      senderName = defaults?.assignedAdminName || 'เจ้าหน้าที่ / Admin'
    } else {
      senderName = defaults?.reporterName || 'ผู้แจ้งเรื่อง (User)'
    }
  }

  return {
    id: raw.id,
    issue_id: raw.issue_id,
    sender_id: senderId || null,
    message: cleanMessage,
    attachment_url: raw.attachment_url || null,
    attachment_name: raw.attachment_name || null,
    created_at: raw.created_at || new Date().toISOString(),
    sender_name: senderName,
    sender_role: normalizedSenderRole,
    sender_avatar: raw.sender?.avatar_url || null,
  }
}

// Backward-compatible alias
export const parseTicketMessage = parseIssueComment

export default function CaseClarificationDrawer({
  isOpen,
  reportId,
  issueId,
  reportTitle,
  issueTitle,
  onClose,
  currentUserName,
  currentUserRole = 'user',
  currentUserId,
  reporterName,
  reporterEmail,
  assignedAdminName,
}: CaseClarificationDrawerProps) {
  // Normalize role and ID
  const normalizedRole: 'admin' | 'user' =
    currentUserRole.toLowerCase() === 'admin' ? 'admin' : 'user'
  const activeReportId = reportId || issueId || null
  const activeTitle = reportTitle || issueTitle || ''

  const [messages, setMessages] = useState<IssueComment[]>([])
  const [newMessageText, setNewMessageText] = useState('')
  const [attachment, setAttachment] = useState<{ name: string; url: string; type: string } | null>(null)
  const [resolvedIssueUuid, setResolvedIssueUuid] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [isSending, setIsSending] = useState<boolean>(false)
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false)
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Fetch existing messages from issue_comments and subscribe to Realtime updates
  useEffect(() => {
    if (!isOpen || !activeReportId) {
      setMessages([])
      setResolvedIssueUuid(null)
      setIsUnauthorized(false)
      setAttachment(null)
      return
    }

    const currentId = String(activeReportId)
    let isMounted = true

    // For general users, ensure they own the report before fetching or subscribing
    if (normalizedRole === 'user') {
      const session = getDemoSession()
      const userIssues = getUserAllIssues(session)
      const targetId = currentId.replace(/^#/, '').trim().toLowerCase()
      const targetNumMatch = targetId.match(/\d+$/)
      const targetNum = targetNumMatch ? parseInt(targetNumMatch[0], 10) : null

      const ownsReport = userIssues.some((issue) => {
        const cleanId = String(issue.id || '').replace(/^#/, '').trim().toLowerCase()
        const cleanSubId = String(issue.supabaseId || '').trim().toLowerCase()
        const cleanRawId = String(issue.rawId || '').trim().toLowerCase()
        if (cleanId === targetId || cleanSubId === targetId || cleanRawId === targetId) return true
        if (targetNum !== null) {
          const issueNumMatch = cleanId.match(/\d+$/)
          if (issueNumMatch && parseInt(issueNumMatch[0], 10) === targetNum) return true
        }
        return false
      })

      const uEmail = (session?.email || '').trim().toLowerCase()
      const uName = (session?.name || '').trim().toLowerCase()
      const rEmail = (reporterEmail || '').trim().toLowerCase()
      const rName = (reporterName || '').trim().toLowerCase()
      const matchesEmailOrName = (uEmail && rEmail && uEmail === rEmail) || (uName && rName && uName === rName)

      if (!ownsReport && !matchesEmailOrName) {
        setIsUnauthorized(true)
        setLoading(false)
        return
      }
    }
    setIsUnauthorized(false)

    // Resolve issue UUID from issues table
    async function loadComments() {
      setLoading(true)
      try {
        const cleanId = currentId.replace(/^#/, '').trim()
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)

        let targetUuid: string | null = isUuid ? cleanId : null
        if (!targetUuid) {
          const formattedTicket = !cleanId.startsWith('ISS-') && /^\d+$/.test(cleanId)
            ? `ISS-2026-${cleanId.padStart(3, '0')}`
            : cleanId

          const { data: issueRows } = await supabase
            .from('issues')
            .select('id, ticket_number')
            .or(`ticket_number.eq.${cleanId},ticket_number.eq.${formattedTicket}`)
            .limit(1)

          targetUuid = issueRows?.[0]?.id || null
        }

        if (isMounted) {
          setResolvedIssueUuid(targetUuid)
        }

        if (!targetUuid) {
          // If no remote issue UUID found yet
          setLoading(false)
          return
        }

        // Fetch comments conforming to issue_comments table
        const { data, error } = await supabase
          .from('issue_comments')
          .select('*, sender:profiles!sender_id(id, full_name, email, role, avatar_url)')
          .eq('issue_id', targetUuid)
          .order('created_at', { ascending: true })

        if (!error && data && isMounted) {
          const parsed = data.map((m: any) =>
            parseIssueComment(m, { reporterName, assignedAdminName })
          )
          setMessages(parsed)
        } else if (error) {
          console.warn('issue_comments query error:', error.message)
        }
      } catch (err) {
        console.error('Error fetching issue comments:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadComments()

    // Setup Supabase Realtime Channel on issue_comments
    setRealtimeStatus('connecting')
    let channel: any = null

    // We set up the realtime channel once the UUID is known or by currentId
    const setupRealtime = async () => {
      const cleanId = currentId.replace(/^#/, '').trim()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)
      let targetUuid: string | null = isUuid ? cleanId : null

      if (!targetUuid) {
        const formattedTicket = !cleanId.startsWith('ISS-') && /^\d+$/.test(cleanId)
          ? `ISS-2026-${cleanId.padStart(3, '0')}`
          : cleanId
        const { data } = await supabase
          .from('issues')
          .select('id')
          .or(`ticket_number.eq.${cleanId},ticket_number.eq.${formattedTicket}`)
          .limit(1)
        targetUuid = data?.[0]?.id || null
      }

      if (!isMounted || !targetUuid) return

      const channelName = `issue_comments_channel_${targetUuid}_${Date.now()}`
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'issue_comments',
            filter: `issue_id=eq.${targetUuid}`,
          },
          async (payload) => {
            if (!isMounted) return
            let senderProfile = null
            if (payload.new.sender_id) {
              const { data: p } = await supabase
                .from('profiles')
                .select('id, full_name, email, role, avatar_url')
                .eq('id', payload.new.sender_id)
                .maybeSingle()
              senderProfile = p
            }

            const newRow = parseIssueComment(payload.new, {
              reporterName,
              assignedAdminName,
              senderProfile,
            })

            setMessages((prev) => {
              if (prev.some((m) => m.id === newRow.id)) return prev
              return [...prev, newRow]
            })
          }
        )
        .subscribe((status) => {
          if (!isMounted) return
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('connected')
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setRealtimeStatus('disconnected')
          }
        })
    }

    setupRealtime()

    return () => {
      isMounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [isOpen, activeReportId, reporterName, assignedAdminName])

  // Scroll to bottom function
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' })
    }
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  // Auto-scroll to bottom whenever new messages arrive, when drawer opens, or after loading
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        scrollToBottom('smooth')
      }, 60)
      return () => clearTimeout(timer)
    }
  }, [messages, isOpen, loading])

  if (!isOpen || !activeReportId) return null

  // Format created_at to readable time
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return 'เมื่อสักครู่'
      return (
        d.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
        }) + ' น.'
      )
    } catch {
      return 'เมื่อสักครู่'
    }
  }

  // Handle Attachment Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5 MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setAttachment({
        name: file.name,
        url: reader.result as string,
        type: file.type,
      })
    }
    reader.readAsDataURL(file)
  }

  // 2. Send new comment to issue_comments table in Supabase
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newMessageText.trim()
    if ((!trimmed && !attachment) || isSending) return

    const currentId = String(activeReportId)
    const tempId = `temp-${Date.now()}`
    const tempCreatedAt = new Date().toISOString()
    const senderDisplayName =
      currentUserName ||
      (normalizedRole === 'admin' ? 'เจ้าหน้าที่ (Admin)' : 'ผู้แจ้งเรื่อง (User)')

    // Optimistic comment to display instantly
    const optimisticMsg: IssueComment = {
      id: tempId,
      issue_id: resolvedIssueUuid || currentId,
      sender_role: normalizedRole,
      sender_id: currentUserId || null,
      sender_name: senderDisplayName,
      message: trimmed,
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      created_at: tempCreatedAt,
    }

    setMessages((prev) => [...prev, optimisticMsg])
    const sentAttachment = attachment
    setNewMessageText('')
    setAttachment(null)
    setIsSending(true)

    // Trigger immediate scroll on send
    setTimeout(() => scrollToBottom('smooth'), 10)

    try {
      // 1. Resolve issue UUID if not yet resolved
      let targetIssueUuid = resolvedIssueUuid
      if (!targetIssueUuid) {
        const cleanId = currentId.replace(/^#/, '').trim()
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)
        if (isUuid) {
          targetIssueUuid = cleanId
        } else {
          const formattedTicket = !cleanId.startsWith('ISS-') && /^\d+$/.test(cleanId)
            ? `ISS-2026-${cleanId.padStart(3, '0')}`
            : cleanId
          const { data: issueRows } = await supabase
            .from('issues')
            .select('id')
            .or(`ticket_number.eq.${cleanId},ticket_number.eq.${formattedTicket}`)
            .limit(1)
          targetIssueUuid = issueRows?.[0]?.id || null
        }
      }

      if (!targetIssueUuid) {
        console.warn('Cannot send comment: Issue UUID not resolved')
        setIsSending(false)
        return
      }

      // 2. Resolve sender UUID (from profiles table)
      let resolvedSenderUuid: string | null = null
      if (currentUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUserId)) {
        resolvedSenderUuid = currentUserId
      } else {
        const searchKey = currentUserId || currentUserName
        if (searchKey) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id')
            .or(`email.eq.${searchKey},full_name.ilike.%${searchKey}%`)
            .limit(1)
          resolvedSenderUuid = profs?.[0]?.id || null
        }
      }

      // 3. Embed metadata into message string so all clients get real sender info
      const meta = JSON.stringify({
        name: senderDisplayName,
        id: currentUserId || '',
        role: normalizedRole,
      })
      const encodedMessage = `<!--sender:${meta}-->${trimmed}`

      // 4. Conforming payload according to DataTable/issue_comments.txt
      const payload: Record<string, unknown> = {
        issue_id: targetIssueUuid,
        sender_id: resolvedSenderUuid,
        message: encodedMessage,
        attachment_url: sentAttachment?.url || null,
        attachment_name: sentAttachment?.name || null,
      }

      const { data, error } = await supabase
        .from('issue_comments')
        .insert([payload])
        .select('*, sender:profiles!sender_id(id, full_name, email, role, avatar_url)')
        .single()

      if (!error && data) {
        const parsed = parseIssueComment(data, {
          reporterName,
          assignedAdminName,
        })
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? parsed : m))
        )
      } else if (error) {
        console.warn('Could not insert to issue_comments table:', error.message)
      }

      // 5. If Admin is sending, trigger notification for User
      if (normalizedRole === 'admin') {
        let finalReporterName = reporterName
        let finalReporterEmail = reporterEmail

        if (!finalReporterName && !finalReporterEmail) {
          const allIssues = getAllCurrentIssues()
          const cleanTarget = currentId.replace(/^#/, '').trim().toLowerCase()
          const matched = allIssues.find((i) => {
            const cleanId = String(i.id || '').replace(/^#/, '').trim().toLowerCase()
            const cleanSub = String(i.supabaseId || '').trim().toLowerCase()
            return cleanId === cleanTarget || cleanSub === cleanTarget
          })
          if (matched) {
            finalReporterName = matched.reporterName
            finalReporterEmail = matched.reporterEmail
          }
        }

        const notifTitle = 'เจ้าหน้าที่ตอบกลับข้อความแล้ว'
        const shortMsg = trimmed.length > 60 ? `${trimmed.slice(0, 60)}...` : trimmed
        const notifDesc = `เคส #${currentId}${activeTitle ? ` "${activeTitle}"` : ''}: ${shortMsg || 'แนบไฟล์หรือรูปภาพ'}`

        // Save locally and trigger window events for instant UI update
        addNotification({
          title: notifTitle,
          description: notifDesc,
          type: 'status',
          link: `/my-reports?chat=${currentId}`,
          targetRole: 'user',
          targetName: finalReporterName || undefined,
          targetEmail: finalReporterEmail || undefined,
          issueId: currentId,
          isRead: false,
        })

        // Also insert into Supabase notifications table
        supabase
          .from('notifications')
          .insert([
            {
              title: notifTitle,
              message: notifDesc,
              type: 'status',
              reference_id: currentId,
              is_read: false,
            },
          ])
          .then(({ error: notifErr }) => {
            if (notifErr) {
              console.warn('Could not record notification in Supabase:', notifErr.message)
            }
          })
      } else {
        // User is sending to Admin
        const notifTitle = 'ผู้แจ้งส่งข้อความเพิ่มเติม'
        const shortMsg = trimmed.length > 60 ? `${trimmed.slice(0, 60)}...` : trimmed
        const notifDesc = `เคส #${currentId}${activeTitle ? ` "${activeTitle}"` : ''}: ${shortMsg || 'แนบไฟล์หรือรูปภาพ'}`

        addNotification({
          title: notifTitle,
          description: notifDesc,
          type: 'status',
          link: `/admin/issues`,
          targetRole: 'admin',
          issueId: currentId,
          isRead: false,
        })
      }
    } catch (err) {
      console.error('Error inserting issue comment:', err)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50 transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="fixed top-0 right-0 h-full w-full max-w-sm sm:max-w-md bg-white z-50 shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition cursor-pointer"
              title="ปิดหน้าต่างแชท"
            >
              <X className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight">
                  ระบบสนทนาเรื่องแจ้ง
                </h3>
                <span
                  className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                    normalizedRole === 'admin'
                      ? 'bg-[#1b5e4a] text-white border-[#144737]'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {normalizedRole === 'admin' ? 'เจ้าหน้าที่ (Admin)' : 'ผู้แจ้งเรื่อง (User)'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] text-slate-400 font-medium">
                  (issue_comments Realtime)
                </p>
                {realtimeStatus === 'connected' ? (
                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.2 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Realtime</span>
                  </span>
                ) : realtimeStatus === 'connecting' ? (
                  <span className="inline-flex items-center gap-1 text-[9px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.2 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>เชื่อมต่อ...</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.2 rounded">
                    <WifiOff className="w-2.5 h-2.5" />
                    <span>ออฟไลน์</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-700 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200">
            #{activeReportId}
          </span>
        </div>

        {/* Optional Issue Title Banner */}
        {activeTitle && (
          <div className="px-4 py-2 bg-[#f8faf9] border-b border-slate-100 text-[11px] text-slate-600 truncate flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="font-semibold text-slate-700">เคส:</span>
            <span className="truncate">{activeTitle}</span>
          </div>
        )}

        {/* Message History with auto-scroll container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-50/50 scroll-smooth"
        >
          {isUnauthorized ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">ไม่มีสิทธิ์เข้าถึงการสนทนานี้</h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                คุณสามารถดูและสนทนากับเจ้าหน้าที่ได้เฉพาะเคสที่คุณเป็นผู้แจ้งเรื่องเท่านั้น
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          ) : loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs">กำลังโหลดข้อความจาก Supabase...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-slate-600">ยังไม่มีข้อความซักถามสำหรับเคสนี้</p>
              <p className="text-[10px] text-slate-400">
                พิมพ์ข้อความด้านล่างเพื่อเริ่มการสนทนาเรียลไทม์
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSenderAdmin =
                msg.sender_role === 'admin' ||
                Boolean(msg.sender_name && /admin|เจ้าหน้าที่/i.test(msg.sender_name))

              const isSelf = (() => {
                if (currentUserId && msg.sender_id) {
                  return msg.sender_id === currentUserId
                }
                if (currentUserName && msg.sender_name) {
                  return msg.sender_name.toLowerCase() === currentUserName.toLowerCase()
                }
                return msg.sender_role === normalizedRole
              })()

              const displaySenderName = isSenderAdmin
                ? msg.sender_name || assignedAdminName || 'เจ้าหน้าที่ (Admin)'
                : msg.sender_name || reporterName || 'ผู้แจ้งเรื่อง (User)'

              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-2.5 ${
                    isSenderAdmin ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold shadow-xs ${
                      isSenderAdmin
                        ? 'bg-[#1b5e4a] text-white ring-2 ring-emerald-600/20'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {isSenderAdmin ? (
                      <Shield className="w-3.5 h-3.5 text-emerald-200" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-emerald-700" />
                    )}
                  </div>

                  <div
                    className={`flex-1 max-w-[85%] sm:max-w-[80%] space-y-1 flex flex-col ${
                      isSenderAdmin ? 'items-end' : 'items-start'
                    }`}
                  >
                    {/* Header line above message bubble */}
                    <div
                      className={`flex items-center space-x-2 text-[10px] ${
                        isSenderAdmin ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {isSenderAdmin ? (
                        <>
                          <span className="text-slate-400">
                            {formatTime(msg.created_at)}
                          </span>
                          <span className="font-bold flex items-center gap-1">
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#1b5e4a] text-white rounded-md shadow-2xs flex items-center gap-1">
                              <Shield className="w-2.5 h-2.5 text-emerald-300" />
                              <span className="notranslate" data-user-content="true">
                                {displaySenderName} {isSelf && '(คุณ)'}
                              </span>
                            </span>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold flex items-center gap-1">
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 flex items-center gap-1">
                              <User className="w-2.5 h-2.5 text-emerald-700" />
                              <span className="notranslate" data-user-content="true">
                                {displaySenderName} {isSelf && '(คุณ)'}
                              </span>
                            </span>
                          </span>
                          <span className="text-slate-400">
                            {formatTime(msg.created_at)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Chat Bubble: Admin on right (Dark Emerald), User on left (Clean White) */}
                    <div
                      className={`p-3 rounded-2xl border shadow-xs leading-relaxed text-xs break-words max-w-full ${
                        isSenderAdmin
                          ? 'bg-[#1b5e4a] text-white rounded-tr-none border-[#144737] shadow-sm'
                          : 'bg-white text-slate-800 rounded-tl-none border-slate-200 shadow-2xs'
                      }`}
                    >
                      {msg.message && (
                        <p className="whitespace-pre-wrap notranslate" data-user-content="true">
                          {msg.message}
                        </p>
                      )}

                      {/* Attachment Rendering */}
                      {msg.attachment_url && (
                        <div className={`mt-2 pt-2 border-t ${isSenderAdmin ? 'border-white/20' : 'border-slate-100'}`}>
                          {msg.attachment_url.startsWith('data:image/') ||
                          msg.attachment_url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                            <div className="space-y-1">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={msg.attachment_url}
                                alt={msg.attachment_name || 'รูปภาพหลักฐาน'}
                                className="max-h-48 max-w-full rounded-xl object-contain cursor-pointer hover:opacity-95 transition bg-black/10"
                                onClick={() => window.open(msg.attachment_url!, '_blank')}
                              />
                              {msg.attachment_name && (
                                <p className={`text-[10px] truncate ${isSenderAdmin ? 'opacity-80' : 'text-slate-500'}`}>
                                  {msg.attachment_name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <a
                              href={msg.attachment_url}
                              download={msg.attachment_name || 'attachment'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition ${
                                isSenderAdmin
                                  ? 'bg-white/20 hover:bg-white/30 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <Paperclip className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[180px]">
                                {msg.attachment_name || 'ดาวน์โหลดไฟล์แนบ'}
                              </span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected Attachment Preview in Input Bar */}
        {attachment && (
          <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2 truncate">
              {attachment.type.startsWith('image/') ? (
                <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="truncate max-w-xs font-medium">{attachment.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="text-slate-400 hover:text-rose-500 transition p-1"
              title="ลบไฟล์แนบ"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Form */}
        {!isUnauthorized && (
          <form
            onSubmit={handleSendMessage}
            className="p-3.5 border-t border-slate-200 bg-white sticky bottom-0"
          >
            <div className="flex items-center gap-2">
              {/* Paperclip Button for Attachments */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:text-[#1b5e4a] hover:bg-emerald-50 flex items-center justify-center transition cursor-pointer shrink-0 disabled:opacity-40"
                title="แนบรูปภาพหรือไฟล์หลักฐาน"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder={
                  normalizedRole === 'admin'
                    ? 'พิมพ์ข้อความตอบกลับหรือซักถามผู้แจ้ง...'
                    : 'พิมพ์ข้อความสอบถามหรือให้ข้อมูลเพิ่มเติมแก่เจ้าหน้าที่...'
                }
                className="flex-1 border border-slate-200 bg-[#f8faf9] px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-700"
                disabled={isSending}
              />

              <button
                type="submit"
                disabled={(!newMessageText.trim() && !attachment) || isSending}
                className="w-9 h-9 rounded-xl bg-[#1b5e4a] hover:bg-[#154c3c] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition cursor-pointer shadow-xs shrink-0"
                title="ส่งข้อความ"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        )}
      </aside>
    </>
  )
}
