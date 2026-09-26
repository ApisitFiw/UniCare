"use client";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Ban,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  MapPin,
  RotateCcw,
  RotateCw,
  Search,
  Tag,
  Trash2,
  UserX,
  Users,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import {
  USER_ACCOUNTS,
  getDemoSession,
} from "@/lib/authService";
import {
  getAllCurrentIssues,
  type IssueItem,
} from "@/lib/issuesData";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchProfilesFromSupabase,
  upsertProfileInSupabase,
} from "@/lib/supabaseService";
type UserStatus =
  | "active"
  | "suspended"
  | "deleted";
type StatusFilter =
  | "all"
  | UserStatus;
type SystemUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  role: "user";
};
const USERS_KEY =
  "unicare_demo_system_users";
const USER_PROFILE_KEY =
  "unicare_demo_user_profile";
const ITEMS_PER_PAGE = 10;
const initialUsers: SystemUser[] =
  USER_ACCOUNTS.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    role: "user",
  }));
function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`;
  }
  return name.slice(0, 2);
}

function maskEmail(email: string) {
  const [localPart, domain] = email.trim().split("@");

  if (!localPart || !domain) {
    return email || "-";
  }

  const visiblePart = localPart.slice(0, 3);
  const hiddenPart = "*".repeat(
    Math.max(localPart.length - visiblePart.length, 3),
  );

  return `${visiblePart}${hiddenPart}@${domain}`;
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 5) {
    return phone || "-";
  }

  return `${digits.slice(0, 3)}-***-**${digits.slice(-2)}`;
}
function isAdminAccount(
  user: {
    role?: string;
  },
) {
  return user.role === "admin";
}
function loadSynchronizedUsers(): SystemUser[] {
  if (typeof window === "undefined") {
    return initialUsers;
  }
  let userList: SystemUser[] = [];
  const saved =
    window.localStorage.getItem(
      USERS_KEY,
    );
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        userList = parsed
          .filter(
            (user) =>
              !isAdminAccount(user),
          )
          .map(
            (user): SystemUser => ({
              id: Number(user.id),
              name: String(
                user.name || "",
              ),
              email: String(
                user.email || "",
              ),
              phone: String(
                user.phone || "-",
              ),
              status:
                user.status ===
                  "suspended" ||
                user.status ===
                  "deleted"
                  ? user.status
                  : "active",
              role: "user",
            }),
          )
          .filter(
            (user) =>
              user.id &&
              user.name &&
              user.email,
          );
      }
    } catch {
      userList = [];
    }
  }
  if (userList.length === 0) {
    userList = [...initialUsers];
  }
  // ตรวจสอบให้บัญชี User เริ่มต้นมีครบ
  USER_ACCOUNTS.forEach((account) => {
    const existingIndex =
      userList.findIndex(
        (user) =>
          user.email.toLowerCase() ===
            account.email.toLowerCase() ||
          user.id === account.id,
      );
    if (existingIndex === -1) {
      userList.push({
        id: account.id,
        name: account.name,
        email: account.email,
        phone: account.phone,
        status: account.status,
        role: "user",
      });
      return;
    }
    userList[existingIndex] = {
      ...userList[existingIndex],
      name:
        userList[existingIndex].name ||
        account.name,
      email:
        userList[existingIndex].email ||
        account.email,
      phone:
        userList[existingIndex].phone ||
        account.phone,
      status:
        userList[existingIndex].status ||
        account.status,
      role: "user",
    };
  });
  // เชื่อมข้อมูลจากหน้า User Profile
  try {
    const savedProfile =
      window.localStorage.getItem(
        USER_PROFILE_KEY,
      );
    if (savedProfile) {
      const profile =
        JSON.parse(savedProfile);
      if (
        profile?.fullName &&
        profile?.email
      ) {
        const profileEmail =
          String(profile.email)
            .trim()
            .toLowerCase();
        const matchedIndex =
          userList.findIndex(
            (user) =>
              user.email
                .trim()
                .toLowerCase() ===
                profileEmail ||
              user.name ===
                profile.fullName,
          );
        if (matchedIndex >= 0) {
          userList[matchedIndex] = {
            ...userList[matchedIndex],
            name:
              profile.fullName ||
              userList[matchedIndex].name,
            email:
              profile.email ||
              userList[matchedIndex].email,
            phone:
              profile.phone ||
              userList[matchedIndex].phone,
            role: "user",
          };
        }
      }
    }
  } catch {
    // ใช้ข้อมูลเดิมหาก Profile ไม่ถูกต้อง
  }
  // ลบข้อมูลซ้ำ
  const seenIds = new Set<number>();
  const seenEmails = new Set<string>();
  const uniqueUsers: SystemUser[] = [];
  for (const user of userList) {
    if (isAdminAccount(user)) {
      continue;
    }
    const emailKey =
      user.email.trim().toLowerCase();
    if (seenIds.has(user.id)) {
      continue;
    }
    if (
      emailKey &&
      seenEmails.has(emailKey)
    ) {
      continue;
    }
    seenIds.add(user.id);
    if (emailKey) {
      seenEmails.add(emailKey);
    }
    uniqueUsers.push({
      ...user,
      role: "user",
    });
  }
  uniqueUsers.sort(
    (firstUser, secondUser) =>
      firstUser.id - secondUser.id,
  );
  window.localStorage.setItem(
    USERS_KEY,
    JSON.stringify(uniqueUsers),
  );
  return uniqueUsers;
}
export default function AdminUserManagementPage() {
  const [users, setUsers] =
    useState<SystemUser[]>(initialUsers);
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>("all");
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    pendingUser,
    setPendingUser,
  ] = useState<SystemUser | null>(
    null,
  );
  const [
    deletingUser,
    setDeletingUser,
  ] = useState<SystemUser | null>(
    null,
  );
  const [
    viewingReportsUser,
    setViewingReportsUser,
  ] = useState<SystemUser | null>(
    null,
  );
  const [allIssues, setAllIssues] =
    useState<IssueItem[]>([]);
  const [loaded, setLoaded] =
    useState(false);
  const [adminName, setAdminName] =
    useState("นัฐกรณ์");
  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);
  const [
    pageInput,
    setPageInput,
  ] = useState("");
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);
  useEffect(() => {
    let isSubscribed = true;
    async function syncUsers() {
      const synchronizedUsers =
        loadSynchronizedUsers();
      if (isSubscribed) {
        setUsers(
          synchronizedUsers.filter(
            (user) =>
              !isAdminAccount(user),
          ),
        );
        const session =
          getDemoSession();
        if (
          session?.name &&
          session.role === "admin"
        ) {
          setAdminName(session.name);
        }
        setLoaded(true);
      }
      try {
        const profiles =
          await fetchProfilesFromSupabase();
        if (
          !isSubscribed ||
          !profiles ||
          profiles.length === 0
        ) {
          return;
        }
        setUsers((currentUsers) => {
          const updatedUsers =
            currentUsers.filter(
              (user) =>
                !isAdminAccount(user),
            );
          profiles
            .filter(
              (profile) =>
                profile.role !== "admin",
            )
            .forEach(
              (profile, index) => {
                const matchedIndex =
                  updatedUsers.findIndex(
                    (user) =>
                      user.email
                        .toLowerCase() ===
                      profile.email
                        .toLowerCase(),
                  );
                if (matchedIndex >= 0) {
                  updatedUsers[
                    matchedIndex
                  ] = {
                    ...updatedUsers[
                      matchedIndex
                    ],
                    name:
                      profile.full_name ||
                      updatedUsers[
                        matchedIndex
                      ].name,
                    phone:
                      profile.phone ||
                      updatedUsers[
                        matchedIndex
                      ].phone,
                    status:
                      (profile.status as any) ||
                      updatedUsers[
                        matchedIndex
                      ].status,
                    role: "user",
                  };
                  return;
                }
                updatedUsers.push({
                  id: 1000 + index,
                  name:
                    profile.full_name ||
                    profile.email.split(
                      "@",
                    )[0],
                  email: profile.email,
                  phone: profile.phone || "-",
                  status: (profile.status as any) || "active",
                  role: "user",
                });
              },
            );
          const uniqueUsers =
            updatedUsers.filter(
              (
                user,
                index,
                completeList,
              ) =>
                completeList.findIndex(
                  (candidate) =>
                    candidate.email
                      .toLowerCase() ===
                    user.email.toLowerCase(),
                ) === index,
            );
          window.localStorage.setItem(
            USERS_KEY,
            JSON.stringify(uniqueUsers),
          );
          return uniqueUsers;
        });
      } catch (error) {
        console.warn(
          "Supabase profiles sync failed:",
          error,
        );
      }
    }
    syncUsers();
    const channel = supabase
      .channel("unicare-profiles-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          syncUsers();
        },
      )
      .subscribe();
    window.addEventListener(
      "unicare-demo-users-updated",
      syncUsers,
    );
    window.addEventListener(
      "unicare-profile-updated",
      syncUsers,
    );
    window.addEventListener(
      "storage",
      syncUsers,
    );
    window.addEventListener(
      "focus",
      syncUsers,
    );
    return () => {
      isSubscribed = false;
      channel.unsubscribe();
      window.removeEventListener(
        "unicare-demo-users-updated",
        syncUsers,
      );
      window.removeEventListener(
        "unicare-profile-updated",
        syncUsers,
      );
      window.removeEventListener(
        "storage",
        syncUsers,
      );
      window.removeEventListener(
        "focus",
        syncUsers,
      );
    };
  }, []);
  useEffect(() => {
    function syncIssues() {
      setAllIssues(
        getAllCurrentIssues(),
      );
    }
    syncIssues();
    window.addEventListener(
      "unicare-demo-reports-updated",
      syncIssues,
    );
    window.addEventListener(
      "storage",
      syncIssues,
    );
    window.addEventListener(
      "focus",
      syncIssues,
    );
    return () => {
      window.removeEventListener(
        "unicare-demo-reports-updated",
        syncIssues,
      );
      window.removeEventListener(
        "storage",
        syncIssues,
      );
      window.removeEventListener(
        "focus",
        syncIssues,
      );
    };
  }, []);
  function getIssuesForUser(
    user: SystemUser,
  ): IssueItem[] {
    const userName =
      user.name.trim().toLowerCase();
    const userEmail =
      user.email.trim().toLowerCase();
    return allIssues.filter((issue) => {
      const reporterName =
        (issue.reporterName || "")
          .trim()
          .toLowerCase();
      const reporterEmail =
        (issue.reporterEmail || "")
          .trim()
          .toLowerCase();
      if (
        userEmail &&
        reporterEmail &&
        userEmail === reporterEmail
      ) {
        return true;
      }
      if (
        userEmail ===
          "kittipoom@example.com" &&
        (reporterEmail ===
          "user@unicare.local" ||
          reporterName.includes(
            "กิตติภูมิ",
          ))
      ) {
        return true;
      }
      if (
        userName &&
        reporterName &&
        userName === reporterName
      ) {
        return true;
      }
      return false;
    });
  }
  const counts = useMemo(
    () => ({
      all: users.length,
      active: users.filter(
        (user) =>
          user.status === "active",
      ).length,
      suspended: users.filter(
        (user) =>
          user.status === "suspended",
      ).length,
      deleted: users.filter(
        (user) =>
          user.status === "deleted",
      ).length,
    }),
    [users],
  );
  const visibleUsers = useMemo(() => {
    return users.filter((user) => {
      if (isAdminAccount(user)) {
        return false;
      }
      if (
        statusFilter !== "all" &&
        user.status !== statusFilter
      ) {
        return false;
      }
      const normalizedSearch =
        searchQuery
          .trim()
          .toLowerCase();
      if (normalizedSearch) {
        const matchesName =
          user.name
            .toLowerCase()
            .includes(
              normalizedSearch,
            );
        const matchesEmail =
          user.email
            .toLowerCase()
            .includes(
              normalizedSearch,
            );
        const matchesPhone =
          user.phone.includes(
            normalizedSearch,
          );
        if (
          !matchesName &&
          !matchesEmail &&
          !matchesPhone
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    users,
    statusFilter,
    searchQuery,
  ]);
  const totalPages =
    Math.ceil(
      visibleUsers.length /
        ITEMS_PER_PAGE,
    ) || 1;
  const safeCurrentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages,
  );
  const paginatedUsers = useMemo(() => {
    const start =
      (safeCurrentPage - 1) *
      ITEMS_PER_PAGE;
    return visibleUsers.slice(
      start,
      start + ITEMS_PER_PAGE,
    );
  }, [
    visibleUsers,
    safeCurrentPage,
  ]);
  const startIndex =
    visibleUsers.length === 0
      ? 0
      : (safeCurrentPage - 1) *
          ITEMS_PER_PAGE +
        1;
  const endIndex = Math.min(
    safeCurrentPage *
      ITEMS_PER_PAGE,
    visibleUsers.length,
  );
  function handlePageInputChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setPageInput(event.target.value);
  }
  function handlePageInputSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const targetPage = Number.parseInt(
      pageInput,
      10,
    );
    if (
      Number.isNaN(targetPage) ||
      targetPage < 1 ||
      targetPage > totalPages
    ) {
      return;
    }
    setCurrentPage(targetPage);
    setPageInput("");
  }
  function saveUsers(
    nextUsers: SystemUser[],
  ) {
    const userOnlyList =
      nextUsers.filter(
        (user) =>
          !isAdminAccount(user),
      );
    setUsers(userOnlyList);
    window.localStorage.setItem(
      USERS_KEY,
      JSON.stringify(userOnlyList),
    );
    window.dispatchEvent(
      new Event(
        "unicare-demo-users-updated",
      ),
    );
  }
  function confirmStatusChange() {
    if (!pendingUser) {
      return;
    }
    const nextUsers = users.map(
      (user) =>
        user.id === pendingUser.id
          ? {
              ...user,
              status:
                user.status ===
                "active"
                  ? ("suspended" as const)
                  : ("active" as const),
            }
          : user,
    );
    saveUsers(nextUsers);
    upsertProfileInSupabase({
      email: pendingUser.email,
      full_name: pendingUser.name,
      role: "user",
    }).catch((error) =>
      console.warn(
        "Supabase profile sync error:",
        error,
      ),
    );
    setPendingUser(null);
  }
  function confirmDeleteUser() {
    if (!deletingUser) {
      return;
    }
    const nextUsers = users.map(
      (user) =>
        user.id === deletingUser.id
          ? {
              ...user,
              status:
                "deleted" as const,
            }
          : user,
    );
    saveUsers(nextUsers);
    upsertProfileInSupabase({
      email: deletingUser.email,
      full_name: deletingUser.name,
      role: "user",
    }).catch((error) =>
      console.warn(
        "Supabase profile sync error:",
        error,
      ),
    );
    setDeletingUser(null);
  }
  function restoreUser(
    userId: number,
  ) {
    const targetUser =
      users.find(
        (user) =>
          user.id === userId,
      );
    const nextUsers = users.map(
      (user) =>
        user.id === userId
          ? {
              ...user,
              status:
                "active" as const,
            }
          : user,
    );
    saveUsers(nextUsers);
    if (targetUser) {
      upsertProfileInSupabase({
        email: targetUser.email,
        full_name: targetUser.name,
        role: "user",
      }).catch((error) =>
        console.warn(
          "Supabase profile sync error:",
          error,
        ),
      );
    }
  }
  const isSuspending =
    pendingUser?.status === "active";
  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-800">
      <Header
        title="จัดการบัญชีผู้ใช้"
        titleEn="User Account Management"
        subtitle="มหาวิทยาลัยวลัยลักษณ์"
        subtitleEn="Walailak University"
        userName={adminName}
        role="ADMIN"
      />
      <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <SummaryCard
            active={
              statusFilter === "all"
            }
            label="ผู้ใช้ทั้งหมด"
            count={counts.all}
            icon={
              <Users className="h-5 w-5" />
            }
            iconClass="bg-emerald-50 text-emerald-700"
            onClick={() =>
              setStatusFilter("all")
            }
          />
          <SummaryCard
            active={
              statusFilter ===
              "active"
            }
            label="บัญชีใช้งานอยู่"
            count={counts.active}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            iconClass="bg-green-50 text-green-600"
            onClick={() =>
              setStatusFilter(
                "active",
              )
            }
          />
          <SummaryCard
            active={
              statusFilter ===
              "suspended"
            }
            label="บัญชีที่ถูกระงับ"
            count={counts.suspended}
            icon={
              <UserX className="h-5 w-5" />
            }
            iconClass="bg-amber-50 text-amber-600"
            onClick={() =>
              setStatusFilter(
                "suspended",
              )
            }
          />
          <SummaryCard
            active={
              statusFilter ===
              "deleted"
            }
            label="ถังขยะ / ลบแล้ว"
            count={counts.deleted}
            icon={
              <Trash2 className="h-5 w-5" />
            }
            iconClass="bg-rose-50 text-rose-500"
            onClick={() =>
              setStatusFilter(
                "deleted",
              )
            }
          />
        </section>
        {/* Main Section */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-4 border-b border-slate-100 p-5">
            {/* ชื่อรายการ */}
            <div>
              <h2 className="text-base font-bold text-slate-800">
                รายการบัญชีผู้ใช้
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                รายชื่อผู้ใช้งานทั่วไปทั้งหมดในระบบ พร้อมสถิติการแจ้งปัญหาและฟังก์ชันจัดการ
              </p>
            </div>
            {/* ช่องค้นหาและจำนวนผลลัพธ์ */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                className="relative"
                style={{ width: "560px", maxWidth: "100%" }}
              >
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="ค้นหาชื่อผู้ใช้, อีเมล หรือเบอร์โทร..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchQuery("")
                    }
                    title="ล้างคำค้นหา"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600">
                <Users className="h-4 w-4 text-emerald-600" />
                <span>
                  พบ{" "}
                  <strong className="text-slate-800">
                    {visibleUsers.length}
                  </strong>{" "}
                  รายการ
                </span>
              </span>
            </div>
          </div>
          {!loaded ? (
            <div className="py-16 text-center text-sm text-slate-400">
              กำลังโหลดข้อมูลผู้ใช้...
            </div>
          ) : visibleUsers.length ===
            0 ? (
            <div className="flex flex-col items-center space-y-2 py-16 text-center text-slate-400">
              <UserX className="h-10 w-10 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-600">
                ไม่พบข้อมูลผู้ใช้ที่ตรงกับเงื่อนไข
              </h3>
              <p className="max-w-sm text-xs text-slate-400">
                ลองเปลี่ยนสถานะหรือคำค้นหาใหม่
              </p>
              {(searchQuery ||
                statusFilter !==
                  "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter(
                      "all",
                    );
                  }}
                  className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-left">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500">
                    <tr>
                      <th
                        className="py-3.5 pr-5"
                        style={{ paddingLeft: "16px" }}
                      >
                        ผู้ใช้งาน
                      </th>
                      <th className="px-5 py-3.5">
                        Email
                      </th>
                      <th className="px-5 py-3.5">
                        เบอร์โทร
                      </th>
                      <th className="px-5 py-3.5 text-center">
                        ประวัติแจ้งปัญหา
                      </th>
                      <th className="px-5 py-3.5">
                        สถานะ
                      </th>
                      <th className="px-5 py-3.5 text-right">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedUsers.map(
                      (user) => {
                        const isActive =
                          user.status ===
                          "active";
                        const isSuspended =
                          user.status ===
                          "suspended";
                        const isDeleted =
                          user.status ===
                          "deleted";
                        const userIssues =
                          getIssuesForUser(
                            user,
                          );
                        return (
                          <tr
                            key={user.id}
                            className={`transition hover:bg-slate-50/70 ${
                              isDeleted
                                ? "bg-rose-50/20 opacity-80"
                                : ""
                            }`}
                          >
                            <td
                              className="py-4 pr-5"
                              style={{ paddingLeft: "16px" }}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                                    isDeleted
                                      ? "bg-slate-100 text-slate-400"
                                      : "bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  {getInitials(
                                    user.name,
                                  )}
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
                                      <span
                                        className="notranslate"
                                        data-user-content="true"
                                      >
                                        {
                                          user.name
                                        }
                                      </span>
                                    </p>
                                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                                      User
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    ID: #
                                    {user.id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 font-mono text-xs text-slate-600">
                              {maskEmail(user.email)}
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-600">
                              {maskPhone(user.phone)}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setViewingReportsUser(
                                    user,
                                  )
                                }
                                title={`คลิกเพื่อดูปัญหาที่ ${user.name} เคยแจ้ง`}
                                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                                  userIssues.length >
                                  0
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:scale-[1.02] hover:bg-emerald-100"
                                    : "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"
                                }`}
                              >
                                <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  {
                                    userIssues.length
                                  }{" "}
                                  รายการ
                                </span>
                                {userIssues.length >
                                  0 && (
                                  <span className="ml-0.5 text-[9px] text-emerald-800 underline">
                                    ดูเคส
                                  </span>
                                )}
                              </button>
                            </td>
                            <td className="px-5 py-4">
                              {isDeleted ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                                  <Trash2 className="h-3 w-3" />
                                  ลบแล้ว (ถังขยะ)
                                </span>
                              ) : isSuspended ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                                  <UserX className="h-3 w-3" />
                                  ถูกระงับ
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  ใช้งานอยู่
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              {isDeleted ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    restoreUser(
                                      user.id,
                                    )
                                  }
                                  title="กู้คืนบัญชีนี้"
                                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 shadow-xs transition hover:scale-[1.02] hover:bg-emerald-100"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  กู้คืนบัญชี
                                </button>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPendingUser(
                                        user,
                                      )
                                    }
                                    title={
                                      isActive
                                        ? "ระงับการใช้งานชั่วคราว"
                                        : "เปิดใช้งานบัญชี"
                                    }
                                    className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                                      isActive
                                        ? "border-amber-200/70 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                        : "border-emerald-200/70 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    }`}
                                  >
                                    {isActive ? (
                                      <>
                                        <Ban className="h-3 w-3" />
                                        ระงับ
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-3 w-3" />
                                        เปิดใช้
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeletingUser(
                                        user,
                                      )
                                    }
                                    title="ลบบัญชีผู้ใช้นี้"
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200/70 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 transition hover:scale-[1.02] hover:bg-rose-100"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    ลบ
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
              {visibleUsers.length >
                0 && (
                <div className="m-4 mt-0 flex flex-col justify-between gap-3 border-t border-slate-100 px-2 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center">
                  <div className="text-[11px] text-slate-500">
                    แสดง{" "}
                    <span className="font-semibold text-slate-800">
                      {startIndex} -{" "}
                      {endIndex}
                    </span>{" "}
                    จากทั้งหมด{" "}
                    <span className="font-semibold text-slate-800">
                      {
                        visibleUsers.length
                      }
                    </span>{" "}
                    รายชื่อ
                    {totalPages >
                      1 && (
                      <span className="ml-1 text-slate-400">
                        (หน้า{" "}
                        <span className="font-semibold text-[#1b5e4a]">
                          {
                            safeCurrentPage
                          }
                        </span>{" "}
                        / {totalPages})
                      </span>
                    )}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            (current) =>
                              Math.max(
                                current -
                                  1,
                                1,
                              ),
                          )
                        }
                        disabled={
                          safeCurrentPage ===
                          1
                        }
                        title="หน้าก่อนหน้า"
                        className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from(
                          {
                            length:
                              totalPages,
                          },
                          (_, index) =>
                            index + 1,
                        ).map(
                          (
                            pageNumber,
                          ) => (
                            <button
                              key={
                                pageNumber
                              }
                              type="button"
                              onClick={() =>
                                setCurrentPage(
                                  pageNumber,
                                )
                              }
                              className={`h-8 min-w-8 cursor-pointer rounded-lg px-2 text-xs font-semibold transition ${
                                safeCurrentPage ===
                                pageNumber
                                  ? "bg-[#1b5e4a] text-white shadow-xs"
                                  : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
                              }`}
                            >
                              {
                                pageNumber
                              }
                            </button>
                          ),
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            (current) =>
                              Math.min(
                                current +
                                  1,
                                totalPages,
                              ),
                          )
                        }
                        disabled={
                          safeCurrentPage ===
                          totalPages
                        }
                        title="หน้าถัดไป"
                        className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <form
                        onSubmit={
                          handlePageInputSubmit
                        }
                        className="ml-2 flex items-center gap-1.5 border-l border-slate-200 pl-2"
                      >
                        <span className="text-[11px] text-slate-500">
                          ไปที่หน้า:
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={
                            totalPages
                          }
                          value={
                            pageInput
                          }
                          onChange={
                            handlePageInputChange
                          }
                          placeholder={String(
                            safeCurrentPage,
                          )}
                          className="w-12 rounded-lg border border-slate-200 bg-[#f8faf9] px-1.5 py-1 text-center text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                        <span className="text-[11px] text-slate-400">
                          / {totalPages}
                        </span>
                        <button
                          type="submit"
                          className="cursor-pointer rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-[#1b5e4a] hover:text-white"
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
      {/* Modal ระงับ / เปิดบัญชี */}
      {pendingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
          onClick={() =>
            setPendingUser(null)
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-confirm-title"
            className="relative w-full max-w-md rounded-3xl bg-white px-6 py-8 text-center shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              aria-label="ปิด"
              onClick={() =>
                setPendingUser(null)
              }
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
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {isSuspending
                ? "คุณต้องการระงับบัญชีผู้ใช้นี้หรือไม่? ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะเปิดใช้งานอีกครั้ง"
                : "คุณต้องการเปิดใช้งานบัญชีผู้ใช้นี้อีกครั้งหรือไม่? ผู้ใช้จะสามารถเข้าสู่ระบบได้ตามปกติ"}
            </p>
            <span className="mt-4 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
              <span
                className="notranslate"
                data-user-content="true"
              >
                {pendingUser.name}
              </span>
              <span className="ml-1">
                ({maskEmail(pendingUser.email)})
              </span>
            </span>
            <div className="mt-7 flex justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setPendingUser(null)
                }
                className="min-w-28 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={
                  confirmStatusChange
                }
                className={`min-w-28 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition ${
                  isSuspending
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSuspending
                  ? "ยืนยันการระงับ"
                  : "ยืนยันเปิดใช้งาน"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal ลบบัญชี */}
      {deletingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
          onClick={() =>
            setDeletingUser(null)
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-3xl bg-white px-6 py-8 text-center shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              aria-label="ปิด"
              onClick={() =>
                setDeletingUser(null)
              }
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
            <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
              คุณต้องการลบบัญชีของ{" "}
              <strong
                className="notranslate"
                data-user-content="true"
              >
                {deletingUser.name}
              </strong>{" "}
              หรือไม่? บัญชีนี้จะถูกย้ายไปยังถังขยะและสามารถกู้คืนได้ภายหลัง
            </p>
            <div className="mt-4 space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs">
              <p
                className="notranslate font-semibold text-slate-700"
                data-user-content="true"
              >
                {deletingUser.name}
              </p>
              <p className="font-mono text-[11px] text-slate-400">
                {maskEmail(deletingUser.email)}
              </p>
              <p className="text-[11px] text-slate-400">
                เบอร์โทร:{" "}
                {maskPhone(deletingUser.phone)}
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeletingUser(null)
                }
                className="min-w-28 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={
                  confirmDeleteUser
                }
                className="min-w-28 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700"
              >
                ยืนยันการลบบัญชี
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal ประวัติแจ้งปัญหา */}
      {viewingReportsUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
          onClick={() =>
            setViewingReportsUser(
              null,
            )
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
                  {getInitials(
                    viewingReportsUser.name,
                  )}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">
                      ประวัติการแจ้งปัญหา:{" "}
                      <span
                        className="notranslate"
                        data-user-content="true"
                      >
                        {
                          viewingReportsUser.name
                        }
                      </span>
                    </h3>
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {
                        getIssuesForUser(
                          viewingReportsUser,
                        ).length
                      }{" "}
                      เรื่อง
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-400">
                    {
                      maskEmail(viewingReportsUser.email)
                    }{" "}
                    · โทร{" "}
                    {
                      maskPhone(viewingReportsUser.phone)
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="ปิด"
                onClick={() =>
                  setViewingReportsUser(
                    null,
                  )
                }
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto py-4 pr-1">
              {getIssuesForUser(
                viewingReportsUser,
              ).length === 0 ? (
                <div className="space-y-2 py-12 text-center text-slate-400">
                  <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">
                    ผู้ใช้งานท่านนี้ยังไม่มีประวัติการส่งเรื่องร้องเรียน
                  </p>
                  <p className="text-xs text-slate-400">
                    เมื่อผู้ใช้แจ้งปัญหาผ่านระบบ รายละเอียดจะปรากฏที่นี่
                  </p>
                </div>
              ) : (
                getIssuesForUser(
                  viewingReportsUser,
                ).map((issue) => (
                  <div
                    key={issue.id}
                    className="space-y-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 transition hover:bg-white hover:shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-[#154c3c]">
                          #{issue.id}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          <Tag className="h-3 w-3 shrink-0 text-emerald-600" />
                          {issue.category}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {issue.date}
                        </span>
                      </div>
                      <IssueStatusBadge
                        status={
                          issue.status
                        }
                      />
                    </div>
                    <p className="text-xs font-medium leading-relaxed text-slate-700">
                      {issue.description}
                    </p>
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-1 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                        {issue.area}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ผู้ดูแล:{" "}
                        {issue.adminName}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() =>
                  setViewingReportsUser(
                    null,
                  )
                }
                className="rounded-xl bg-slate-100 px-5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
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
function IssueStatusBadge({
  status,
}: {
  status: IssueItem["status"];
}) {
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
        <RotateCw className="h-3 w-3 animate-spin" />
        กำลังดำเนินการ
      </span>
    );
  }
  if (status === "resolved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        แก้ไขสำเร็จ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
      <Clock className="h-3 w-3" />
      รอรับเรื่อง
    </span>
  );
}
interface SummaryCardProps {
  active: boolean;
  label: string;
  count: number;
  icon: ReactNode;
  iconClass: string;
  onClick: () => void;
}
function SummaryCard({
  active,
  label,
  count,
  icon,
  iconClass,
  onClick,
}: SummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
        active
          ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-100"
          : "border-slate-200"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconClass}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-slate-500">
          {label}
        </span>
        <span className="mt-1 block text-2xl font-extrabold text-slate-800 sm:text-3xl">
          {count}
        </span>
      </span>
      <ChevronRight className="hidden h-4 w-4 shrink-0 text-slate-300 sm:block" />
    </button>
  );
}
