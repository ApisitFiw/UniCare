"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  time: string;
  type: "status" | "news" | "urgent";
  isRead: boolean;
  link?: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // รายการแจ้งเตือน (สามารถดึงสดจาก Supabase ได้)
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: "เรื่องร้องเรียนได้รับการอัปเดต",
      description:
        'เจ้าหน้าที่เข้าตรวจสอบเหตุ "เสียงเปิดเพลงยามวิกาล หอพัก 3" แล้ว',
      time: "10 นาทีที่แล้ว",
      type: "status",
      isRead: false,
      link: "/my-reports",
    },
    {
      id: 2,
      title: "ประกาศมาตรการสิ่งแวดล้อมใหม่",
      description: "มาตรการลดเสียงรบกวนช่วงสอบปลายภาคการศึกษา",
      time: "2 ชั่วโมงที่แล้ว",
      type: "news",
      isRead: false,
      link: "/news",
    },
    {
      id: 3,
      title: "ปิดงานเรียบร้อย",
      description:
        'เคส "ขยะตกค้างบริเวณโรงอาหารกลาง" ดำเนินการเก็บเรียบร้อยแล้ว',
      time: "เมื่อวานนี้",
      type: "status",
      isRead: true,
      link: "/my-reports",
    },
  ]);

  // นับจำนวนรายการที่ยังไม่อ่าน
  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  // ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  // ทำเครื่องหมายอ่านทีละรายการ
  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* ปุ่มกดรูปกระดิ่ง */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center text-slate-600 transition cursor-pointer"
        aria-label="การแจ้งเตือน"
      >
        <span className="text-base">🔔</span>

        {/* จุดตัวเลขสีเขียวแสดงยอดแจ้งเตือนที่ยังไม่ได้อ่าน */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-xs">
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
                การแจ้งเตือน
              </span>
              {unreadCount > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  ใหม่ {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium hover:underline cursor-pointer"
              >
                อ่านทั้งหมดแล้ว
              </button>
            )}
          </div>

          {/* รายการแจ้งเตือน */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.link || "#"}
                  onClick={() => {
                    markAsRead(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-start gap-3 p-3.5 hover:bg-slate-50 transition block ${
                    !item.isRead ? "bg-emerald-50/30" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm mt-0.5 ${
                      item.type === "status"
                        ? "bg-amber-100 text-amber-800"
                        : item.type === "news"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {item.type === "status"
                      ? "📋"
                      : item.type === "news"
                        ? "📢"
                        : "⚠️"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs truncate ${!item.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}
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

                  {/* จุดสีเขียวสำหรับรายการที่ยังไม่ได้อ่าน */}
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-2"></span>
                  )}
                </Link>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                ไม่มีการแจ้งเตือนใหม่
              </div>
            )}
          </div>

          {/* ส่วนท้าย Dropdown */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href="/my-reports"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition"
            >
              ดูประวัติการแจ้งปัญหาทั้งหมด →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
