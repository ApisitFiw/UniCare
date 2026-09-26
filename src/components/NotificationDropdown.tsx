"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type NotificationItem,
  type UserIdentifier,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  addNotification,
} from "@/lib/notifications";
import { getUserAllIssues } from "@/lib/issuesData";
import { Bell, ClipboardList, Megaphone, AlertTriangle, MessageSquare } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getDemoSession } from "@/lib/authService";
import { supabase } from "@/lib/supabaseClient";

interface NotificationDropdownProps {
  role?: "ADMIN" | "USER";
  userName?: string;
  userEmail?: string;
}

export default function NotificationDropdown({
  role,
  userName,
  userEmail,
}: NotificationDropdownProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getCurrentUser = useCallback((): UserIdentifier => {
    const session = getDemoSession();
    const effectiveRole =
      session?.role === "admin" || role === "ADMIN" || isAdminRoute
        ? "admin"
        : "user";
    const effectiveName =
      session?.name ||
      userName ||
      (effectiveRole === "admin" ? "เจ้าหน้าที่" : "");
    const effectiveEmail =
      session?.email ||
      userEmail ||
      "";

    return {
      role: effectiveRole,
      name: effectiveName,
      email: effectiveEmail,
    };
  }, [role, userName, userEmail, isAdminRoute]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const user = getCurrentUser();
      setNotifications(getUserNotifications(user));
    };

    update();

    window.addEventListener("storage", update);
    window.addEventListener("unicare-notifications-updated", update);
    window.addEventListener("unicare-profile-updated", update);
    window.addEventListener("focus", update);

    // 1. Supabase Realtime for instant notification when messages arrive in ticket_messages
    const channelName = `notif_realtime_chat_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
        },
        async (payload) => {
          const row = payload.new as any;
          if (!row?.report_id) return;

          const user = getCurrentUser();

          // Case A: Admin replied, recipient is ONLY the user who reported this issue
          if (row?.sender_role === "admin" && user.role === "user") {
            const currentSession = getDemoSession() || user;
            const userIssues = getUserAllIssues({
              email: currentSession.email ?? undefined,
              name: currentSession.name ?? undefined,
            });
            const targetReportId = String(row.report_id).replace(/^#/, "").trim().toLowerCase();
            const targetNumMatch = targetReportId.match(/\d+$/);
            const targetNum = targetNumMatch ? parseInt(targetNumMatch[0], 10) : null;

            let isOwner = userIssues.some((issue) => {
              const cleanId = String(issue.id || "").replace(/^#/, "").trim().toLowerCase();
              const cleanSubId = String(issue.supabaseId || "").trim().toLowerCase();
              const cleanRawId = String(issue.rawId || "").trim().toLowerCase();

              if (cleanId === targetReportId || cleanSubId === targetReportId || cleanRawId === targetReportId) {
                return true;
              }
              if (targetNum !== null) {
                const issueNumMatch = cleanId.match(/\d+$/);
                if (issueNumMatch && parseInt(issueNumMatch[0], 10) === targetNum) {
                  return true;
                }
              }
              return false;
            });

            // If not found in local user issues cache, double check against Supabase
            if (!isOwner) {
              try {
                const { data: issueRow } = await supabase
                  .from("issues")
                  .select("id, ticket_number, reporter_id, reporter:profiles!reporter_id(id, full_name, email)")
                  .or(`id.eq.${row.report_id},ticket_number.eq.${row.report_id}`)
                  .maybeSingle();

                if (issueRow) {
                  const rep = (issueRow as any).reporter;
                  const uEmail = (user.email || "").toLowerCase().trim();
                  const uName = (user.name || "").toLowerCase().trim();
                  const rEmail = (rep?.email || "").toLowerCase().trim();
                  const rName = (rep?.full_name || "").toLowerCase().trim();

                  if ((uEmail && rEmail && uEmail === rEmail) || (uName && rName && uName === rName)) {
                    isOwner = true;
                  }
                }
              } catch {
                // ignore
              }
            }

            // CRITICAL: If the current logged-in user is NOT the reporter, do NOT notify!
            if (!isOwner) {
              return;
            }

            const rawMsg = row.message || "";
            let cleanText = rawMsg;
            let senderName = "เจ้าหน้าที่ (Admin)";
            if (rawMsg.startsWith("<!--sender:")) {
              const endIdx = rawMsg.indexOf("-->");
              if (endIdx !== -1) {
                try {
                  const meta = JSON.parse(rawMsg.substring("<!--sender:".length, endIdx));
                  if (meta.name) senderName = meta.name;
                  cleanText = rawMsg.substring(endIdx + 3);
                } catch {}
              }
            }
            const shortText = cleanText.length > 55 ? cleanText.slice(0, 55) + "..." : cleanText;
            addNotification({
              title: "เจ้าหน้าที่ตอบกลับข้อความแล้ว",
              description: `${senderName}: "${shortText}" (เคส #${row.report_id})`,
              type: "status",
              link: `/my-reports?chat=${row.report_id}`,
              targetRole: "user",
              targetEmail: user.email || undefined,
              targetName: user.name || undefined,
              issueId: String(row.report_id),
              isRead: false,
            });
            update();
          }

          // Case B: User sent a message, recipient is Admin
          else if (row?.sender_role === "user" && user.role === "admin") {
            const rawMsg = row.message || "";
            let cleanText = rawMsg;
            let senderName = "ผู้แจ้งเรื่อง";
            if (rawMsg.startsWith("<!--sender:")) {
              const endIdx = rawMsg.indexOf("-->");
              if (endIdx !== -1) {
                try {
                  const meta = JSON.parse(rawMsg.substring("<!--sender:".length, endIdx));
                  if (meta.name) senderName = meta.name;
                  cleanText = rawMsg.substring(endIdx + 3);
                } catch {}
              }
            }
            const shortText = cleanText.length > 55 ? cleanText.slice(0, 55) + "..." : cleanText;
            addNotification({
              title: "ผู้แจ้งส่งข้อความเพิ่มเติม",
              description: `${senderName}: "${shortText}" (เคส #${row.report_id})`,
              type: "status",
              link: `/admin/issues`,
              targetRole: "admin",
              issueId: String(row.report_id),
              isRead: false,
            });
            update();
          }
        }
      )
      .subscribe();

    // 2. Supabase Realtime for instant notification when issue status is updated
    const issuesChannelName = `notif_realtime_issues_${Date.now()}`;
    const issuesChannel = supabase
      .channel(issuesChannelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "issues",
        },
        async (payload) => {
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
          if (newRow?.status && newRow.status !== oldRow?.status) {
            const user = getCurrentUser();
            if (user.role === "user") {
              const currentSession = getDemoSession() || user;
              const userIssues = getUserAllIssues({
                email: currentSession.email ?? undefined,
                name: currentSession.name ?? undefined,
              });
              const targetReportId = String(newRow.ticket_number || newRow.id).replace(/^#/, "").trim().toLowerCase();
              const targetNumMatch = targetReportId.match(/\d+$/);
              const targetNum = targetNumMatch ? parseInt(targetNumMatch[0], 10) : null;

              let isOwner = userIssues.some((issue) => {
                const cleanId = String(issue.id || "").replace(/^#/, "").trim().toLowerCase();
                const cleanSubId = String(issue.supabaseId || "").trim().toLowerCase();
                const cleanRawId = String(issue.rawId || "").trim().toLowerCase();
                if (cleanId === targetReportId || cleanSubId === targetReportId || cleanRawId === targetReportId) return true;
                if (targetNum !== null) {
                  const issueNumMatch = cleanId.match(/\d+$/);
                  if (issueNumMatch && parseInt(issueNumMatch[0], 10) === targetNum) return true;
                }
                return false;
              });

              if (!isOwner && newRow.reporter_id) {
                try {
                  const { data: profile } = await supabase
                    .from("profiles")
                    .select("id, email, full_name")
                    .eq("id", newRow.reporter_id)
                    .maybeSingle();

                  if (profile) {
                    const uEmail = (user.email || "").toLowerCase().trim();
                    const uName = (user.name || "").toLowerCase().trim();
                    const pEmail = (profile.email || "").toLowerCase().trim();
                    const pName = (profile.full_name || "").toLowerCase().trim();
                    if ((uEmail && pEmail && uEmail === pEmail) || (uName && pName && uName === pName)) {
                      isOwner = true;
                    }
                  }
                } catch {}
              }

              if (!isOwner) return;

              let statusLabel = "รอดำเนินการ";
              if (newRow.status === "in_progress") statusLabel = "กำลังดำเนินการ";
              else if (newRow.status === "resolved") statusLabel = "แก้ไขสำเร็จ";
              else if (newRow.status === "rejected") statusLabel = "ปฏิเสธเรื่อง";

              const displayId = newRow.ticket_number || newRow.id;
              addNotification({
                title: `อัปเดตสถานะเคส #${displayId}`,
                description: `เคสของคุณได้รับการอัปเดตสถานะเป็น "${statusLabel}"`,
                type: newRow.status === "rejected" ? "urgent" : "status",
                link: "/my-reports",
                targetRole: "user",
                targetEmail: user.email || undefined,
                targetName: user.name || undefined,
                issueId: String(displayId),
                isRead: false,
              });
              update();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(issuesChannel);
      window.removeEventListener("storage", update);
      window.removeEventListener("unicare-notifications-updated", update);
      window.removeEventListener("unicare-profile-updated", update);
      window.removeEventListener("focus", update);
    };
  }, [getCurrentUser]);

  // นับจำนวนรายการที่ยังไม่อ่าน สำหรับผู้ใช้คนนี้
  const unreadCount = mounted ? notifications.filter((n) => !n.isRead).length : 0;

  // ปิด Dropdown เมื่อคลิกพื้นที่อื่นข้างนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = () => {
    const user = getCurrentUser();
    markAllNotificationsAsRead(user);
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const handleMarkAsRead = (id: number) => {
    const user = getCurrentUser();
    markNotificationAsRead(id, user);
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  };

  const currentUser = getCurrentUser();
  const isAdmin = currentUser.role === "admin";

  const { t, lang } = useLanguage();

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* ปุ่มกดรูปกระดิ่ง */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center text-slate-600 transition cursor-pointer"
        aria-label={t("การแจ้งเตือน")}
        title={t("การแจ้งเตือน")}
      >
        <Bell className="w-4 h-4" />

        {/* จุดตัวเลขสีเขียวแสดงยอดแจ้งเตือนที่ยังไม่ได้อ่าน */}
        {unreadCount > 0 && (
          <span
            suppressHydrationWarning
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-xs pointer-events-none"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* เมนู Dropdown ที่เด้งลงมา */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden font-['Prompt',sans-serif]">
          {/* ส่วนหัว Dropdown */}
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-800">
                {t("การแจ้งเตือน")}
              </span>
              {unreadCount > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {lang === "en" ? "New" : "ใหม่"} {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium hover:underline cursor-pointer"
              >
                {lang === "en" ? "Mark all read" : "อ่านทั้งหมดแล้ว"}
              </button>
            )}
          </div>

          {/* รายการแจ้งเตือน */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((item) => {
                const isChatNotif =
                  item.title.includes("ตอบกลับ") ||
                  item.title.includes("แชท") ||
                  item.title.includes("สนทนา") ||
                  Boolean(item.link?.includes("chat="));

                let targetLink = item.link || "#";
                if (isAdmin && targetLink.startsWith("/my-reports")) {
                  targetLink = targetLink.replace("/my-reports", "/admin/issues");
                } else if (!isAdmin && targetLink.startsWith("/admin")) {
                  targetLink = targetLink.replace(/\/admin\/[a-zA-Z0-9_-]+/, "/my-reports");
                }

                return (
                  <Link
                    key={item.id}
                    href={targetLink}
                    onClick={() => {
                      handleMarkAsRead(item.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-start gap-3 p-3.5 hover:bg-slate-50 transition block ${
                      !item.isRead ? "bg-emerald-50/40" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm mt-0.5 ${
                        isChatNotif
                          ? "bg-emerald-100 text-emerald-800"
                          : item.type === "status"
                          ? "bg-amber-100 text-amber-800"
                          : item.type === "news"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {isChatNotif ? (
                        <MessageSquare className="w-4 h-4 text-emerald-700" />
                      ) : item.type === "status" ? (
                        <ClipboardList className="w-4 h-4" />
                      ) : item.type === "news" ? (
                        <Megaphone className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            !item.isRead
                              ? "font-bold text-slate-900"
                              : "font-medium text-slate-700"
                          }`}
                        >
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>

                    {/* จุดสีสำหรับรายการที่ยังไม่ได้อ่าน */}
                    {!item.isRead && (
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 mt-2 ${
                          item.type === "urgent" ? "bg-rose-500" : "bg-emerald-600"
                        }`}
                      ></span>
                    )}
                  </Link>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                {lang === "en" ? "No new notifications for you" : "ไม่มีการแจ้งเตือนใหม่สำหรับคุณ"}
              </div>
            )}
          </div>

          {/* ส่วนท้าย Dropdown */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href={isAdmin ? "/admin/reports" : "/my-reports"}
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition"
            >
              {isAdmin
                ? (lang === "en" ? "View all reports →" : "ดูรายการคำร้องเรียนทั้งหมด →")
                : (lang === "en" ? "View all my reports →" : "ดูประวัติการแจ้งปัญหาทั้งหมด →")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
