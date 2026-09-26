"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Header from "@/components/Header";
import { getDemoSession } from "@/lib/authService";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  togglePinAnnouncement,
  type AnnouncementItem,
} from "@/lib/announcementsData";
import {
  Newspaper,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  Edit3,
  Calendar,
  User,
  AlertCircle,
  Tag,
  CheckCircle2,
  X,
  Volume2,
  Trash,
  Droplets,
  Wind,
  Lightbulb,
  Trees,
  Layers,
  Sparkles,
  Megaphone,
  Eye,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  "เสียงรบกวน",
  "ขยะ / ของเสีย",
  "น้ำ / น้ำเสีย",
  "อากาศ / มลพิษ",
  "แสงสว่าง",
  "ต้นไม้ / พื้นที่สีเขียว",
  "กิจกรรมเพื่อสิ่งแวดล้อม",
  "มาตรการมหาวิทยาลัย",
  "ประกาศทั่วไป",
  "อื่น ๆ",
];

function getCategoryIcon(cat: string) {
  if (cat.includes("เสียง")) return <Volume2 className="h-4 w-4" />;
  if (cat.includes("ขยะ")) return <Trash className="h-4 w-4" />;
  if (cat.includes("น้ำ")) return <Droplets className="h-4 w-4" />;
  if (cat.includes("อากาศ") || cat.includes("มลพิษ")) return <Wind className="h-4 w-4" />;
  if (cat.includes("แสง")) return <Lightbulb className="h-4 w-4" />;
  if (cat.includes("ต้นไม้")) return <Trees className="h-4 w-4" />;
  if (cat.includes("กิจกรรม")) return <Sparkles className="h-4 w-4" />;
  if (cat.includes("มาตรการ")) return <Megaphone className="h-4 w-4" />;
  return <Layers className="h-4 w-4" />;
}

export default function AdminAnnouncementsPage() {
  const [adminName, setAdminName] = useState("นัฐกรณ์");
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "pinned" | "urgent" | "normal">("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("เสียงรบกวน");
  const [formContent, setFormContent] = useState("");
  const [formTag, setFormTag] = useState("");
  const [formUrgency, setFormUrgency] = useState<"normal" | "urgent">("normal");
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete Confirm Modal
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync data
  const loadData = () => {
    setAnnouncements(getAnnouncements());
  };

  useEffect(() => {
    const session = getDemoSession();
    if (session?.name && session.role === "admin") {
      setAdminName(session.name);
    }
    loadData();

    window.addEventListener("unicare-announcements-updated", loadData);
    window.addEventListener("storage", loadData);
    window.addEventListener("focus", loadData);

    return () => {
      window.removeEventListener("unicare-announcements-updated", loadData);
      window.removeEventListener("storage", loadData);
      window.removeEventListener("focus", loadData);
    };
  }, []);

  // Filtered list
  const filteredList = useMemo(() => {
    return announcements
      .filter((item) => {
        if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
        if (activeTab === "pinned" && !item.isPinned) return false;
        if (activeTab === "urgent" && item.urgency !== "urgent") return false;
        if (activeTab === "normal" && item.urgency !== "normal") return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchContent = item.content.toLowerCase().includes(q);
          const matchAuthor = item.author.toLowerCase().includes(q);
          const matchTag = item.tag ? item.tag.toLowerCase().includes(q) : false;
          if (!matchTitle && !matchContent && !matchAuthor && !matchTag) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Pinned items first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [announcements, categoryFilter, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: announcements.length,
      pinned: announcements.filter((a) => a.isPinned).length,
      urgent: announcements.filter((a) => a.urgency === "urgent").length,
      normal: announcements.filter((a) => a.urgency === "normal").length,
    };
  }, [announcements]);

  // Open modal for new
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormCategory("เสียงรบกวน");
    setFormContent("");
    setFormTag("");
    setFormUrgency("normal");
    setFormIsPinned(false);
    setFormError("");
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (item: AnnouncementItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormContent(item.content);
    setFormTag(item.tag || "");
    setFormUrgency(item.urgency);
    setFormIsPinned(item.isPinned);
    setFormError("");
    setIsModalOpen(true);
  };

  // Submit Modal Form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("กรุณากรอกหัวข้อประกาศ");
      return;
    }
    if (!formContent.trim()) {
      setFormError("กรุณากรอกเนื้อหาประกาศ");
      return;
    }

    const todayDate = new Date().toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (editingItem) {
      updateAnnouncement(editingItem.id, {
        title: formTitle.trim(),
        category: formCategory,
        content: formContent.trim(),
        tag: formTag.trim() || undefined,
        urgency: formUrgency,
        isPinned: formIsPinned,
      });
    } else {
      createAnnouncement({
        title: formTitle.trim(),
        category: formCategory,
        content: formContent.trim(),
        tag: formTag.trim() || undefined,
        urgency: formUrgency,
        isPinned: formIsPinned,
        author: `${adminName} (Admin)`,
        date: todayDate,
      });
    }

    setIsModalOpen(false);
  };

  // Delete
  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteAnnouncement(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-800">
      <Header
        title="ประกาศข่าวสาร"
        subtitle="จัดการและโพสต์ข่าวสาร/ประกาศไปยังหน้าหลักของผู้ใช้"
        userName={adminName}
        role="ADMIN"
      />

      <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
        {/* ================= Summary Cards ================= */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <SummaryCard
            active={activeTab === "all"}
            label="ประกาศทั้งหมด"
            count={counts.all}
            icon={<Newspaper className="h-5 w-5" />}
            iconClass="bg-emerald-50 text-emerald-700"
            onClick={() => setActiveTab("all")}
          />
          <SummaryCard
            active={activeTab === "pinned"}
            label="ปักหมุดสำคัญ"
            count={counts.pinned}
            icon={<Pin className="h-5 w-5" />}
            iconClass="bg-amber-50 text-amber-600"
            onClick={() => setActiveTab("pinned")}
          />
          <SummaryCard
            active={activeTab === "urgent"}
            label="ระดับเร่งด่วน / มาตรการ"
            count={counts.urgent}
            icon={<AlertCircle className="h-5 w-5" />}
            iconClass="bg-rose-50 text-rose-500"
            onClick={() => setActiveTab("urgent")}
          />
          <SummaryCard
            active={activeTab === "normal"}
            label="ข่าวสารทั่วไป"
            count={counts.normal}
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconClass="bg-blue-50 text-blue-600"
            onClick={() => setActiveTab("normal")}
          />
        </section>

        {/* ================= Main Section ================= */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Controls Toolbar */}
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Left: Search & Filter */}
              <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาหัวข้อ, เนื้อหา, หรือผู้ประกาศ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs text-slate-800 transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-700 transition focus:border-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="all">ทุกหมวดหมู่ ({announcements.length})</option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as any)}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-700 transition focus:border-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="all">ทุกระดับความสำคัญ ({announcements.length})</option>
                  <option value="pinned">ปักหมุดสำคัญ ({counts.pinned})</option>
                  <option value="urgent">เร่งด่วน / มาตรการ ({counts.urgent})</option>
                  <option value="normal">ข่าวสารทั่วไป ({counts.normal})</option>
                </select>
              </div>

              {/* Right: New Announcement Button */}
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>โพสต์ประกาศใหม่</span>
              </button>
            </div>
          </div>

          {/* Active Filter Bar (if filtered) */}
          {(activeTab !== "all" || categoryFilter !== "all" || searchQuery) && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-emerald-50/40 px-4 py-2.5 sm:px-5 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-slate-600">
                <span className="font-semibold text-slate-500">กำลังแสดง:</span>
                {activeTab !== "all" && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold ${
                      activeTab === "pinned"
                        ? "border border-amber-200 bg-amber-100 text-amber-800"
                        : activeTab === "urgent"
                        ? "border border-rose-200 bg-rose-100 text-rose-800"
                        : "border border-blue-200 bg-blue-100 text-blue-800"
                    }`}
                  >
                    {activeTab === "pinned" && <Pin className="h-3 w-3" />}
                    {activeTab === "urgent" && <AlertCircle className="h-3 w-3" />}
                    {activeTab === "normal" && <CheckCircle2 className="h-3 w-3" />}
                    <span>
                      {activeTab === "pinned"
                        ? "ปักหมุดสำคัญ"
                        : activeTab === "urgent"
                        ? "เร่งด่วน / มาตรการ"
                        : "ข่าวสารทั่วไป"}
                    </span>
                  </span>
                )}
                {categoryFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800">
                    <span>{categoryFilter}</span>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-slate-700">
                    <span>ค้นหา: "{searchQuery}"</span>
                  </span>
                )}
                <span className="text-slate-400">
                  (พบ {filteredList.length} รายการ)
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("all");
                  setCategoryFilter("all");
                  setSearchQuery("");
                }}
                className="cursor-pointer text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}

          {/* List of Announcements */}
          <div className="p-4 sm:p-5">
            {filteredList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
                <Newspaper className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-3 text-sm font-bold text-slate-700">
                  {activeTab === "pinned" ? "ยังไม่มีประกาศที่ปักหมุดสำคัญ" : "ไม่พบข้อมูลประกาศ"}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {activeTab === "pinned"
                    ? "คุณสามารถกดไอคอนหมุดที่ประกาศเพื่อปักหมุดสำคัญไว้บนสุดได้"
                    : searchQuery || categoryFilter !== "all" || activeTab !== "all"
                    ? "ลองปรับเงื่อนไขการค้นหาหรือตัวกรองใหม่อีกครั้ง"
                    : "ยังไม่มีการโพสต์ประกาศข่าวสารในระบบ"}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {activeTab !== "all" && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("all");
                        setCategoryFilter("all");
                        setSearchQuery("");
                      }}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                    >
                      <span>ดูประกาศทั้งหมด</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>สร้างประกาศใหม่</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredList.map((item) => {
                  const isUrgent = item.urgency === "urgent";
                  return (
                    <article
                      key={item.id}
                      onClick={() => setSelectedAnnouncement(item)}
                      className={`group relative rounded-2xl border p-4 sm:p-5 transition hover:shadow-md cursor-pointer ${
                        item.isPinned
                          ? "border-amber-200 bg-gradient-to-r from-amber-50/50 via-white to-white hover:border-amber-300"
                          : "border-slate-200/90 bg-white hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        {/* Main info */}
                        <div className="min-w-0 flex-1 space-y-2">
                          {/* Badges row */}
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            {item.isPinned && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100/90 px-2.5 py-0.5 font-bold text-amber-800">
                                <Pin className="h-3 w-3" />
                                <span>ปักหมุด</span>
                              </span>
                            )}

                            {isUrgent && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 font-bold text-rose-600">
                                <AlertCircle className="h-3 w-3" />
                                <span>เร่งด่วน / มาตรการ</span>
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-800">
                              {getCategoryIcon(item.category)}
                              <span>{item.category}</span>
                            </span>

                            {item.tag && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600 announcement-content"
                                data-no-translate="true"
                                translate="no"
                              >
                                <Tag className="h-2.5 w-2.5" />
                                <span>{item.tag}</span>
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400 font-mono">
                              #{item.id}
                            </span>
                          </div>

                          {/* Title */}
                          <h3
                            className="text-sm sm:text-base font-extrabold text-slate-800 leading-snug group-hover:text-emerald-800 transition announcement-content"
                            data-no-translate="true"
                            translate="no"
                          >
                            {item.title}
                          </h3>

                          {/* Content preview */}
                          <p
                            className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line announcement-content line-clamp-2 sm:line-clamp-3"
                            data-no-translate="true"
                            translate="no"
                          >
                            {item.content}
                          </p>

                          {/* Meta footer */}
                          <div className="pt-1 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                            <span
                              className="inline-flex items-center gap-1.5 announcement-content"
                              data-no-translate="true"
                              translate="no"
                            >
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-medium text-slate-600">
                                {item.author}
                              </span>
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span>{item.date}</span>
                            </span>

                            <span className="text-emerald-700 font-semibold group-hover:underline inline-flex items-center gap-1">
                              <span>คลิกเพื่อดูรายละเอียด</span>
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex shrink-0 items-center gap-1.5 sm:self-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAnnouncement(item);
                            }}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                            title="ดูรายละเอียดประกาศ"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">ดูรายละเอียด</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinAnnouncement(item.id);
                            }}
                            className={`cursor-pointer inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                              item.isPinned
                                ? "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
                                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                            }`}
                            title={item.isPinned ? "ยกเลิกปักหมุด" : "ปักหมุดไว้บนสุด"}
                          >
                            {item.isPinned ? (
                              <>
                                <PinOff className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">เลิกปักหมุด</span>
                              </>
                            ) : (
                              <>
                                <Pin className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">ปักหมุด</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(item);
                            }}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                            title="แก้ไขประกาศ"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">แก้ไข</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(item.id);
                            }}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 hover:text-rose-700"
                            title="ลบประกาศนี้"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">ลบ</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ================= Announcement Detail Modal ================= */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`h-1.5 ${
                selectedAnnouncement.isPinned
                  ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"
                  : "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-700"
              }`}
            />

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                    selectedAnnouncement.isPinned
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-100"
                  }`}
                >
                  {selectedAnnouncement.isPinned ? (
                    <Pin className="h-4 w-4" />
                  ) : (
                    <Newspaper className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    รายละเอียดประกาศ
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    มหาวิทยาลัยวลัยลักษณ์ · UniCare
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="cursor-pointer rounded-full bg-slate-100 p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {selectedAnnouncement.isPinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800">
                    <Pin className="h-3 w-3" />
                    <span>ปักหมุดสำคัญ</span>
                  </span>
                )}
                {selectedAnnouncement.urgency === "urgent" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 font-bold text-rose-700">
                    <AlertCircle className="h-3 w-3" />
                    <span>เร่งด่วน / มาตรการ</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800">
                  {getCategoryIcon(selectedAnnouncement.category)}
                  <span>{selectedAnnouncement.category}</span>
                </span>
                {selectedAnnouncement.tag && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                    <Tag className="h-2.5 w-2.5" />
                    <span>{selectedAnnouncement.tag}</span>
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-mono">
                  #{selectedAnnouncement.id}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                {selectedAnnouncement.title}
              </h2>

              {/* Content */}
              <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedAnnouncement.content}
                </p>
              </div>

              {/* Meta */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-100">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>ผู้ประกาศ: {selectedAnnouncement.author}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedAnnouncement.date}</span>
                </span>
              </div>

              {/* Quick Actions in Detail Modal */}
              <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    togglePinAnnouncement(selectedAnnouncement.id);
                    setSelectedAnnouncement({
                      ...selectedAnnouncement,
                      isPinned: !selectedAnnouncement.isPinned,
                    });
                  }}
                  className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                    selectedAnnouncement.isPinned
                      ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {selectedAnnouncement.isPinned ? (
                    <>
                      <PinOff className="h-3.5 w-3.5" />
                      <span>ยกเลิกปักหมุด</span>
                    </>
                  ) : (
                    <>
                      <Pin className="h-3.5 w-3.5" />
                      <span>ปักหมุดไว้บนสุด</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const itemToEdit = selectedAnnouncement;
                      setSelectedAnnouncement(null);
                      handleOpenEditModal(itemToEdit);
                    }}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAnnouncement(null)}
                    className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= Create / Edit Modal ================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-700" />

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Newspaper className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">
                    {editingItem ? "แก้ไขประกาศข่าวสาร" : "โพสต์ประกาศข่าวสารใหม่"}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    ประกาศจะปรากฏในหน้าหลักของนักศึกษาและบุคลากร
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 p-6">
              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-600">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  หัวข้อประกาศ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น มาตรการลดเสียงรบกวนในช่วงสอบปลายภาค..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Category & Tag */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    หมวดหมู่ที่เกี่ยวข้อง
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700 transition focus:border-emerald-500 focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    แท็กระบุประเภท (ไม่บังคับ)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น มาตรการมหาวิทยาลัย, งานซ่อมบำรุง"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  เนื้อหาประกาศ / รายละเอียด <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="กรอกรายละเอียดข่าวสารหรือประกาศให้ชัดเจน เพื่อให้นักศึกษาและบุคลากรรับทราบ..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-3.5 text-xs text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 leading-relaxed"
                />
              </div>

              {/* Urgency & Pin options */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    ระดับความเร่งด่วน
                  </label>
                  <div className="mt-1.5 flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="urgency"
                        checked={formUrgency === "normal"}
                        onChange={() => setFormUrgency("normal")}
                        className="accent-emerald-600"
                      />
                      <span>ปกติ</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="urgency"
                        checked={formUrgency === "urgent"}
                        onChange={() => setFormUrgency("urgent")}
                        className="accent-rose-600"
                      />
                      <span>เร่งด่วน / มาตรการ</span>
                    </label>
                  </div>
                </div>

                <div className="sm:border-l sm:border-slate-200 sm:pl-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPinned}
                      onChange={(e) => setFormIsPinned(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 accent-amber-600"
                    />
                    <span>ปักหมุดประกาศนี้ไว้บนสุด</span>
                  </label>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    แสดงเป็นรายการแรกในแถบประกาศหน้าผู้ใช้
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{editingItem ? "บันทึกการแก้ไข" : "โพสต์ประกาศ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= Delete Confirmation Modal ================= */}
      {deletingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={() => setDeletingId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/60 bg-white p-6 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
              <Trash2 className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-base font-extrabold text-slate-800">
              ยืนยันการลบประกาศ
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้? ข้อมูลประกาศจะถูกลบออกจากระบบและหน้าหลักของผู้ใช้
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-600"
              >
                ลบประกาศ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  active,
  label,
  count,
  icon,
  iconClass,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  icon: ReactNode;
  iconClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center justify-between rounded-2xl border p-4 text-left transition cursor-pointer ${
        active
          ? label === "ปักหมุดสำคัญ"
            ? "border-amber-400 bg-amber-50/30 shadow-md ring-2 ring-amber-400/30"
            : label.includes("เร่งด่วน")
            ? "border-rose-400 bg-rose-50/30 shadow-md ring-2 ring-rose-400/30"
            : label.includes("ทั่วไป")
            ? "border-blue-400 bg-blue-50/30 shadow-md ring-2 ring-blue-400/30"
            : "border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/20"
          : "border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs"
      }`}
    >
      <div>
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black tracking-tight text-slate-800">
          {count}
        </p>
      </div>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 shadow-2xs transition-transform group-hover:scale-105 ${iconClass}`}
      >
        {icon}
      </div>
    </button>
  );
}
