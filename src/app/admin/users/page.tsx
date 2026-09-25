"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Ban,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderOpen,
  MapPin,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  User,
  UserCheck,
  UserRound,
  Users,
  UserX,
  X,
  Clock,
  RotateCw,
} from "lucide-react";
import Header from "@/components/Header";
import { ADMIN_ACCOUNTS, USER_ACCOUNTS, getDemoSession } from "@/lib/demoAuth";
import { getAllCurrentIssues, type IssueItem } from "@/lib/issuesData";

type UserStatus = "active" | "suspended" | "deleted";
type Filter = "all" | UserStatus;
type RoleFilter = "all" | "admin" | "user";

type SystemUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  role?: "admin" | "user";
};

const USERS_KEY = "unicare_demo_system_users";
const USER_PROFILE_KEY = "unicare_demo_user_profile";
const ADMIN_PROFILE_KEY = "unicare_demo_admin_profile";

const initialUsers: SystemUser[] = [
  ...ADMIN_ACCOUNTS,
  ...USER_ACCOUNTS,
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
  return name.slice(0, 2);
}

function loadSynchronizedUsers(): SystemUser[] {
  if (typeof window === "undefined") return initialUsers;

  let userList: SystemUser[] = [];
  const saved = window.localStorage.getItem(USERS_KEY);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        userList = parsed;
      }
    } catch {
      // ignore
    }
  }

  if (userList.length === 0) {
    userList = [...initialUsers];
  } else {
    // Remove obsolete single generic admin
    userList = userList.filter(
      (u) =>
        u.email !== "nattakorn@example.com" &&
        u.email !== "admin@unicare.local" &&
        u.id !== 0,
    );

    // Ensure all 7 admin accounts exist
    ADMIN_ACCOUNTS.forEach((adminAcc) => {
      const existingIdx = userList.findIndex(
        (u) =>
          u.email?.toLowerCase() === adminAcc.email.toLowerCase() ||
          u.id === adminAcc.id,
      );
      if (existingIdx === -1) {
        userList.push({
          id: adminAcc.id,
          name: adminAcc.name,
          email: adminAcc.email,
          phone: adminAcc.phone,
          status: "active",
          role: "admin",
        });
      } else {
        userList[existingIdx] = {
          ...userList[existingIdx],
          role: "admin",
          email: adminAcc.email,
          name: userList[existingIdx].name || adminAcc.name,
          phone: userList[existingIdx].phone || adminAcc.phone,
          status: "active",
        };
      }
    });

    // Ensure all 6 user accounts exist
    USER_ACCOUNTS.forEach((userAcc) => {
      const existingIdx = userList.findIndex(
        (u) =>
          u.email?.toLowerCase() === userAcc.email.toLowerCase() ||
          u.id === userAcc.id,
      );
      if (existingIdx === -1) {
        userList.push({ ...userAcc });
      } else {
        userList[existingIdx] = {
          ...userList[existingIdx],
          role: "user",
          email: userList[existingIdx].email || userAcc.email,
          name: userList[existingIdx].name || userAcc.name,
          phone: userList[existingIdx].phone || userAcc.phone,
          status: userList[existingIdx].status || userAcc.status,
        };
      }
    });
  }

  // Sync Admin profile if edited in /admin/profile
  try {
    const savedAdminProfile = window.localStorage.getItem(ADMIN_PROFILE_KEY);
    if (savedAdminProfile) {
      const adminProfile = JSON.parse(savedAdminProfile);
      if (adminProfile?.fullName && adminProfile?.email) {
        const targetEmail = adminProfile.email.toLowerCase();
        userList = userList.map((u) =>
          u.role === "admin" &&
          (u.email?.toLowerCase() === targetEmail || u.name === adminProfile.fullName)
            ? {
                ...u,
                name: adminProfile.fullName || u.name,
                email: adminProfile.email || u.email,
                phone: adminProfile.phone || u.phone,
                role: "admin" as const,
              }
            : u,
        );
      }
    }
  } catch {
    // ignore
  }

  // Sync User profile if edited in /user/profile
  try {
    const savedUserProfile = window.localStorage.getItem(USER_PROFILE_KEY);
    if (savedUserProfile) {
      const userProfile = JSON.parse(savedUserProfile);
      if (userProfile?.fullName && userProfile?.email) {
        const targetEmail = userProfile.email.toLowerCase();
        userList = userList.map((u) =>
          u.role !== "admin" &&
          (u.email?.toLowerCase() === targetEmail || u.name === userProfile.fullName)
            ? {
                ...u,
                name: userProfile.fullName || u.name,
                email: userProfile.email || u.email,
                phone: userProfile.phone || u.phone,
                role: "user" as const,
              }
            : u,
        );
      }
    }
  } catch {
    // ignore
  }

  // Clean any old legacy name variants for user 1 if not customized
  userList = userList.map((u) =>
    u.id === 1 && (u.name === "กิตติภูมิ ปราชญากร" || u.name === "กิตติภูมิ ปราชญนคร")
      ? { ...u, name: "กิตติภูมิ" }
      : u,
  );

  // Sort admins first (by ID 101..107), then normal users
  userList.sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (a.role !== "admin" && b.role === "admin") return 1;
    return a.id - b.id;
  });

  window.localStorage.setItem(USERS_KEY, JSON.stringify(userList));
  return userList;
}

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<SystemUser[]>(initialUsers);
  const [statusFilter, setStatusFilter] = useState<Filter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingUser, setPendingUser] = useState<SystemUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);
  const [viewingReportsUser, setViewingReportsUser] = useState<SystemUser | null>(null);
  const [allIssues, setAllIssues] = useState<IssueItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adminName, setAdminName] = useState("นัฐกรณ์");

  // Pagination State (10 users per page)
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>("");

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, roleFilter]);

  useEffect(() => {
    function syncUsers() {
      const synchronized = loadSynchronizedUsers();
      setUsers(synchronized);

      const session = getDemoSession();
      if (session?.name && session.role === "admin") {
        setAdminName(session.name);
      } else {
        const currentAdmin = synchronized.find((u) => u.role === "admin");
        if (currentAdmin?.name) {
          setAdminName(currentAdmin.name);
        }
      }
      setLoaded(true);
    }

    syncUsers();

    window.addEventListener("unicare-demo-users-updated", syncUsers);
    window.addEventListener("unicare-profile-updated", syncUsers);
    window.addEventListener("storage", syncUsers);
    window.addEventListener("focus", syncUsers);

    return () => {
      window.removeEventListener("unicare-demo-users-updated", syncUsers);
      window.removeEventListener("unicare-profile-updated", syncUsers);
      window.removeEventListener("storage", syncUsers);
      window.removeEventListener("focus", syncUsers);
    };
  }, []);

  // Synchronize issues for counting and viewing reports per user
  useEffect(() => {
    const syncIssues = () => {
      setAllIssues(getAllCurrentIssues());
    };
    syncIssues();

    window.addEventListener("unicare-demo-reports-updated", syncIssues);
    window.addEventListener("storage", syncIssues);
    window.addEventListener("focus", syncIssues);

    return () => {
      window.removeEventListener("unicare-demo-reports-updated", syncIssues);
      window.removeEventListener("storage", syncIssues);
      window.removeEventListener("focus", syncIssues);
    };
  }, []);

  function getIssuesForUser(user: SystemUser): IssueItem[] {
    const uName = user.name.trim().toLowerCase();
    const uEmail = user.email.trim().toLowerCase();
    return allIssues.filter((i) => {
      const rName = (i.reporterName || "").trim().toLowerCase();
      const rEmail = (i.reporterEmail || "").trim().toLowerCase();
      if (uEmail && rEmail && uEmail === rEmail) return true;
      if (
        uEmail === "kittipoom@example.com" &&
        (rEmail === "user@unicare.local" || rName.includes("กิตติภูมิ"))
      ) {
        return true;
      }
      if (uName && rName && uName === rName) return true;
      return false;
    });
  }

  const counts = useMemo(
    () => ({
      all: users.length,
      active: users.filter((user) => user.status === "active").length,
      suspended: users.filter((user) => user.status === "suspended").length,
      deleted: users.filter((user) => user.status === "deleted").length,
      admin: users.filter((user) => user.role === "admin").length,
      user: users.filter((user) => user.role !== "admin").length,
    }),
    [users],
  );

  const visibleUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. Status Filter
      if (statusFilter !== "all" && user.status !== statusFilter) return false;

      // 2. Role Filter
      if (roleFilter !== "all" && user.role !== roleFilter) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = user.name.toLowerCase().includes(q);
        const matchEmail = user.email.toLowerCase().includes(q);
        const matchPhone = user.phone.includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }

      return true;
    });
  }, [users, statusFilter, roleFilter, searchQuery]);

  // Pagination Logic (10 users per page)
  const totalPages = Math.ceil(visibleUsers.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return visibleUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleUsers, safeCurrentPage]);

  const startIndex = visibleUsers.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(safeCurrentPage * ITEMS_PER_PAGE, visibleUsers.length);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = parseInt(pageInput, 10);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      setCurrentPage(targetPage);
      setPageInput("");
    }
  };

  function confirmStatusChange() {
    if (!pendingUser || pendingUser.role === "admin") return;

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
    window.dispatchEvent(new Event("unicare-demo-users-updated"));
    setPendingUser(null);
  }

  function confirmDeleteUser() {
    if (!deletingUser) return;

    const nextUsers = users.map((user) =>
      user.id === deletingUser.id
        ? { ...user, status: "deleted" as const }
        : user,
    );

    setUsers(nextUsers);
    window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
    window.dispatchEvent(new Event("unicare-demo-users-updated"));
    setDeletingUser(null);
  }

  function restoreUser(userId: number) {
    const nextUsers = users.map((user) =>
      user.id === userId
        ? { ...user, status: "active" as const }
        : user,
    );

    setUsers(nextUsers);
    window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
    window.dispatchEvent(new Event("unicare-demo-users-updated"));
  }

  const isSuspending = pendingUser?.status === "active";

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-800">
      <Header
        title="จัดการบัญชีผู้ใช้"
        subtitle="มหาวิทยาลัยวลัยลักษณ์"
        userName={adminName}
        role="ADMIN"
      />

      <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
        {/* ================= Summary Cards ================= */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <SummaryCard
            active={statusFilter === "all"}
            label="ผู้ใช้ทั้งหมด"
            count={counts.all}
            icon={<Users className="h-5 w-5" />}
            iconClass="bg-emerald-50 text-emerald-700"
            onClick={() => setStatusFilter("all")}
          />
          <SummaryCard
            active={statusFilter === "active"}
            label="บัญชีใช้งานอยู่"
            count={counts.active}
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconClass="bg-green-50 text-green-600"
            onClick={() => setStatusFilter("active")}
          />
          <SummaryCard
            active={statusFilter === "suspended"}
            label="บัญชีที่ถูกระงับ"
            count={counts.suspended}
            icon={<UserX className="h-5 w-5" />}
            iconClass="bg-amber-50 text-amber-600"
            onClick={() => setStatusFilter("suspended")}
          />
          <SummaryCard
            active={statusFilter === "deleted"}
            label="ถังขยะ / ลบแล้ว"
            count={counts.deleted}
            icon={<Trash2 className="h-5 w-5" />}
            iconClass="bg-rose-50 text-rose-500"
            onClick={() => setStatusFilter("deleted")}
          />
        </section>

        {/* ================= Main Section ================= */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Section Header & Filters Toolbar */}
          <div className="border-b border-slate-100 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  รายการบัญชีผู้ใช้
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  รายชื่อผู้ใช้งานทั้งหมดในระบบ พร้อมสถิติการแจ้งปัญหาและฟังก์ชันจัดการ
                </p>
              </div>

              {/* Result counter */}
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 w-fit">
                พบ {visibleUsers.length} รายการ
              </span>
            </div>

            {/* Toolbar: Search input + Role Filter buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              {/* ช่องค้นหาชื่อ/Email */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อผู้ใช้, Email หรือเบอร์โทร..."
                  className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition placeholder:text-slate-400 text-slate-700"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="ล้างคำค้นหา"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* ตัวกรองดูเฉพาะ Admin หรือ User */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs shrink-0 self-start sm:self-auto">
                <span className="text-[11px] font-medium text-slate-400 px-2 hidden md:inline-block">
                  ประเภท:
                </span>
                <button
                  type="button"
                  onClick={() => setRoleFilter("all")}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                    roleFilter === "all"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  ทั้งหมด ({counts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("admin")}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                    roleFilter === "admin"
                      ? "bg-white text-amber-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Shield className="h-3 w-3 text-amber-600" />
                  <span>Admin ({counts.admin})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("user")}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                    roleFilter === "user"
                      ? "bg-white text-emerald-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <User className="h-3 w-3 text-emerald-600" />
                  <span>User ({counts.user})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          {!loaded ? (
            <div className="py-16 text-center text-sm text-slate-400">
              กำลังโหลดข้อมูลผู้ใช้...
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center text-slate-400 space-y-2">
              <UserX className="h-10 w-10 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-600">
                ไม่พบข้อมูลผู้ใช้ที่ตรงกับเงื่อนไข
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                ลองปรับเปลี่ยนตัวกรองประเภทบัญชี สถานะ หรือคำค้นหาใหม่
              </p>
              {(searchQuery || statusFilter !== "all" || roleFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setRoleFilter("all");
                  }}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">ผู้ใช้งาน</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">เบอร์โทร</th>
                      <th className="px-5 py-3.5 text-center">ประวัติแจ้งปัญหา</th>
                      <th className="px-5 py-3.5">สถานะ</th>
                      <th className="px-5 py-3.5 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedUsers.map((user) => {
                      const isActive = user.status === "active";
                      const isSuspended = user.status === "suspended";
                      const isDeleted = user.status === "deleted";
                      const userIssues = getIssuesForUser(user);

                      return (
                        <tr
                          key={user.id}
                          className={`transition hover:bg-slate-50/70 ${
                            isDeleted ? "bg-rose-50/20 opacity-80" : ""
                          }`}
                        >
                          {/* ผู้ใช้งาน */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                                  user.role === "admin"
                                    ? "bg-amber-100 text-amber-800"
                                    : isDeleted
                                    ? "bg-slate-100 text-slate-400"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {getInitials(user.name)}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p
                                    className={`text-xs font-bold ${
                                      isDeleted
                                        ? "text-slate-500 line-through"
                                        : "text-slate-800"
                                    }`}
                                  >
                                    {user.name}
                                  </p>
                                  {user.role === "admin" ? (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-800">
                                      Admin
                                    </span>
                                  ) : (
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                                      User
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[10px] text-slate-400">
                                  ID: #{user.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-5 py-4 text-xs text-slate-600 font-mono">
                            {user.email}
                          </td>

                          {/* เบอร์โทร */}
                          <td className="px-5 py-4 text-xs text-slate-600">
                            {user.phone}
                          </td>

                          {/* ประวัติแจ้งปัญหา (ดูตรงรายชื่อได้ว่าคนนี้เคย report ปัญหาอะไรบ้าง) */}
                          <td className="px-5 py-4 text-center">
                            {user.role === "admin" ? (
                              <span className="text-slate-300 text-xs">—</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setViewingReportsUser(user)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                                  userIssues.length > 0
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:scale-[1.02]"
                                    : "bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100"
                                }`}
                                title={`คลิกเพื่อดูปัญหาที่ ${user.name} เคยแจ้ง`}
                              >
                                <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                                <span>{userIssues.length} รายการ</span>
                                {userIssues.length > 0 && (
                                  <span className="text-[9px] underline ml-0.5 text-emerald-800">
                                    ดูเคส
                                  </span>
                                )}
                              </button>
                            )}
                          </td>

                          {/* สถานะ */}
                          <td className="px-5 py-4">
                            {isDeleted ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200/80">
                                <Trash2 className="h-3 w-3" />
                                <span>ลบแล้ว (ถังขยะ)</span>
                              </span>
                            ) : isSuspended ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                                <UserX className="h-3 w-3" />
                                <span>ถูกระงับ</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>ใช้งานอยู่</span>
                              </span>
                            )}
                          </td>

                          {/* จัดการ (ลบบัญชี, กู้คืนบัญชี, ระงับ/เปิดใช้งาน) */}
                          <td className="px-5 py-4 text-right">
                            {user.role === "admin" ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-400">
                                บัญชีผู้ดูแลระบบ
                              </span>
                            ) : isDeleted ? (
                              /* ปุ่มกู้คืนบัญชีสำหรับบัญชีที่ลบไปแล้ว */
                              <button
                                type="button"
                                onClick={() => restoreUser(user.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer shadow-2xs hover:scale-[1.02]"
                                title="กู้คืนบัญชีนี้กลับมาใช้งานตามปกติ"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>กู้คืนบัญชี</span>
                              </button>
                            ) : (
                              /* ปุ่มระงับ/เปิดใช้งาน และปุ่มลบบัญชี */
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPendingUser(user)}
                                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                                    isActive
                                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/70"
                                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70"
                                  }`}
                                  title={
                                    isActive
                                      ? "ระงับการใช้งานชั่วคราว"
                                      : "เปิดใช้งานบัญชี"
                                  }
                                >
                                  {isActive ? (
                                    <>
                                      <Ban className="h-3 w-3" />
                                      <span>ระงับ</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-3 w-3" />
                                      <span>เปิดใช้</span>
                                    </>
                                  )}
                                </button>

                                {/* ปุ่มลบบัญชี */}
                                <button
                                  type="button"
                                  onClick={() => setDeletingUser(user)}
                                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 transition cursor-pointer hover:scale-[1.02]"
                                  title="ลบบัญชีผู้ใช้นี้ (สามารถกู้คืนได้ภายหลัง)"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>ลบ</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {visibleUsers.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 mt-4 px-2">
                  <div className="text-[11px] text-slate-500">
                    แสดง <span className="font-semibold text-slate-800">{startIndex} - {endIndex}</span> จากทั้งหมด{" "}
                    <span className="font-semibold text-slate-800">{visibleUsers.length}</span> รายชื่อ
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
                                ? "bg-[#1b5e4a] text-white shadow-xs"
                                : "bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
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
            </>
          )}
        </section>
      </main>

      {/* ================= MODAL 1: ระงับ / เปิดใช้งานบัญชี ================= */}
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
                  ? "bg-amber-50 text-amber-600"
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
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {isSuspending
                ? "คุณต้องการระงับบัญชีผู้ใช้นี้หรือไม่? ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะเปิดใช้งานอีกครั้ง"
                : "คุณต้องการเปิดใช้งานบัญชีผู้ใช้นี้อีกครั้งหรือไม่? ผู้ใช้จะสามารถเข้าสู่ระบบและใช้งานได้ตามปกติ"}
            </p>
            <span className="mt-4 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
              {pendingUser.name} ({pendingUser.email})
            </span>

            <div className="mt-7 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setPendingUser(null)}
                className="min-w-28 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmStatusChange}
                className={`min-w-28 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition ${
                  isSuspending
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSuspending ? "ยืนยันการระงับ" : "ยืนยันเปิดใช้งาน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ยืนยันการลบบัญชีผู้ใช้ ================= */}
      {deletingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
          onClick={() => setDeletingUser(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-3xl bg-white px-6 py-8 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="ปิด"
              onClick={() => setDeletingUser(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 className="h-7 w-7" />
            </span>

            <h2 className="mt-5 text-lg font-extrabold text-slate-800">
              ยืนยันการลบบัญชีผู้ใช้
            </h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              คุณต้องการลบบัญชีของ <strong>{deletingUser.name}</strong> หรือไม่? บัญชีนี้จะถูกย้ายไปยังถังขยะและไม่สามารถเข้าใช้งานระบบได้ชั่วคราว (คุณสามารถกดกู้คืนบัญชีได้ตลอดเวลาในหมวดถังขยะ)
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-left text-xs space-y-1">
              <p className="text-slate-700 font-semibold">{deletingUser.name}</p>
              <p className="text-slate-400 font-mono text-[11px]">{deletingUser.email}</p>
              <p className="text-slate-400 text-[11px]">เบอร์โทร: {deletingUser.phone}</p>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="min-w-28 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="min-w-28 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold text-white transition shadow-sm"
              >
                ยืนยันการลบบัญชี
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ดูประวัติการแจ้งปัญหาของ User คนนี้ ================= */}
      {viewingReportsUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
          onClick={() => setViewingReportsUser(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-white p-6 shadow-2xl flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-bold text-sm">
                  {getInitials(viewingReportsUser.name)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">
                      ประวัติการแจ้งปัญหา: {viewingReportsUser.name}
                    </h3>
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {getIssuesForUser(viewingReportsUser).length} เรื่อง
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    {viewingReportsUser.email} · โทร {viewingReportsUser.phone}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingReportsUser(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List of Reports */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {getIssuesForUser(viewingReportsUser).length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">
                    ผู้ใช้งานท่านนี้ยังไม่มีประวัติการส่งเรื่องร้องเรียน
                  </p>
                  <p className="text-xs text-slate-400">
                    เมื่อผู้ใช้คนนี้แจ้งปัญหาผ่านระบบ จะปรากฏรายละเอียดที่นี่ทันที
                  </p>
                </div>
              ) : (
                getIssuesForUser(viewingReportsUser).map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-xs transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-[#154c3c] text-xs">
                          #{issue.id}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          🏷️ {issue.category}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{issue.date}</span>
                        </span>
                      </div>

                      {/* Status */}
                      <div>
                        {issue.status === "in_progress" && (
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-semibold inline-flex items-center gap-1">
                            <RotateCw className="w-3 h-3 animate-spin" />
                            <span>กำลังดำเนินการ</span>
                          </span>
                        )}
                        {issue.status === "resolved" && (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>แก้ไขสำเร็จ</span>
                          </span>
                        )}
                        {issue.status === "pending" && (
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-semibold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>รอรับเรื่อง</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {issue.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{issue.area}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ผู้ดูแล: {issue.adminName}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingReportsUser(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition"
              >
                ปิดหน้าต่าง
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
      className={`flex min-h-24 items-center gap-4 rounded-2xl border bg-white p-4 sm:p-5 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
        active
          ? "border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20"
          : "border-slate-200"
      }`}
    >
      <span
        className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-slate-500">
          {label}
        </span>
        <span className="mt-1 block text-2xl sm:text-3xl font-extrabold text-slate-800">
          {count}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 hidden sm:block" />
    </button>
  );
}
