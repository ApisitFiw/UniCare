"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Ban,
  Check,
  CheckCircle2,
  ChevronRight,
  UserRound,
  Users,
  UserX,
  X,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import Header from "@/components/Header";

type UserStatus = "active" | "suspended";
type Filter = "all" | UserStatus;

type SystemUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
};

const USERS_KEY = "unicare_demo_system_users";

const initialUsers: SystemUser[] = [
  {
    id: 1,
    name: "กิตติภูมิ ปราชญากร",
    email: "kittipoom@example.com",
    phone: "081-234-5678",
    status: "active",
  },
  {
    id: 2,
    name: "สมชาย ใจดี",
    email: "somchai@example.com",
    phone: "082-345-6789",
    status: "active",
  },
  {
    id: 3,
    name: "นภัสสร แสงทอง",
    email: "napatsorn@example.com",
    phone: "083-456-7890",
    status: "active",
  },
  {
    id: 4,
    name: "ธนกร รักเรียน",
    email: "thanakorn@example.com",
    phone: "084-567-8901",
    status: "suspended",
  },
  {
    id: 5,
    name: "กิตติพงษ์ ศรีสุข",
    email: "kittipong@example.com",
    phone: "085-678-9012",
    status: "active",
  },
  {
    id: 6,
    name: "พิมพ์ชนก วัฒนะ",
    email: "pimchanok@example.com",
    phone: "086-789-0123",
    status: "active",
  },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
  return name.slice(0, 2);
}

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<SystemUser[]>(initialUsers);
  const [filter, setFilter] = useState<Filter>("all");
  const [pendingUser, setPendingUser] = useState<SystemUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(USERS_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SystemUser[];
        if (Array.isArray(parsed)) setUsers(parsed);
      } catch {
        window.localStorage.removeItem(USERS_KEY);
      }
    }

    setLoaded(true);
  }, []);

  const counts = useMemo(
    () => ({
      all: users.length,
      active: users.filter((user) => user.status === "active").length,
      suspended: users.filter((user) => user.status === "suspended").length,
    }),
    [users],
  );

  const visibleUsers = useMemo(
    () =>
      filter === "all"
        ? users
        : users.filter((user) => user.status === filter),
    [filter, users],
  );

  function confirmStatusChange() {
    if (!pendingUser) return;

    const nextUsers = users.map((user) =>
      user.id === pendingUser.id
        ? {
            ...user,
            status:
              user.status === "active"
                ? ("suspended" as const)
                : ("active" as const),
          }
        : user,
    );

    setUsers(nextUsers);
    window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
    setPendingUser(null);
  }

  const isSuspending = pendingUser?.status === "active";

  return (
    <div className="min-h-screen bg-[#f4f8f6] text-slate-800 md:flex">

      <div className="min-w-0 flex-1">
        <Header
          title="จัดการบัญชีผู้ใช้"
          subtitle="มหาวิทยาลัยวลัยลักษณ์"
          userName="กิตติภูมิ ปราชญากร"
          role="ADMIN"
        />

        <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              active={filter === "all"}
              label="ผู้ใช้ทั้งหมด"
              count={counts.all}
              icon={<Users className="h-5 w-5" />}
              iconClass="bg-emerald-50 text-emerald-700"
              onClick={() => setFilter("all")}
            />
            <SummaryCard
              active={filter === "active"}
              label="บัญชีใช้งานอยู่"
              count={counts.active}
              icon={<CheckCircle2 className="h-5 w-5" />}
              iconClass="bg-green-50 text-green-600"
              onClick={() => setFilter("active")}
            />
            <SummaryCard
              active={filter === "suspended"}
              label="บัญชีที่ถูกระงับ"
              count={counts.suspended}
              icon={<UserX className="h-5 w-5" />}
              iconClass="bg-rose-50 text-rose-500"
              onClick={() => setFilter("suspended")}
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h2 className="text-base font-bold text-slate-800">
                รายการบัญชีผู้ใช้
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                รายชื่อผู้ใช้งานทั้งหมดในระบบ
              </p>
            </div>

            {!loaded ? (
              <div className="py-16 text-center text-sm text-slate-400">
                กำลังโหลดข้อมูลผู้ใช้...
              </div>
            ) : visibleUsers.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center text-slate-400">
                <UserX className="h-9 w-9" />
                <h3 className="mt-3 text-sm font-bold text-slate-600">
                  ไม่พบข้อมูลผู้ใช้
                </h3>
                <p className="mt-1 text-xs">ไม่มีผู้ใช้ในสถานะที่เลือก</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                    <tr>
                      <th className="px-5 py-4">ผู้ใช้งาน</th>
                      <th className="px-5 py-4">Email</th>
                      <th className="px-5 py-4">เบอร์โทร</th>
                      <th className="px-5 py-4">สถานะ</th>
                      <th className="px-5 py-4">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleUsers.map((user) => {
                      const isActive = user.status === "active";

                      return (
                        <tr
                          key={user.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-extrabold text-emerald-700">
                                {getInitials(user.name)}
                              </span>
                              <div>
                                <p className="text-xs font-bold text-slate-700">
                                  {user.name}
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-400">
                                  UNICARE User
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-600">
                            {user.email}
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-600">
                            {user.phone}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-600"
                              }`}
                            >
                              {isActive ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <UserX className="h-3.5 w-3.5" />
                              )}
                              {isActive ? "ใช้งานอยู่" : "ถูกระงับ"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => setPendingUser(user)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition hover:-translate-y-0.5 ${
                                isActive
                                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {isActive ? (
                                <Ban className="h-3.5 w-3.5" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              {isActive ? "ระงับบัญชี" : "เปิดใช้งาน"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {pendingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
          onClick={() => setPendingUser(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-confirm-title"
            className="relative w-full max-w-md rounded-3xl bg-white px-6 py-8 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="ปิด"
              onClick={() => setPendingUser(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <span
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                isSuspending
                  ? "bg-rose-50 text-rose-500"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {isSuspending ? (
                <UserX className="h-7 w-7" />
              ) : (
                <CheckCircle2 className="h-7 w-7" />
              )}
            </span>

            <h2
              id="account-confirm-title"
              className="mt-5 text-lg font-extrabold text-slate-800"
            >
              {isSuspending
                ? "ยืนยันการระงับบัญชี"
                : "ยืนยันการเปิดใช้งานบัญชี"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {isSuspending
                ? "คุณต้องการระงับบัญชีผู้ใช้นี้หรือไม่?"
                : "คุณต้องการเปิดใช้งานบัญชีผู้ใช้นี้อีกครั้งหรือไม่?"}
            </p>
            <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
              {pendingUser.name}
            </span>

            <div className="mt-7 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setPendingUser(null)}
                className="min-w-28 rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmStatusChange}
                className={`min-w-28 rounded-xl px-5 py-3 text-xs font-bold text-white transition ${
                  isSuspending
                    ? "bg-rose-500 hover:bg-rose-600"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSuspending ? "ระงับบัญชี" : "เปิดใช้งาน"}
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
      className={`flex min-h-24 items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active
          ? "border-emerald-500 ring-1 ring-emerald-100"
          : "border-slate-200"
      }`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-slate-500">
          {label}
        </span>
        <span className="mt-1 block text-2xl font-extrabold text-slate-800">
          {count}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </button>
  );
}
