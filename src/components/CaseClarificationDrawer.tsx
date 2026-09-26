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
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { addNotification } from '@/lib/notifications'
import { getDemoSession } from '@/lib/authService'
import { getUserAllIssues, getAllCurrentIssues } from '@/lib/issuesData'

export interface TicketMessage {
  id: string
  report_id: string
  sender_role: 'admin' | 'user'
  sender_id?: string
  sender_name?: string
  message: string
  created_at: string
}

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
 * and falls back to context defaults (reporterName or assignedAdminName)
 */
export function parseTicketMessage(
  raw: TicketMessage,
  defaults?: { reporterName?: string; assignedAdminName?: string }
): TicketMessage {
  let cleanMessage = raw.message || ''
  let senderName = raw.sender_name
  let senderId = raw.sender_id

  if (cleanMessage.startsWith('<!--sender:')) {
    const endIdx = cleanMessage.indexOf('-->')
    if (endIdx !== -1) {
      try {
        const jsonStr = cleanMessage.substring('<!--sender:'.length, endIdx)
        const meta = JSON.parse(jsonStr)
        if (meta.name) senderName = meta.name
        if (meta.id) senderId = meta.id
        cleanMessage = cleanMessage.substring(endIdx + 3)
      } catch {
        // ignore parse error
      }
    }
  }

  // Fallbacks if senderName is still not set
  if (!senderName) {
    if (raw.sender_role === 'admin') {
      senderName = defaults?.assignedAdminName || 'เจ้าหน้าที่ / Admin'
    } else {
      senderName = defaults?.reporterName || 'ผู้แจ้งเรื่อง (User)'
    }
  }

  return {
    ...raw,
    message: cleanMessage,
    sender_name: senderName,
    sender_id: senderId,
  }
}

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

  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [newMessageText, setNewMessageText] = useState('')
  const [loading, setLoading] = useState<boolean>(false)
  const [isSending, setIsSending] = useState<boolean>(false)
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false)
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // 1. Fetch existing messages and subscribe to Realtime updates
  useEffect(() => {
    if (!isOpen || !activeReportId) {
      setMessages([])
      setIsUnauthorized(false)
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

    async function fetchMessages() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('ticket_messages')
          .select('*')
          .eq('report_id', currentId)
          .order('created_at', { ascending: true })

        if (!error && data && isMounted) {
          const parsed = (data as TicketMessage[]).map((m) =>
            parseTicketMessage(m, { reporterName, assignedAdminName })
          )
          setMessages(parsed)
        }
      } catch (err) {
        console.error('Error fetching ticket messages:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchMessages()

    // Setup Supabase Realtime Channel
    setRealtimeStatus('connecting')
    const channelName = `ticket_messages_channel_${currentId}_${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `report_id=eq.${currentId}`,
        },
        (payload) => {
          if (!isMounted) return
          const newRow = parseTicketMessage(payload.new as TicketMessage, {
            reporterName,
            assignedAdminName,
          })

          setMessages((prev) => {
            // Deduplicate if already present (e.g. from optimistic UI)
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

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
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
      return d.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.'
    } catch {
      return 'เมื่อสักครู่'
    }
  }

  // 2. Send new message to Supabase
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newMessageText.trim()
    if (!trimmed || isSending) return

    const currentId = String(activeReportId)
    const tempId = `temp-${Date.now()}`
    const tempCreatedAt = new Date().toISOString()
    const senderDisplayName =
      currentUserName ||
      (normalizedRole === 'admin' ? 'เจ้าหน้าที่ (Admin)' : 'ผู้แจ้งเรื่อง (User)')

    // Optimistic message to display instantly
    const optimisticMsg: TicketMessage = {
      id: tempId,
      report_id: currentId,
      sender_role: normalizedRole,
      sender_id: currentUserId,
      sender_name: senderDisplayName,
      message: trimmed,
      created_at: tempCreatedAt,
    }

    setMessages((prev) => [...prev, optimisticMsg])
    setNewMessageText('')
    setIsSending(true)

    // Trigger immediate scroll on send
    setTimeout(() => scrollToBottom('smooth'), 10)

    try {
      // Embed metadata into message string so all clients get real sender info
      const meta = JSON.stringify({
        name: senderDisplayName,
        id: currentUserId || '',
        role: normalizedRole,
      })
      const encodedMessage = `<!--sender:${meta}-->${trimmed}`

      const payload: Record<string, unknown> = {
        report_id: currentId,
        sender_role: normalizedRole,
        message: encodedMessage,
      }

      const { data, error } = await supabase
        .from('ticket_messages')
        .insert([payload])
        .select()
        .single()

      if (!error && data) {
        // Replace temporary optimistic message with parsed real saved message
        const parsed = parseTicketMessage(data as TicketMessage, {
          reporterName,
          assignedAdminName,
        })
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? parsed : m))
        )
      } else if (error) {
        console.warn('Could not insert to ticket_messages table:', error.message)
      }

      // If Admin is sending, trigger notification for User
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
        const notifDesc = `เคส #${currentId}${activeTitle ? ` "${activeTitle}"` : ''}: ${shortMsg}`

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
      }
    } catch (err) {
      console.error('Error inserting ticket message:', err)
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
                  (Supabase Realtime)
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
              // Perspective-based alignment:
              // ข้อความที่ส่งโดยผู้ใช้งานปัจจุบัน (ตัวเอง): จัดชิดขวาเสมอ (Right-aligned)
              // ข้อความที่ส่งโดยอีกฝ่าย (คู่สนทนา): จัดชิดซ้ายเสมอ (Left-aligned)
              const isSenderAdmin = msg.sender_role === 'admin'
              const isSelf = (() => {
                if (currentUserId && msg.sender_id) {
                  return msg.sender_id === currentUserId
                }
                if (currentUserName && msg.sender_name) {
                  return msg.sender_name === currentUserName
                }
                return msg.sender_role === normalizedRole
              })()

              const displaySenderName = isSenderAdmin
                ? msg.sender_name || assignedAdminName || 'เจ้าหน้าที่ / Admin'
                : msg.sender_name || reporterName || 'ผู้แจ้งเรื่อง (User)'

              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-2.5 ${
                    isSelf ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold shadow-xs ${
                      isSenderAdmin
                        ? 'bg-[#1b5e4a] text-white ring-2 ring-emerald-600/20'
                        : isSelf
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isSenderAdmin ? (
                      <Shield className="w-3.5 h-3.5 text-emerald-200" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div
                    className={`flex-1 max-w-[85%] sm:max-w-[80%] space-y-1 flex flex-col ${
                      isSelf ? 'items-end' : 'items-start'
                    }`}
                  >
                    {/* Header line above message bubble */}
                    <div
                      className={`flex items-center space-x-2 text-[10px] ${
                        isSelf ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {isSelf ? (
                        /* ข้อความของตัวเอง (จัดชิดขวาเสมอ) */
                        <>
                          <span className="text-slate-400">
                            {formatTime(msg.created_at)}
                          </span>
                          <span className="font-bold flex items-center gap-1">
                            {normalizedRole === 'admin' ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#1b5e4a] text-white rounded-md shadow-2xs">
                                {currentUserName || 'คุณ (Admin)'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-md shadow-2xs">
                                {currentUserName || 'คุณ (ผู้แจ้ง)'}
                              </span>
                            )}
                          </span>
                        </>
                      ) : (
                        /* ข้อความของอีกฝ่าย (จัดชิดซ้ายเสมอ พร้อมแสดงชื่อเฉพาะของแต่ละคน) */
                        <>
                          <span className="font-bold flex items-center gap-1">
                            {isSenderAdmin ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#1b5e4a] text-white rounded-md shadow-2xs flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5 text-emerald-300" />
                                <span className="notranslate" data-user-content="true">
                                  {displaySenderName}
                                </span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 flex items-center gap-1">
                                <User className="w-2.5 h-2.5 text-emerald-700" />
                                <span className="notranslate" data-user-content="true">
                                  {displaySenderName}
                                </span>
                              </span>
                            )}
                          </span>
                          <span className="text-slate-400">
                            {formatTime(msg.created_at)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Chat Bubble */}
                    <div
                      className={`p-3 rounded-2xl border shadow-xs leading-relaxed text-xs break-words max-w-full ${
                        isSelf
                          ? 'bg-[#1b5e4a] text-white rounded-tr-none border-[#144737] shadow-sm'
                          : 'bg-white text-slate-800 rounded-tl-none border-slate-200 shadow-2xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap notranslate" data-user-content="true">{msg.message}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        {!isUnauthorized && (
          <form
            onSubmit={handleSendMessage}
            className="p-3.5 border-t border-slate-200 bg-white sticky bottom-0"
          >
            <div className="flex items-center gap-2">
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
                disabled={!newMessageText.trim() || isSending}
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
