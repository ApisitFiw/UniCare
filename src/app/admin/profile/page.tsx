"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { upsertProfileInSupabase, fetchProfileByEmailFromSupabase } from "@/lib/supabaseService";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Building,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  MapPin,
  Pencil,
  Save,
  ShieldCheck,
  Trash2,
  User,
  X,
  Camera,
  Upload,
} from "lucide-react";

import Header from "@/components/Header";
import { ADMIN_ACCOUNTS, getDemoSession, updateDemoSession } from "@/lib/authService";

type Gender = "" | "male" | "female" | "other" | "not-specified";
type LocationType = "" | "inside-campus" | "outside-campus";

type AdminProfile = {
  avatar?: string;
  prefix: string;
  firstName: string;
  lastName: string;
  nickname: string;
  gender: Gender;
  username: string;

  phone: string;
  birthDate: string;
  department: string;
  position: string;

  locationType: LocationType;
  building: string;
  floor: string;
  roomNumber: string;

  addressLine: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;

  notifyNewReports: boolean;
  notifyUrgentReports: boolean;
  notifySystemUpdates: boolean;
  showNameOnActions: boolean;
};

type SessionData = {
  name?: string;
  email?: string;
  username?: string;
  role?: "user" | "admin";
  avatar?: string;
};

type AlertState = {
  type: "success" | "warning" | "error";
  title: string;
  message: string;
} | null;

const SESSION_KEY = "unicare_demo_session";
const ADMIN_PROFILE_KEY_PREFIX = "unicare_demo_admin_profile";
const USERS_KEY = "unicare_demo_system_users";

const emptyAdminProfile: AdminProfile = {
  prefix: "",
  firstName: "",
  lastName: "",
  nickname: "",
  gender: "",
  username: "",

  phone: "",
  birthDate: "",
  department: "งานศูนย์บริการและประสานงาน (UniCare Admin)",
  position: "ผู้ดูแลระบบ",

  locationType: "inside-campus",
  building: "อาคารบริหาร / ศูนย์เทคโนโลยีดิจิทัล",
  floor: "2",
  roomNumber: "201",

  addressLine: "",
  subdistrict: "",
  district: "",
  province: "",
  postalCode: "",

  notifyNewReports: true,
  notifyUrgentReports: true,
  notifySystemUpdates: false,
  showNameOnActions: true,
};

function getFullName(profile: AdminProfile) {
  const prefix = profile.prefix.trim();
  const firstName = profile.firstName.trim();
  const lastName = profile.lastName.trim();

  return `${prefix}${firstName} ${lastName}`.trim();
}

function getAdminStorageKey(session: SessionData) {
  const identity =
    session.email?.trim().toLowerCase() ||
    session.username?.trim().toLowerCase() ||
    session.name?.trim().toLowerCase() ||
    "unknown-admin";

  return `${ADMIN_PROFILE_KEY_PREFIX}:${identity}`;
}

function parseName(fullName: string) {
  const clean = fullName.trim();
  let prefix = "";
  let nameWithoutPrefix = clean;

  const knownPrefixes = [
    "นาย",
    "นางสาว",
    "นาง",
    "ดร.",
    "อาจารย์ ดร.",
    "อาจารย์",
    "ผศ.ดร.",
    "ผศ.",
    "รศ.ดร.",
    "รศ.",
    "ศ.ดร.",
    "ศ.",
  ];

  for (const p of knownPrefixes) {
    if (clean.startsWith(p)) {
      prefix = p;
      nameWithoutPrefix = clean.slice(p.length).trim();
      break;
    }
  }

  const parts = nameWithoutPrefix.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || clean;
  const lastName = parts.slice(1).join(" ");

  return { prefix, firstName, lastName };
}

function createProfileFromSession(session: SessionData): AdminProfile {
  const displayName = session.name?.trim() || "";
  const { prefix, firstName, lastName } = parseName(displayName);

  const username =
    session.username?.trim() ||
    session.email?.split("@")[0]?.trim() ||
    firstName.toLowerCase();

  // Find in ADMIN_ACCOUNTS or USERS_KEY for phone
  let phone = "089-876-5432";
  const matchedAccount = ADMIN_ACCOUNTS.find(
    (a) =>
      (session.email && a.email.toLowerCase() === session.email.toLowerCase()) ||
      (session.name && a.name === session.name),
  );
  if (matchedAccount?.phone) {
    phone = matchedAccount.phone;
  }

  return {
    ...emptyAdminProfile,
    prefix,
    firstName,
    lastName,
    username,
    phone,
  };
}

function readStoredProfile(key: string): AdminProfile | null {
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return null;

    return {
      ...emptyAdminProfile,
      ...(parsed as Partial<AdminProfile>),
    };
  } catch {
    return null;
  }
}

function updateAccountSession(
  session: SessionData,
  profile: AdminProfile,
) {
  const updatedSession: SessionData = {
    ...session,
    name: getFullName(profile),
    username: profile.username,
    avatar: profile.avatar,
  };

  window.sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify(updatedSession),
  );

  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(updatedSession),
  );

  window.dispatchEvent(
    new Event("unicare-profile-updated"),
  );
  window.dispatchEvent(
    new Event("storage"),
  );
}

export default function AdminProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<AdminProfile>(emptyAdminProfile);
  const [draft, setDraft] = useState<AdminProfile>(emptyAdminProfile);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [visible, setVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  useEffect(() => {
    const session = getDemoSession() as SessionData | null;

    if (!session) {
      setIsLoading(false);
      router.replace("/login");
      return;
    }

    if (session.role === "user") {
      setIsLoading(false);
      router.replace("/user/profile");
      return;
    }

    setCurrentSession(session);

    const storageKey = getAdminStorageKey(session);
    const storedProfile = readStoredProfile(storageKey);

    let loadedProfile = storedProfile || createProfileFromSession(session);

    setProfile(loadedProfile);
    setDraft(loadedProfile);

    // Fetch latest profile and avatar directly from Supabase
    if (session.email) {
      fetchProfileByEmailFromSupabase(session.email).then((remoteProfile) => {
        if (remoteProfile) {
          let meta: any = {};
          if (remoteProfile.department && remoteProfile.department.startsWith("{")) {
            try {
              meta = JSON.parse(remoteProfile.department);
            } catch {}
          }

          const fullNameStr = remoteProfile.full_name || "";
          let pPrefix = meta.prefix || "";
          let nameWithoutPrefix = fullNameStr;
          if (!pPrefix) {
            if (fullNameStr.startsWith("นางสาว")) {
              pPrefix = "นางสาว";
              nameWithoutPrefix = fullNameStr.slice("นางสาว".length).trim();
            } else if (fullNameStr.startsWith("นาย")) {
              pPrefix = "นาย";
              nameWithoutPrefix = fullNameStr.slice("นาย".length).trim();
            } else if (fullNameStr.startsWith("นาง")) {
              pPrefix = "นาง";
              nameWithoutPrefix = fullNameStr.slice("นาง".length).trim();
            }
          }
          const parts = nameWithoutPrefix.split(/\s+/).filter(Boolean);
          const pFirst = meta.firstName || parts[0] || "";
          const pLast = meta.lastName || parts.slice(1).join(" ") || "";

          const mergedProfile: AdminProfile = {
            ...loadedProfile,
            avatar: remoteProfile.avatar_url || loadedProfile.avatar || undefined,
            prefix: pPrefix || loadedProfile.prefix,
            firstName: pFirst || loadedProfile.firstName,
            lastName: pLast || loadedProfile.lastName,
            nickname: meta.nickname || loadedProfile.nickname,
            gender: meta.gender || loadedProfile.gender,
            username: meta.username || loadedProfile.username || session.email?.split("@")[0] || "",
            phone: meta.phone || loadedProfile.phone,
            birthDate: meta.birthDate || loadedProfile.birthDate,
            department: meta.department || (!remoteProfile.department?.startsWith("{") ? remoteProfile.department : undefined) || loadedProfile.department,
            position: meta.position || loadedProfile.position,
            locationType: meta.locationType || loadedProfile.locationType,
            building: meta.building || loadedProfile.building,
            floor: meta.floor || loadedProfile.floor,
            roomNumber: meta.roomNumber || loadedProfile.roomNumber,
            addressLine: meta.addressLine || loadedProfile.addressLine,
            subdistrict: meta.subdistrict || loadedProfile.subdistrict,
            district: meta.district || loadedProfile.district,
            province: meta.province || loadedProfile.province,
            postalCode: meta.postalCode || loadedProfile.postalCode,
            notifyNewReports: meta.notifyNewReports ?? loadedProfile.notifyNewReports,
            notifyUrgentReports: meta.notifyUrgentReports ?? loadedProfile.notifyUrgentReports,
            notifySystemUpdates: meta.notifySystemUpdates ?? loadedProfile.notifySystemUpdates,
            showNameOnActions: meta.showNameOnActions ?? loadedProfile.showNameOnActions,
          };

          setProfile(mergedProfile);
          setDraft(mergedProfile);
          updateAccountSession(session, mergedProfile);
        }
        setIsLoading(false);
      }).catch((err) => {
        console.warn("fetchProfileByEmailFromSupabase error:", err);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const fullName = useMemo(() => getFullName(profile), [profile]);

  const initials = useMemo(() => {
    if (profile.firstName || profile.lastName) {
      return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`;
    }
    return "AD";
  }, [profile.firstName, profile.lastName]);

  function startEditing() {
    setDraft(profile);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(profile);
    setIsEditing(false);
  }

  function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAlert({
        type: "warning",
        title: "ไฟล์ไม่ถูกต้อง",
        message: "กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WEBP)",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAlert({
        type: "warning",
        title: "ขนาดไฟล์ใหญ่เกินไป",
        message: "กรุณาเลือกรูปภาพขนาดไม่เกิน 5 MB",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setDraft((prev) => ({ ...prev, avatar: result }));
      }
    };
    reader.readAsDataURL(file);
  }

  function removeAvatar() {
    setDraft((prev) => ({ ...prev, avatar: undefined }));
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentSession) {
      setAlert({
        type: "error",
        title: "ไม่พบบัญชีผู้ใช้งาน",
        message: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
      });
      return;
    }

    const cleanedProfile: AdminProfile = {
      ...draft,
      prefix: draft.prefix.trim(),
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      nickname: draft.nickname.trim(),
      username: draft.username.trim().toLowerCase(),
      phone: draft.phone.replace(/\D/g, "").slice(0, 10),
      birthDate: draft.birthDate.trim(),
      department: draft.department.trim(),
      position: draft.position.trim(),
      building: draft.building.trim(),
      floor: draft.floor.trim(),
      roomNumber: draft.roomNumber.trim(),
      addressLine: draft.addressLine.trim(),
      subdistrict: draft.subdistrict.trim(),
      district: draft.district.trim(),
      province: draft.province.trim(),
      postalCode: draft.postalCode.trim(),
    };

    if (!cleanedProfile.firstName) {
      setAlert({
        type: "warning",
        title: "ข้อมูลไม่ครบ",
        message: "กรุณากรอกชื่อจริงของผู้ดูแลระบบ",
      });
      return;
    }

    if (cleanedProfile.phone && !/^\d{9,10}$/.test(cleanedProfile.phone)) {
      setAlert({
        type: "warning",
        title: "เบอร์โทรศัพท์ไม่ถูกต้อง",
        message: "กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลข 9–10 หลัก",
      });
      return;
    }

    if (
      cleanedProfile.locationType === "outside-campus" &&
      cleanedProfile.postalCode &&
      !/^\d{5}$/.test(cleanedProfile.postalCode)
    ) {
      setAlert({
        type: "warning",
        title: "รหัสไปรษณีย์ไม่ถูกต้อง",
        message: "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก",
      });
      return;
    }

    const storageKey = getAdminStorageKey(currentSession);
    window.localStorage.setItem(storageKey, JSON.stringify(cleanedProfile));

    // Update global unicare_demo_admin_profile for backward compatibility
    const legacyData = {
      fullName: getFullName(cleanedProfile) || cleanedProfile.firstName,
      email: currentSession.email || "admin@unicare.local",
      phone: cleanedProfile.phone,
      avatar: cleanedProfile.avatar,
    };
    window.localStorage.setItem("unicare_demo_admin_profile", JSON.stringify(legacyData));

    // Update session
    const effectiveName = getFullName(cleanedProfile) || cleanedProfile.firstName;
    const updatedSession = {
      ...currentSession,
      name: effectiveName,
      username: cleanedProfile.username,
      avatar: cleanedProfile.avatar,
    };
    setCurrentSession(updatedSession);
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));

    // Synchronize with unicare_demo_system_users
    try {
      const savedUsers = window.localStorage.getItem(USERS_KEY);
      let systemUsers = savedUsers ? JSON.parse(savedUsers) : [];
      if (Array.isArray(systemUsers)) {
        const targetEmail = (currentSession.email || "").toLowerCase();
        let found = false;

        systemUsers = systemUsers.map((u: any) => {
          const isTarget =
            u.role === "admin" &&
            ((u.email && u.email.toLowerCase() === targetEmail) ||
              u.name === currentSession.name);

          if (isTarget) {
            found = true;
            return {
              ...u,
              name: effectiveName,
              phone: cleanedProfile.phone,
              department: cleanedProfile.department,
              avatar: cleanedProfile.avatar,
            };
          }
          return u;
        });

        if (!found && targetEmail) {
          systemUsers.unshift({
            id: Date.now(),
            name: effectiveName,
            email: currentSession.email,
            phone: cleanedProfile.phone,
            avatar: cleanedProfile.avatar,
            status: "active",
            role: "admin",
          });
        }
        window.localStorage.setItem(USERS_KEY, JSON.stringify(systemUsers));
      }
    } catch {
      // ignore
    }

    setProfile(cleanedProfile);
    setDraft(cleanedProfile);
    // Sync profile to Supabase
    if (currentSession.email) {
      upsertProfileInSupabase({
        email: currentSession.email,
        full_name: effectiveName,
        role: "admin",
        avatar_url: cleanedProfile.avatar || null,
        department: JSON.stringify({
          phone: cleanedProfile.phone,
          department: cleanedProfile.department,
          position: cleanedProfile.position,
          password: "Admin1234!",
          status: "active",
          prefix: cleanedProfile.prefix,
          firstName: cleanedProfile.firstName,
          lastName: cleanedProfile.lastName,
          nickname: cleanedProfile.nickname,
          gender: cleanedProfile.gender,
          birthDate: cleanedProfile.birthDate,
          locationType: cleanedProfile.locationType,
          building: cleanedProfile.building,
          floor: cleanedProfile.floor,
          roomNumber: cleanedProfile.roomNumber,
          addressLine: cleanedProfile.addressLine,
          subdistrict: cleanedProfile.subdistrict,
          district: cleanedProfile.district,
          province: cleanedProfile.province,
          postalCode: cleanedProfile.postalCode,
          username: cleanedProfile.username,
        }),
      }).catch((err) => console.warn("Supabase admin profile sync failed:", err));
    }

    window.dispatchEvent(new Event("unicare-profile-updated"));
    window.dispatchEvent(new Event("unicare-demo-users-updated"));

    setAlert({
      type: "success",
      title: "บันทึกสำเร็จ",
      message: "ข้อมูลส่วนตัวผู้ดูแลระบบ ข้อมูลการติดต่อ รูปโปรไฟล์ และหน่วยงานได้รับการอัปเดตแล้ว",
    });
  }

  function closePasswordModal() {
    setPasswordOpen(false);
    setPasswords({ current: "", next: "", confirm: "" });
    setVisible({ current: false, next: false, confirm: false });
  }

  function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setAlert({
        type: "warning",
        title: "ข้อมูลไม่ครบ",
        message: "กรุณากรอกรหัสผ่านให้ครบทุกช่อง",
      });
      return;
    }

    if (passwords.next.length < 6) {
      setAlert({
        type: "warning",
        title: "รหัสผ่านสั้นเกินไป",
        message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร",
      });
      return;
    }

    if (passwords.next === passwords.current) {
      setAlert({
        type: "warning",
        title: "กรุณาใช้รหัสผ่านใหม่",
        message: "รหัสผ่านใหม่ไม่ควรเหมือนรหัสผ่านปัจจุบัน",
      });
      return;
    }

    if (passwords.next !== passwords.confirm) {
      setAlert({
        type: "error",
        title: "รหัสผ่านไม่ตรงกัน",
        message: "กรุณายืนยันรหัสผ่านใหม่อีกครั้ง",
      });
      return;
    }

    closePasswordModal();
    setAlert({
      type: "success",
      title: "เปลี่ยนรหัสผ่านสำเร็จ",
      message: "บันทึกรหัสผ่านใหม่ในระบบทดลองเรียบร้อยแล้ว",
    });
  }

  function deleteAccount() {
    if (currentSession) {
      const storageKey = getAdminStorageKey(currentSession);
      window.localStorage.removeItem(storageKey);

      try {
        const savedUsers = window.localStorage.getItem(USERS_KEY);
        let systemUsers = savedUsers ? JSON.parse(savedUsers) : [];
        if (Array.isArray(systemUsers)) {
          const targetEmail = (currentSession.email || "").toLowerCase();
          systemUsers = systemUsers.filter(
            (u: any) => u.email?.toLowerCase() !== targetEmail,
          );
          window.localStorage.setItem(USERS_KEY, JSON.stringify(systemUsers));
        }
      } catch {
        // ignore
      }
    }

    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem("unicare_demo_admin_profile");

    window.dispatchEvent(new Event("unicare-profile-updated"));
    window.dispatchEvent(new Event("unicare-demo-users-updated"));

    router.replace("/login");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f7f5]">
        <Header
          title="บัญชีของฉัน"
          subtitle="กำลังโหลดข้อมูลบัญชีผู้ดูแลระบบ"
          role="ADMIN"
        />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
            <p className="mt-4 text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-800">
      <Header
        title="บัญชีของฉัน"
        subtitle="จัดการข้อมูลส่วนตัว สังกัดหน่วยงาน และความปลอดภัย"
        userName={fullName || currentSession?.name}
        role="ADMIN"
      />

      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <form onSubmit={saveProfile} className="space-y-5">
          {/* ข้อมูลผู้ใช้งาน */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionTitle
              icon={<User className="h-5 w-5" />}
              title="ข้อมูลผู้ดูแลระบบ"
              subtitle="ข้อมูลจากบัญชีและสังกัดการทำงาน"
              action={
                !isEditing ? (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="flex items-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <Pencil className="h-4 w-4" />
                    แก้ไข
                  </button>
                ) : null
              }
            />

            <div className="grid md:grid-cols-[260px_minmax(0,1fr)]">
              {/* ข้อมูลสรุปฝั่งซ้าย */}
              <div className="flex flex-col items-center border-b border-slate-100 bg-slate-50/60 px-6 py-8 text-center md:border-b-0 md:border-r">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-emerald-100 text-2xl font-bold text-emerald-800 shadow-sm border-2 border-emerald-300 flex items-center justify-center">
                    {(isEditing ? draft.avatar : profile.avatar) ? (
                      <img
                        src={isEditing ? draft.avatar : profile.avatar}
                        alt="Admin Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  {isEditing && (
                    <label
                      htmlFor="admin-avatar-file"
                      className="absolute bottom-0 right-0 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-md cursor-pointer transition transform hover:scale-110"
                      title="เปลี่ยนรูปโปรไฟล์"
                    >
                      <Camera className="w-4 h-4" />
                      <input
                        id="admin-avatar-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-3 flex flex-col items-center gap-1.5 w-full px-2">
                    <label
                      htmlFor="admin-avatar-file-btn"
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl cursor-pointer transition inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>อัปโหลดรูปภาพ</span>
                      <input
                        id="admin-avatar-file-btn"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                    {draft.avatar && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline transition"
                      >
                        ลบรูปโปรไฟล์
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition"
                  >
                    เปลี่ยนรูปโปรไฟล์
                  </button>
                )}

                <h3 className="mt-4 font-bold text-slate-800 notranslate" data-user-content="true">
                  {fullName || currentSession?.name || "ผู้ดูแลระบบ"}
                </h3>

                <p className="mt-1 text-xs text-slate-400 notranslate" data-user-content="true">
                  {profile.username ? `@${profile.username}` : currentSession?.email}
                </p>

                {profile.nickname && (
                  <p className="mt-1 text-xs text-slate-500">
                    ชื่อเล่น: <span className="notranslate" data-user-content="true">{profile.nickname}</span>
                  </p>
                )}

                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  ผู้ดูแลระบบ (Admin)
                </span>
              </div>

              {/* แบบฟอร์มฝั่งขวา */}
              <div className="space-y-5 p-5 sm:p-7">
                <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)]">
                  <SelectField
                    label="คำนำหน้าชื่อ"
                    value={draft.prefix}
                    disabled={!isEditing}
                    onChange={(value) => setDraft({ ...draft, prefix: value })}
                    options={[
                      ["", "เลือก"],
                      ["นาย", "นาย"],
                      ["นาง", "นาง"],
                      ["นางสาว", "นางสาว"],
                      ["ดร.", "ดร."],
                      ["อาจารย์ ดร.", "อาจารย์ ดร."],
                      ["อาจารย์", "อาจารย์"],
                      ["ผศ.", "ผศ."],
                      ["ผศ.ดร.", "ผศ.ดร."],
                      ["รศ.", "รศ."],
                      ["อื่น ๆ", "อื่น ๆ"],
                    ]}
                  />

                  <ProfileField
                    label="ชื่อ"
                    value={draft.firstName}
                    disabled={!isEditing}
                    onChange={(value) => setDraft({ ...draft, firstName: value })}
                  />

                  <ProfileField
                    label="นามสกุล"
                    value={draft.lastName}
                    disabled={!isEditing}
                    onChange={(value) => setDraft({ ...draft, lastName: value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField
                    label="ชื่อเล่น (ไม่บังคับ)"
                    value={draft.nickname}
                    disabled={!isEditing}
                    onChange={(value) => setDraft({ ...draft, nickname: value })}
                  />

                  <SelectField
                    label="เพศ (ไม่บังคับ)"
                    value={draft.gender}
                    disabled={!isEditing}
                    onChange={(value) => setDraft({ ...draft, gender: value as Gender })}
                    options={[
                      ["", "ไม่ระบุ"],
                      ["male", "ชาย"],
                      ["female", "หญิง"],
                      ["other", "อื่น ๆ"],
                      ["not-specified", "ไม่ต้องการระบุ"],
                    ]}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField
                    label="ตำแหน่ง / หน้าที่"
                    value={draft.position}
                    disabled={!isEditing}
                    placeholder="เช่น ผู้ดูแลระบบทั่วไป, เจ้าหน้าที่ประจำศูนย์"
                    onChange={(value) => setDraft({ ...draft, position: value })}
                  />

                  <ProfileField
                    label="หน่วยงาน / สังกัด"
                    value={draft.department}
                    disabled={!isEditing}
                    placeholder="เช่น ส่วนบริการกลาง, งานอาคารสถานที่"
                    onChange={(value) => setDraft({ ...draft, department: value })}
                  />
                </div>

                {/* ข้อมูลติดต่อ */}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-emerald-900">
                      ข้อมูลการติดต่อและข้อมูลส่วนตัว
                    </h4>
                    <p className="mt-1 text-[11px] text-emerald-700/70">
                      อีเมลเชื่อมกับบัญชีผู้ดูแลระบบ ส่วนเบอร์โทรศัพท์สามารถแก้ไขได้
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <ProfileField
                      label="อีเมล"
                      value={currentSession?.email || ""}
                      disabled
                      type="email"
                      onChange={() => undefined}
                      helper="เชื่อมกับบัญชีที่เข้าสู่ระบบ"
                    />

                    <ProfileField
                      label="เบอร์โทรศัพท์ (ไม่บังคับ)"
                      value={draft.phone}
                      disabled={!isEditing}
                      type="tel"
                      inputMode="numeric"
                      placeholder="เช่น 0898765432"
                      maxLength={10}
                      onChange={(value) =>
                        setDraft({
                          ...draft,
                          phone: value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                    />

                    <ProfileField
                      label="วันเกิด (ไม่บังคับ)"
                      value={draft.birthDate}
                      disabled={!isEditing}
                      type="date"
                      onChange={(value) => setDraft({ ...draft, birthDate: value })}
                    />
                  </div>
                </div>

                <ProfileField
                  label="ชื่อผู้ใช้งาน"
                  value={draft.username}
                  disabled
                  onChange={() => undefined}
                  helper="สร้างจากบัญชีที่เข้าสู่ระบบ"
                />
              </div>
            </div>
          </section>

          {/* ข้อมูลที่ทำงาน / ที่อยู่ */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionTitle
              icon={<Building className="h-5 w-5" />}
              title="ข้อมูลที่ทำงานและที่อยู่"
              subtitle="ข้อมูลสถานที่ปฏิบัติงานภายในมหาวิทยาลัยหรือที่พัก"
            />

            <div className="p-5 sm:p-7">
              <AdminLocationSection
                draft={draft}
                disabled={!isEditing}
                onChange={setDraft}
              />
            </div>
          </section>

          {/* การแจ้งเตือน */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionTitle
              icon={<Bell className="h-5 w-5" />}
              title="การแจ้งเตือนสำหรับผู้ดูแลระบบ"
              subtitle="กำหนดการแจ้งเตือนเกี่ยวกับคำร้องและกิจกรรมในระบบ"
            />

            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
              <ToggleSetting
                title="แจ้งเตือนคำร้องใหม่"
                description="รับการแจ้งเตือนทันทีเมื่อมีผู้ใช้งานแจ้งปัญหาเข้ามาใหม่"
                checked={draft.notifyNewReports}
                disabled={!isEditing}
                onChange={(checked) =>
                  setDraft({ ...draft, notifyNewReports: checked })
                }
              />

              <ToggleSetting
                title="แจ้งเตือนกรณีเร่งด่วน / ฉุกเฉิน"
                description="เน้นแจ้งเตือนเป็นพิเศษสำหรับคำร้องระดับเร่งด่วนมาก"
                checked={draft.notifyUrgentReports}
                disabled={!isEditing}
                onChange={(checked) =>
                  setDraft({ ...draft, notifyUrgentReports: checked })
                }
              />

              <ToggleSetting
                title="ข่าวสารและการอัปเดตระบบ"
                description="รับการแจ้งเตือนเมื่อมีการอัปเดตเวอร์ชันและระบบ UniCare"
                checked={draft.notifySystemUpdates}
                disabled={!isEditing}
                onChange={(checked) =>
                  setDraft({ ...draft, notifySystemUpdates: checked })
                }
              />

              <ToggleSetting
                title="แสดงชื่อในการรับเรื่องและตอบกลับ"
                description="ระบุชื่อเจ้าหน้าที่เมื่อมีการเปลี่ยนสถานะคำร้อง"
                checked={draft.showNameOnActions}
                disabled={!isEditing}
                onChange={(checked) =>
                  setDraft({ ...draft, showNameOnActions: checked })
                }
              />
            </div>
          </section>

          {/* ความเป็นส่วนตัวและความปลอดภัย */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionTitle
              icon={<ShieldCheck className="h-5 w-5" />}
              title="ความปลอดภัย"
              subtitle="จัดการรหัสผ่านและความปลอดภัยของบัญชีผู้ดูแลระบบ"
            />

            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div>
                <h3 className="text-sm font-bold text-slate-800">รหัสผ่าน</h3>
                <p className="mt-1 text-xs text-slate-500">
                  อัปเดตรหัสผ่านสำหรับเข้าใช้งานระบบ แนะนำให้เปลี่ยนรหัสผ่านเป็นระยะ
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPasswordOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                <KeyRound className="h-4 w-4" />
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </section>

          {/* ลบบัญชีผู้ดูแลระบบ */}
          <section className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50/50 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <Trash2 className="h-5 w-5" />
              </span>

              <div>
                <h2 className="font-bold text-rose-900">ลบบัญชีผู้ดูแลระบบ</h2>
                <p className="text-xs text-rose-600">
                  ลบข้อมูลโปรไฟล์ผู้ดูแลระบบออกจากระบบทดลอง
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  ต้องการลบบัญชี <span className="notranslate" data-user-content="true">{fullName || currentSession?.name || "ผู้ดูแลระบบ"}</span> หรือไม่?
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  เมื่อลบบัญชี ระบบจะนำคุณออกจากระบบทันที
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="rounded-lg bg-rose-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700"
              >
                ลบบัญชีของฉัน
              </button>
            </div>
          </section>

          {/* Sticky Action Bar */}
          {isEditing && (
            <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                กรุณาตรวจสอบข้อมูลก่อนบันทึกการเปลี่ยนแปลง
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4" />
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </div>
          )}
        </form>
      </main>

      {/* Modal เปลี่ยนรหัสผ่าน */}
      {passwordOpen && (
        <Modal onClose={closePasswordModal}>
          <div className="flex items-center justify-between border-b p-6">
            <div>
              <h2 className="font-bold">เปลี่ยนรหัสผ่าน</h2>
              <p className="mt-1 text-xs text-slate-400">
                กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่
              </p>
            </div>

            <button
              type="button"
              onClick={closePasswordModal}
              className="rounded-full bg-slate-100 p-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={changePassword} className="space-y-4 p-6">
            <PasswordField
              label="รหัสผ่านปัจจุบัน"
              value={passwords.current}
              visible={visible.current}
              onChange={(value) =>
                setPasswords({ ...passwords, current: value })
              }
              onToggle={() =>
                setVisible({ ...visible, current: !visible.current })
              }
            />

            <PasswordField
              label="รหัสผ่านใหม่"
              value={passwords.next}
              visible={visible.next}
              onChange={(value) =>
                setPasswords({ ...passwords, next: value })
              }
              onToggle={() =>
                setVisible({ ...visible, next: !visible.next })
              }
            />

            <PasswordField
              label="ยืนยันรหัสผ่านใหม่"
              value={passwords.confirm}
              visible={visible.confirm}
              onChange={(value) =>
                setPasswords({ ...passwords, confirm: value })
              }
              onToggle={() =>
                setVisible({ ...visible, confirm: !visible.confirm })
              }
            />

            <div className="flex justify-end gap-3 border-t pt-5">
              <button
                type="button"
                onClick={closePasswordModal}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-xs font-bold"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white"
              >
                บันทึกรหัสผ่านใหม่
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal ลบบัญชี */}
      {deleteOpen && (
        <Modal onClose={() => setDeleteOpen(false)}>
          <div className="p-7 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-rose-600" />
            <h2 className="mt-4 font-bold">ยืนยันการลบบัญชีผู้ดูแลระบบ?</h2>
            <p className="mt-2 text-xs text-slate-500">
              ข้อมูลโปรไฟล์จะถูกลบ และคุณจะออกจากระบบทันที
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-lg bg-slate-100 p-3 text-sm font-bold"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={deleteAccount}
                className="rounded-lg bg-rose-600 p-3 text-sm font-bold text-white"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal แจ้งผล */}
      {alert && (
        <Modal onClose={() => setAlert(null)}>
          <div className="p-7 text-center">
            <span
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                alert.type === "success"
                  ? "bg-emerald-100 text-emerald-700"
                  : alert.type === "warning"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
              }`}
            >
              {alert.type === "success" ? (
                <Check className="h-7 w-7" />
              ) : (
                <AlertTriangle className="h-7 w-7" />
              )}
            </span>

            <h2 className="mt-4 font-bold">{alert.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{alert.message}</p>

            <button
              type="button"
              onClick={() => setAlert(null)}
              className="mt-6 w-full rounded-lg bg-emerald-700 p-3 font-bold text-white"
            >
              ตกลง
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AdminLocationSection({
  draft,
  disabled,
  onChange,
}: {
  draft: AdminProfile;
  disabled: boolean;
  onChange: (profile: AdminProfile) => void;
}) {
  function selectInsideCampus() {
    onChange({
      ...draft,
      locationType: "inside-campus",
      addressLine: "",
      subdistrict: "",
      district: "",
      province: "",
      postalCode: "",
    });
  }

  function selectOutsideCampus() {
    onChange({
      ...draft,
      locationType: "outside-campus",
      building: "",
      floor: "",
      roomNumber: "",
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-bold text-slate-600">
          สถานที่ปฏิบัติงานหรือที่พักของคุณ
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <LocationChoice
            title="ปฏิบัติงานภายในมหาวิทยาลัย"
            description="อาคารสำนักงาน หน่วยงาน หรือที่พักบุคลากรภายใน มวล."
            selected={draft.locationType === "inside-campus"}
            disabled={disabled}
            onClick={selectInsideCampus}
          />

          <LocationChoice
            title="ภายนอกมหาวิทยาลัย"
            description="ที่พักหรือที่อยู่นอกมหาวิทยาลัย"
            selected={draft.locationType === "outside-campus"}
            disabled={disabled}
            onClick={selectOutsideCampus}
          />
        </div>
      </div>

      {draft.locationType === "inside-campus" && (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
          <div>
            <h4 className="text-sm font-bold text-emerald-900">
              ข้อมูลสถานที่ปฏิบัติงานภายในมหาวิทยาลัย
            </h4>
            <p className="mt-1 text-[11px] text-emerald-700/70">
              กรุณาระบุอาคารและห้องทำงานเพื่อให้ติดต่อได้สะดวก
            </p>
          </div>

          <AddressField
            label="อาคารสำนักงาน / หน่วยงาน"
            value={draft.building}
            disabled={disabled}
            required
            placeholder="เช่น อาคารบริหาร, อาคารวิชาการ 1"
            onChange={(value) => onChange({ ...draft, building: value })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <AddressField
              label="ชั้น"
              value={draft.floor}
              disabled={disabled}
              placeholder="เช่น 2"
              onChange={(value) => onChange({ ...draft, floor: value })}
            />

            <AddressField
              label="เลขที่ห้องทำงาน"
              value={draft.roomNumber}
              disabled={disabled}
              required
              placeholder="เช่น ห้อง 201"
              onChange={(value) => onChange({ ...draft, roomNumber: value })}
            />
          </div>
        </div>
      )}

      {draft.locationType === "outside-campus" && (
        <div className="space-y-4 rounded-2xl border border-sky-200 bg-sky-50/40 p-4 sm:p-5">
          <div>
            <h4 className="text-sm font-bold text-sky-900">
              ข้อมูลที่อยู่ภายนอกมหาวิทยาลัย
            </h4>
            <p className="mt-1 text-[11px] text-sky-700/70">
              กรุณากรอกที่อยู่ปัจจุบันของคุณ
            </p>
          </div>

          <AddressField
            label="บ้านเลขที่ / หมู่ / ถนน / ซอย"
            value={draft.addressLine}
            disabled={disabled}
            placeholder="เช่น 222 หมู่ 10 ถนนมหาวิทยาลัย"
            onChange={(value) => onChange({ ...draft, addressLine: value })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <AddressField
              label="ตำบล / แขวง"
              value={draft.subdistrict}
              disabled={disabled}
              placeholder="เช่น ไทยบุรี"
              onChange={(value) => onChange({ ...draft, subdistrict: value })}
            />

            <AddressField
              label="อำเภอ / เขต"
              value={draft.district}
              disabled={disabled}
              placeholder="เช่น ท่าศาลา"
              onChange={(value) => onChange({ ...draft, district: value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <AddressField
              label="จังหวัด"
              value={draft.province}
              disabled={disabled}
              placeholder="เช่น นครศรีธรรมราช"
              onChange={(value) => onChange({ ...draft, province: value })}
            />

            <AddressField
              label="รหัสไปรษณีย์"
              value={draft.postalCode}
              disabled={disabled}
              placeholder="80160"
              inputMode="numeric"
              maxLength={5}
              onChange={(value) =>
                onChange({
                  ...draft,
                  postalCode: value.replace(/\D/g, "").slice(0, 5),
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LocationChoice({
  title,
  description,
  selected,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
          : "border-slate-200 bg-white hover:border-emerald-200"
      } ${disabled ? "cursor-default opacity-70" : "cursor-pointer"}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? "border-emerald-600 bg-emerald-600"
              : "border-slate-300 bg-white"
          }`}
        >
          {selected && <Check className="h-3 w-3 text-white" />}
        </span>

        <span>
          <span className="block text-sm font-bold">{title}</span>
          <span className="mt-1 block text-[11px] text-slate-500">
            {description}
          </span>
        </span>
      </div>
    </button>
  );
}

function AddressField({
  label,
  value,
  disabled,
  onChange,
  placeholder,
  required = false,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  inputMode?:
    | "text"
    | "numeric"
    | "decimal"
    | "tel"
    | "email"
    | "url"
    | "search";
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-600">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>

      <input
        type="text"
        value={value}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </label>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </span>

        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      {action}
    </div>
  );
}

function ProfileField({
  label,
  value,
  disabled,
  onChange,
  helper,
  type = "text",
  inputMode,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  helper?: string;
  type?: "text" | "email" | "tel" | "date";
  inputMode?:
    | "text"
    | "numeric"
    | "decimal"
    | "tel"
    | "email"
    | "url"
    | "search";
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-600">{label}</span>

      <input
        type={type}
        value={value}
        disabled={disabled}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500"
      />

      {helper && (
        <span className="mt-1 block text-[10px] text-slate-400">{helper}</span>
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  disabled,
  onChange,
  options,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-600">{label}</span>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 disabled:bg-slate-50"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleSetting({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 ${
        disabled ? "bg-slate-50/60" : "cursor-pointer hover:border-emerald-200"
      }`}
    >
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-1 block text-xs text-slate-500">{description}</span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-emerald-600"
      />
    </label>
  );
}

function PasswordField({
  label,
  value,
  visible,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold">{label}</span>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          required
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 px-3 pr-11 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </label>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
