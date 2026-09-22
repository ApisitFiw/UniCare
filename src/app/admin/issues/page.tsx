'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import CaseClarificationDrawer from '@/components/CaseClarificationDrawer'
import { supabase } from '@/lib/supabaseClient'
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
} from 'lucide-react'

interface IssueItem {
  id: string
  date: string
  category: string
  area: string
  description: string
  adminName: string
  adminInitial: string
  status: 'pending' | 'in_progress' | 'resolved'
  statusLabel: string
}

interface TimelineEntry {
  statusText: string
  time: string
  note: string
  author: string
  color: string
}

export default function StatusTrackingPage() {
  const [issues, setIssues] = useState<IssueItem[]>([
    {
      id: 'ISS-2026-101',
      date: '07 ก.ย. 2568 - 14:20',
      category: 'เสียงรบกวน',
      area: 'หอพักนักศึกษาชาย 3',
      description: 'เสียงดนตรีเปิดล้ำ 23.00 น. รบกวนเวลาพักผ่อน',
      adminName: 'นายนัฐกรณ์ (Admin)',
      adminInitial: 'นพ',
      status: 'in_progress',
      statusLabel: 'กำลังดำเนินการ',
    },
    {
      id: 'ISS-2026-102',
      date: '06 ก.ย. 2568 - 11:10',
      category: 'ขยะ / ของเสีย',
      area: 'โรงอาหารกลาง',
      description: 'ถังขยะล้น ส่งกลิ่นเหม็นและมีแมลงวัน',
      adminName: 'นายนัฐกรณ์ (Admin)',
      adminInitial: 'นพ',
      status: 'resolved',
      statusLabel: 'แก้ไขสำเร็จ',
    },
    {
      id: 'ISS-2026-103',
      date: '07 ก.ย. 2568 - 16:45',
      category: 'น้ำ / น้ำเสีย',
      area: 'อาคารเรียนรวม 5',
      description: 'ท่อระบายน้ำอุดตัน น้ำระบายไม่ทันเมื่อฝนตก',
      adminName: 'นายอภิสิทธิ์ (Admin)',
      adminInitial: 'อภ',
      status: 'pending',
      statusLabel: 'รอดำเนินการ',
    },
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modal State for Status & Timeline
  const [activeModalIssue, setActiveModalIssue] = useState<IssueItem | null>(null)
  const [newStatus, setNewStatus] = useState<string>('กำลังดำเนินการ')
  const [actionNote, setActionNote] = useState<string>('')
  const [timelineHistory, setTimelineHistory] = useState<Record<string, TimelineEntry[]>>({
    'ISS-2026-101': [
      {
        statusText: 'เปลี่ยนสถานะเป็น: กำลังดำเนินการ',
        time: '07 ก.ย. 2568, 14:30',
        note: 'เจ้าหน้าที่เข้าตรวจสอบพื้นที่และประสานงานผู้เกี่ยวข้องเรียบร้อย',
        author: 'นายนัฐกรณ์ ไพรพฤกษ์ (Admin)',
        color: 'bg-blue-600',
      },
      {
        statusText: 'สร้างเรื่องร้องเรียน (Reported)',
        time: '07 ก.ย. 2568, 14:20',
        note: 'ผู้ใช้งานแจ้งเรื่องร้องเรียนผ่านระบบ UNICARE',
        author: 'ระบบอัตโนมัติ',
        color: 'bg-amber-500',
      },
    ],
  })

  // Chat Drawer State (Case Comments & Clarification)
  const [activeChatIssue, setActiveChatIssue] = useState<IssueItem | null>(null)

  // Try loading issues from Supabase if available
  useEffect(() => {
    async function fetchSupabaseIssues() {
      try {
        const { data, error } = await supabase
          .from('issue_reports')
          .select(`
            issue_id,
            title,
            description,
            status,
            date_created,
            issue_areas ( area_name ),
            issue_categories ( category_name )
          `)
          .order('issue_id', { ascending: false })

        if (!error && data && data.length > 0) {
          const mapped: IssueItem[] = data.map((item: any) => {
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

            return {
              id: `ISS-2026-${item.issue_id}`,
              date: new Date(item.date_created || Date.now()).toLocaleDateString('th-TH', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              category: item.issue_categories?.category_name || 'ทั่วไป',
              area: item.issue_areas?.area_name || 'มหาวิทยาลัยวลัยลักษณ์',
              description: item.title || item.description || 'รายละเอียดเรื่องร้องเรียน',
              adminName: 'นายนัฐกรณ์ (Admin)',
              adminInitial: 'นพ',
              status: statusKey,
              statusLabel,
            }
          })
          setIssues(mapped)
        }
      } catch {
        // Keep fallback mock data
      }
    }

    fetchSupabaseIssues()
  }, [])

  const handleOpenStatusModal = (issue: IssueItem) => {
    setActiveModalIssue(issue)
    setNewStatus(issue.statusLabel)
    setActionNote('')
  }

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeModalIssue) return

    let statusKey: 'pending' | 'in_progress' | 'resolved' = 'in_progress'
    if (newStatus === 'รอดำเนินการ') statusKey = 'pending'
    if (newStatus === 'แก้ไขสำเร็จ') statusKey = 'resolved'

    // Update issue in table
    setIssues((prev) =>
      prev.map((item) =>
        item.id === activeModalIssue.id
          ? { ...item, status: statusKey, statusLabel: newStatus }
          : item
      )
    )

    // Append to timeline
    const newEntry: TimelineEntry = {
      statusText: `เปลี่ยนสถานะเป็น: ${newStatus}`,
      time: 'เมื่อสักครู่',
      note: actionNote || 'อัปเดตสถานะการดำเนินงาน',
      author: 'นายนัฐกรณ์ ไพรพฤกษ์ (Admin)',
      color: statusKey === 'resolved' ? 'bg-emerald-600' : 'bg-blue-600',
    }

    setTimelineHistory((prev) => ({
      ...prev,
      [activeModalIssue.id]: [newEntry, ...(prev[activeModalIssue.id] || [])],
    }))

    // Sync to Supabase if numeric issue_id
    try {
      const numericId = parseInt(activeModalIssue.id.replace(/\D/g, ''), 10)
      if (numericId) {
        let dbStatus = 'In_Progress'
        if (statusKey === 'pending') dbStatus = 'Pending'
        if (statusKey === 'resolved') dbStatus = 'Resolved'
        await supabase.from('issue_reports').update({ status: dbStatus }).eq('issue_id', numericId)
      }
    } catch {
      // Ignored
    }

    alert(`อัปเดตสถานะ #${activeModalIssue.id} เป็น "${newStatus}" และบันทึก Action Log เรียบร้อยแล้ว!`)
    setActiveModalIssue(null)
  }

  const filteredIssues = issues.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen flex bg-[#f4f7f5] text-slate-800 antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="ระบบติดตามและจัดการสถานะการแก้ไข (Status Tracking & Action Log)"
          subtitle="บันทึก ติดตามไทม์ไลน์ และระบบสนทนาซักถามข้อมูลเพิ่มเติม (Case Comments & Clarification)"
        />

        <main className="p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl w-full">
          {/* 1. Hero Banner */}
          <section className="relative rounded-2xl overflow-hidden hero-gradient text-white p-7 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="relative z-10 space-y-1.5 max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight">
                ติดตามสถานะและบันทึกประวัติการแก้ไข
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-light">
                จัดการสถานะเคส (Issue Timeline), บันทึกหมายเหตุการแก้ไข และระบบสนทนาซักถามข้อมูลเพิ่มเติม (Case Comments & Clarification)
              </p>
            </div>
            <button
              onClick={() => handleOpenStatusModal(issues[0])}
              className="relative z-10 bg-white text-[#0e4435] font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:bg-emerald-50 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างหรือบันทึกไทม์ไลน์ด่วน</span>
            </button>
          </section>

          {/* 2. Metric Cards 4 ช่อง */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">เรื่องทั้งหมด</p>
                <p className="text-2xl font-bold text-slate-800">
                  {issues.length} <span className="text-xs font-normal text-slate-400">เคส</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-amber-600 font-medium">รอดำเนินการ</p>
                <p className="text-2xl font-bold text-slate-800">
                  {issues.filter((i) => i.status === 'pending').length}{' '}
                  <span className="text-xs font-normal text-slate-400">เคส</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
                <RotateCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-[11px] text-blue-600 font-medium">กำลังดำเนินการ</p>
                <p className="text-2xl font-bold text-slate-800">
                  {issues.filter((i) => i.status === 'in_progress').length}{' '}
                  <span className="text-xs font-normal text-slate-400">เคส</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-600 font-medium">แก้ไขสำเร็จ</p>
                <p className="text-2xl font-bold text-slate-800">
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
                <h3 className="text-sm font-bold text-slate-800">
                  รายการเรื่องร้องเรียนและประวัติสถานะ (Issue Reports)
                </h3>
                <p className="text-[11px] text-slate-400">
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
                    placeholder="ค้นหารหัสเคส, พื้นที่..."
                    className="pl-9 pr-4 py-2 border border-slate-200 bg-[#f8faf9] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 w-56 text-slate-700"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-slate-200 bg-[#f8faf9] px-3 py-2 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="pending">รอดำเนินการ</option>
                  <option value="in_progress">กำลังดำเนินการ</option>
                  <option value="resolved">แก้ไขสำเร็จ</option>
                </select>
              </div>
            </div>

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
                  {filteredIssues.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f6faf8] transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#154c3c]">#{item.id}</span>
                        <div className="text-[10px] text-slate-400">{item.date}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{item.category}</span>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>{item.area}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs">
                        {item.description}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
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
                            onClick={() => setActiveChatIssue(item)}
                            title="เปิดระบบสนทนาซักถามข้อมูลเพิ่มเติม (Case Comments & Clarification)"
                            className="w-8 h-8 rounded-xl bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition flex items-center justify-center relative shrink-0 shadow-xs cursor-pointer group"
                          >
                            <MessageCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          </button>

                          {/* Status Modal Trigger */}
                          <button
                            onClick={() => handleOpenStatusModal(item)}
                            className="w-28 py-1.5 bg-[#1b5e4a] text-white rounded-xl text-[11px] font-medium hover:bg-[#144737] transition shadow-xs inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <PenSquare className="w-3 h-3" />
                            <span>อัปเดตสถานะ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* ================= STATUS UPDATE MODAL ================= */}
      {activeModalIssue && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in">
            {/* Header */}
            <div className="hero-gradient px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4" />
                <h3 className="font-bold text-sm">
                  จัดการสถานะและบันทึกไทม์ไลน์ (Issue Timeline & Action Log)
                </h3>
              </div>
              <button
                onClick={() => setActiveModalIssue(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              <div className="bg-[#f8faf9] p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-[#1b5e4a]">#{activeModalIssue.id}</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {activeModalIssue.category} - {activeModalIssue.area}
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold">
                  {activeModalIssue.statusLabel}
                </span>
              </div>

              <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เปลี่ยนสถานะใหม่ (New Status)
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-slate-200 bg-[#f8faf9] px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-700 font-medium"
                  >
                    <option value="รอดำเนินการ">รอดำเนินการ (Pending)</option>
                    <option value="กำลังดำเนินการ">กำลังดำเนินการ (In Progress)</option>
                    <option value="แก้ไขสำเร็จ">แก้ไขสำเร็จ (Resolved)</option>
                    <option value="ยกเลิก / ไม่สามารถดำเนินการได้">ยกเลิก / ไม่สามารถดำเนินการได้</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    บันทึกหมายเหตุการเปลี่ยนสถานะ (Status Change Note / Action Log)
                  </label>
                  <textarea
                    rows={3}
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="ระบุรายละเอียดความคืบหน้า หรือเหตุผลในการเปลี่ยนสถานะ..."
                    className="w-full border border-slate-200 bg-[#f8faf9] p-3 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    แนบไฟล์หลักฐานการปฏิบัติงาน (Evidence File / Photo)
                  </label>
                  <input
                    type="file"
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1b5e4a]/10 file:text-[#1b5e4a] hover:file:bg-[#1b5e4a]/20"
                  />
                </div>

                {/* Timeline History */}
                <div className="border-t border-slate-100 pt-4 mt-2">
                  <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#1b5e4a]" /> ประวัติไทม์ไลน์การแก้ไข
                  </h4>
                  <div className="space-y-2.5">
                    {(timelineHistory[activeModalIssue.id] || []).map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3 p-3 bg-[#f8faf9] rounded-xl border border-slate-100"
                      >
                        <div className={`w-2 h-2 mt-1.5 rounded-full ${t.color} shrink-0`}></div>
                        <div className="flex-1">
                          <div className="flex justify-between font-semibold text-slate-700">
                            <span>{t.statusText}</span>
                            <span className="text-slate-400">{t.time}</span>
                          </div>
                          <p className="text-slate-500 mt-0.5">{t.note}</p>
                          <div className="text-[10px] text-[#1b5e4a] mt-1 font-medium">
                            - บันทึกโดย: {t.author}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModalIssue(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1b5e4a] text-white rounded-xl font-medium hover:bg-[#144737] transition shadow-xs cursor-pointer"
                  >
                    บันทึกการอัปเดต
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= CLARIFICATION CHAT DRAWER ================= */}
      <CaseClarificationDrawer
        isOpen={Boolean(activeChatIssue)}
        reportId={activeChatIssue ? activeChatIssue.id : null}
        reportTitle={activeChatIssue ? `${activeChatIssue.category} - ${activeChatIssue.area}` : undefined}
        onClose={() => setActiveChatIssue(null)}
        currentUserRole="admin"
        currentUserName="นายนัฐกรณ์ ไพรพฤกษ์ (Admin)"
      />
    </div>
  )
}
