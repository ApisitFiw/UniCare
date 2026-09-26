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
import { getDemoSession, updateDemoSession } from "@/lib/authService";

type Gender =
  | ""
  | "male"
  | "female"
  | "other"
  | "not-specified";

type ResidenceLocation =
  | ""
  | "inside-campus"
  | "outside-campus";

type Profile = {
  avatar?: string;
  prefix: string;
  firstName: string;
  lastName: string;
  nickname: string;
  gender: Gender;
  username: string;

  phone: string;
  birthDate: string;

  residenceLocation: ResidenceLocation;

  dormitory: string;
  building: string;
  floor: string;
  roomNumber: string;

  addressLine: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;

  notifyReportStatus: boolean;
  notifyNews: boolean;
  showNameOnReport: boolean;
  anonymousReportDefault: boolean;
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

const SESSION_KEY =
  "unicare_demo_session";

const PROFILE_KEY_PREFIX =
  "unicare_demo_user_profile";

const emptyProfile: Profile = {
  prefix: "",
  firstName: "",
  lastName: "",
  nickname: "",
  gender: "",
  username: "",

  phone: "",
  birthDate: "",

  residenceLocation: "",

  dormitory: "",
  building: "",
  floor: "",
  roomNumber: "",

  addressLine: "",
  subdistrict: "",
  district: "",
  province: "",
  postalCode: "",

  notifyReportStatus: true,
  notifyNews: false,
  showNameOnReport: true,
  anonymousReportDefault: false,
};

function getFullName(profile: Profile) {
  const prefix = profile.prefix.trim();
  const firstName =
    profile.firstName.trim();
  const lastName =
    profile.lastName.trim();

  return `${prefix}${firstName} ${lastName}`.trim();
}

function getProfileStorageKey(
  session: SessionData,
) {
  const identity =
    session.email
      ?.trim()
      .toLowerCase() ||
    session.username
      ?.trim()
      .toLowerCase() ||
    session.name
      ?.trim()
      .toLowerCase() ||
    "unknown-user";

  return `${PROFILE_KEY_PREFIX}:${identity}`;
}

function createProfileFromSession(
  session: SessionData,
): Profile {
  const displayName =
    session.name?.trim() || "";

  let prefix = "";
  let nameWithoutPrefix =
    displayName;

  if (
    displayName.startsWith(
      "นางสาว",
    )
  ) {
    prefix = "นางสาว";
    nameWithoutPrefix =
      displayName
        .slice("นางสาว".length)
        .trim();
  } else if (
    displayName.startsWith("นาย")
  ) {
    prefix = "นาย";
    nameWithoutPrefix =
      displayName
        .slice("นาย".length)
        .trim();
  } else if (
    displayName.startsWith("นาง")
  ) {
    prefix = "นาง";
    nameWithoutPrefix =
      displayName
        .slice("นาง".length)
        .trim();
  }

  const nameParts =
    nameWithoutPrefix
      .split(/\s+/)
      .filter(Boolean);

  const firstName =
    nameParts[0] || "";

  const lastName =
    nameParts.slice(1).join(" ");

  const username =
    session.username?.trim() ||
    session.email
      ?.split("@")[0]
      ?.trim() ||
    "";

  return {
    ...emptyProfile,
    prefix,
    firstName,
    lastName,
    username,
  };
}

function readStoredProfile(
  key: string,
): Profile | null {
  try {
    const stored =
      window.localStorage.getItem(
        key,
      );

    if (!stored) return null;

    const parsed: unknown =
      JSON.parse(stored);

    if (
      typeof parsed !== "object" ||
      parsed === null
    ) {
      return null;
    }

    return {
      ...emptyProfile,
      ...(parsed as Partial<Profile>),
    };
  } catch {
    return null;
  }
}

function updateAccountSession(
  session: SessionData,
  profile: Profile,
) {
  const updatedSession = {
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
    new Event(
      "unicare-profile-updated",
    ),
  );
  window.dispatchEvent(
    new Event(
      "storage",
    ),
  );
}

export default function UserProfilePage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<Profile>(emptyProfile);

  const [draft, setDraft] =
    useState<Profile>(emptyProfile);

  const [
    currentSession,
    setCurrentSession,
  ] =
    useState<SessionData | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isEditing, setIsEditing] =
    useState(false);

  const [passwordOpen, setPasswordOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [alert, setAlert] =
    useState<AlertState>(null);

  const [passwords, setPasswords] =
    useState({
      current: "",
      next: "",
      confirm: "",
    });

  const [visible, setVisible] =
    useState({
      current: false,
      next: false,
      confirm: false,
    });

  useEffect(() => {
    const session =
      getDemoSession() as SessionData | null;

    if (!session) {
      setIsLoading(false);
      router.replace("/login");
      return;
    }

    if (session.role === "admin") {
      setIsLoading(false);
      router.replace(
        "/admin/dashboard",
      );
      return;
    }

    setCurrentSession(session);

    const profileKey =
      getProfileStorageKey(
        session,
      );

    const storedProfile =
      readStoredProfile(
        profileKey,
      );

    let loadedProfile =
      storedProfile ||
      createProfileFromSession(
        session,
      );

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

          const mergedProfile: Profile = {
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
            residenceLocation: meta.residenceLocation || loadedProfile.residenceLocation,
            dormitory: meta.dormitory || loadedProfile.dormitory,
            building: meta.building || loadedProfile.building,
            floor: meta.floor || loadedProfile.floor,
            roomNumber: meta.roomNumber || loadedProfile.roomNumber,
            addressLine: meta.addressLine || loadedProfile.addressLine,
            subdistrict: meta.subdistrict || loadedProfile.subdistrict,
            district: meta.district || loadedProfile.district,
            province: meta.province || loadedProfile.province,
            postalCode: meta.postalCode || loadedProfile.postalCode,
            notifyReportStatus: meta.notifyReportStatus ?? loadedProfile.notifyReportStatus,
            notifyNews: meta.notifyNews ?? loadedProfile.notifyNews,
            showNameOnReport: meta.showNameOnReport ?? loadedProfile.showNameOnReport,
            anonymousReportDefault: meta.anonymousReportDefault ?? loadedProfile.anonymousReportDefault,
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

  const fullName = useMemo(
    () => getFullName(profile),
    [profile],
  );

  const initials =
    profile.firstName ||
    profile.lastName
      ? `${profile.firstName.charAt(
          0,
        )}${profile.lastName.charAt(
          0,
        )}`
      : "U";

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

  function saveProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!currentSession) {
      setAlert({
        type: "error",
        title:
          "ไม่พบบัญชีผู้ใช้งาน",
        message:
          "กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
      });
      return;
    }

    const cleanedProfile: Profile = {
      ...draft,

      prefix:
        draft.prefix.trim(),

      firstName:
        draft.firstName.trim(),

      lastName:
        draft.lastName.trim(),

      nickname:
        draft.nickname.trim(),

      username: draft.username
        .trim()
        .toLowerCase(),

      phone: draft.phone
        .replace(/\D/g, "")
        .slice(0, 10),

      birthDate:
        draft.birthDate.trim(),

      dormitory:
        draft.dormitory.trim(),

      building:
        draft.building.trim(),

      floor:
        draft.floor.trim(),

      roomNumber:
        draft.roomNumber.trim(),

      addressLine:
        draft.addressLine.trim(),

      subdistrict:
        draft.subdistrict.trim(),

      district:
        draft.district.trim(),

      province:
        draft.province.trim(),

      postalCode:
        draft.postalCode.trim(),
    };

    if (
      !cleanedProfile.prefix ||
      !cleanedProfile.firstName ||
      !cleanedProfile.lastName
    ) {
      setAlert({
        type: "warning",
        title: "ข้อมูลไม่ครบ",
        message:
          "กรุณากรอกคำนำหน้า ชื่อ และนามสกุลให้ครบ",
      });
      return;
    }

    if (
      !cleanedProfile.username
    ) {
      setAlert({
        type: "warning",
        title:
          "ไม่พบชื่อผู้ใช้งาน",
        message:
          "กรุณาระบุชื่อผู้ใช้งาน",
      });
      return;
    }

    if (
      cleanedProfile.phone &&
      !/^\d{9,10}$/.test(
        cleanedProfile.phone,
      )
    ) {
      setAlert({
        type: "warning",
        title:
          "เบอร์โทรศัพท์ไม่ถูกต้อง",
        message:
          "กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลข 9–10 หลัก",
      });
      return;
    }

    if (
      !cleanedProfile.residenceLocation
    ) {
      setAlert({
        type: "warning",
        title:
          "กรุณาเลือกที่พัก",
        message:
          "กรุณาเลือกว่าปัจจุบันพักอยู่ภายในหรือนอกมหาวิทยาลัย",
      });
      return;
    }

    if (
      cleanedProfile.residenceLocation ===
        "inside-campus" &&
      (!cleanedProfile.dormitory ||
        !cleanedProfile.roomNumber)
    ) {
      setAlert({
        type: "warning",
        title:
          "ข้อมูลหอพักไม่ครบ",
        message:
          "กรุณากรอกชื่อหอพักและเลขห้อง",
      });
      return;
    }

    if (
      cleanedProfile.residenceLocation ===
        "outside-campus" &&
      cleanedProfile.postalCode &&
      !/^\d{5}$/.test(
        cleanedProfile.postalCode,
      )
    ) {
      setAlert({
        type: "warning",
        title:
          "รหัสไปรษณีย์ไม่ถูกต้อง",
        message:
          "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก",
      });
      return;
    }

    const profileKey =
      getProfileStorageKey(
        currentSession,
      );

    window.localStorage.setItem(
      profileKey,
      JSON.stringify(
        cleanedProfile,
      ),
    );

    updateAccountSession(
      currentSession,
      cleanedProfile,
    );

    const updatedSession = {
      ...currentSession,
      name:
        getFullName(
          cleanedProfile,
        ),
      username:
        cleanedProfile.username,
      avatar: cleanedProfile.avatar,
    };

    setCurrentSession(
      updatedSession,
    );

    setProfile(cleanedProfile);
    setDraft(cleanedProfile);
    setIsEditing(false);

    // Sync profile to Supabase
    if (currentSession?.email) {
      upsertProfileInSupabase({
        email: currentSession.email,
        full_name: getFullName(cleanedProfile),
        role: "user",
        avatar_url: cleanedProfile.avatar || null,
        department: JSON.stringify({
          prefix: cleanedProfile.prefix,
          firstName: cleanedProfile.firstName,
          lastName: cleanedProfile.lastName,
          nickname: cleanedProfile.nickname,
          phone: cleanedProfile.phone,
          dormitory: cleanedProfile.dormitory,
          building: cleanedProfile.building,
          floor: cleanedProfile.floor,
          roomNumber: cleanedProfile.roomNumber,
          residenceLocation: cleanedProfile.residenceLocation,
          gender: cleanedProfile.gender,
          birthDate: cleanedProfile.birthDate,
          addressLine: cleanedProfile.addressLine,
          subdistrict: cleanedProfile.subdistrict,
          district: cleanedProfile.district,
          province: cleanedProfile.province,
          postalCode: cleanedProfile.postalCode,
          username: cleanedProfile.username,
          notifyReportStatus: cleanedProfile.notifyReportStatus,
          notifyNews: cleanedProfile.notifyNews,
          showNameOnReport: cleanedProfile.showNameOnReport,
          anonymousReportDefault: cleanedProfile.anonymousReportDefault,
        }),
      }).catch((err) => console.warn("Supabase user profile sync failed:", err));
    }

    setAlert({
      type: "success",
      title: "บันทึกสำเร็จ",
      message:
        "ข้อมูลบัญชี เบอร์โทรศัพท์ วันเกิด และข้อมูลที่อยู่ถูกบันทึกเรียบร้อยแล้ว",
    });
  }

  function closePasswordModal() {
    setPasswordOpen(false);

    setPasswords({
      current: "",
      next: "",
      confirm: "",
    });

    setVisible({
      current: false,
      next: false,
      confirm: false,
    });
  }

  function changePassword(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !passwords.current ||
      !passwords.next ||
      !passwords.confirm
    ) {
      setAlert({
        type: "warning",
        title: "ข้อมูลไม่ครบ",
        message:
          "กรุณากรอกรหัสผ่านให้ครบทุกช่อง",
      });
      return;
    }

    if (
      passwords.next.length < 8
    ) {
      setAlert({
        type: "warning",
        title:
          "รหัสผ่านสั้นเกินไป",
        message:
          "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร",
      });
      return;
    }

    if (
      !/[A-Za-z]/.test(
        passwords.next,
      ) ||
      !/\d/.test(passwords.next)
    ) {
      setAlert({
        type: "warning",
        title:
          "รหัสผ่านไม่ปลอดภัย",
        message:
          "รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษและตัวเลข",
      });
      return;
    }

    if (
      passwords.next ===
      passwords.current
    ) {
      setAlert({
        type: "warning",
        title:
          "กรุณาใช้รหัสผ่านใหม่",
        message:
          "รหัสผ่านใหม่ไม่ควรเหมือนรหัสผ่านปัจจุบัน",
      });
      return;
    }

    if (
      passwords.next !==
      passwords.confirm
    ) {
      setAlert({
        type: "error",
        title:
          "รหัสผ่านไม่ตรงกัน",
        message:
          "กรุณายืนยันรหัสผ่านใหม่อีกครั้ง",
      });
      return;
    }

    closePasswordModal();

    setAlert({
      type: "success",
      title:
        "เปลี่ยนรหัสผ่านสำเร็จ",
      message:
        "บันทึกรหัสผ่านใหม่ในระบบทดลองเรียบร้อยแล้ว",
    });
  }

  function deleteAccount() {
    if (currentSession) {
      const profileKey =
        getProfileStorageKey(
          currentSession,
        );

      window.localStorage.removeItem(
        profileKey,
      );
    }

    window.localStorage.removeItem(
      SESSION_KEY,
    );

    window.sessionStorage.removeItem(
      SESSION_KEY,
    );

    window.dispatchEvent(
      new Event(
        "unicare-profile-updated",
      ),
    );

    router.replace("/login");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f8f6]">
        <Header
          title="บัญชีของฉัน"
          subtitle="กำลังโหลดข้อมูลบัญชี"
          role="USER"
        />

        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />

            <p className="mt-4 text-sm text-slate-500">
              กำลังโหลดข้อมูล...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f8f6] text-slate-800">
      <Header
        title="บัญชีของฉัน"
        subtitle="จัดการข้อมูลส่วนตัว ที่พัก และความเป็นส่วนตัว"
        role="USER"
      />

      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <form
          onSubmit={saveProfile}
          className="space-y-5"
        >
          {/* ข้อมูลผู้ใช้งาน */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionTitle
              icon={
                <User className="h-5 w-5" />
              }
              title="ข้อมูลผู้ใช้งาน"
              subtitle="ข้อมูลจากบัญชีที่เข้าสู่ระบบ"
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
                        alt="User Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  {isEditing && (
                    <label
                      htmlFor="user-avatar-file"
                      className="absolute bottom-0 right-0 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-md cursor-pointer transition transform hover:scale-110"
                      title="เปลี่ยนรูปโปรไฟล์"
                    >
                      <Camera className="w-4 h-4" />
                      <input
                        id="user-avatar-file"
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
                      htmlFor="user-avatar-file-btn"
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl cursor-pointer transition inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>อัปโหลดรูปภาพ</span>
                      <input
                        id="user-avatar-file-btn"
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

                <h3 className="mt-4 font-bold notranslate" data-user-content="true">
                  {fullName ||
                    currentSession?.name ||
                    "ยังไม่มีข้อมูลชื่อ"}
                </h3>

                <p className="mt-1 text-xs text-slate-400 notranslate" data-user-content="true">
                  {profile.username
                    ? `@${profile.username}`
                    : "ยังไม่มีชื่อผู้ใช้งาน"}
                </p>

                {profile.nickname && (
                  <p className="mt-2 text-xs text-slate-500">
                    ชื่อเล่น:{" "}
                    <span className="notranslate" data-user-content="true">{profile.nickname}</span>
                  </p>
                )}

                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  บัญชีใช้งานอยู่
                </span>
              </div>

              {/* แบบฟอร์มฝั่งขวา */}
              <div className="space-y-5 p-5 sm:p-7">
                <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)]">
                  <SelectField
                    label="คำนำหน้าชื่อ"
                    value={draft.prefix}
                    disabled={!isEditing}
                    onChange={(value) =>
                      setDraft({
                        ...draft,
                        prefix: value,
                      })
                    }
                    options={[
                      ["", "เลือก"],
                      ["นาย", "นาย"],
                      ["นาง", "นาง"],
                      [
                        "นางสาว",
                        "นางสาว",
                      ],
                      [
                        "อื่น ๆ",
                        "อื่น ๆ",
                      ],
                    ]}
                  />

                  <ProfileField
                    label="ชื่อ"
                    value={
                      draft.firstName
                    }
                    disabled={!isEditing}
                    onChange={(value) =>
                      setDraft({
                        ...draft,
                        firstName: value,
                      })
                    }
                  />

                  <ProfileField
                    label="นามสกุล"
                    value={
                      draft.lastName
                    }
                    disabled={!isEditing}
                    onChange={(value) =>
                      setDraft({
                        ...draft,
                        lastName: value,
                      })
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField
                    label="ชื่อเล่น (ไม่บังคับ)"
                    value={
                      draft.nickname
                    }
                    disabled={!isEditing}
                    onChange={(value) =>
                      setDraft({
                        ...draft,
                        nickname: value,
                      })
                    }
                  />

                  <SelectField
                    label="เพศ (ไม่บังคับ)"
                    value={draft.gender}
                    disabled={!isEditing}
                    onChange={(value) =>
                      setDraft({
                        ...draft,
                        gender:
                          value as Gender,
                      })
                    }
                    options={[
                      ["", "ไม่ระบุ"],
                      ["male", "ชาย"],
                      ["female", "หญิง"],
                      ["other", "อื่น ๆ"],
                      [
                        "not-specified",
                        "ไม่ต้องการระบุ",
                      ],
                    ]}
                  />
                </div>

                {/* ข้อมูลติดต่อ */}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-emerald-900">
                      ข้อมูลการติดต่อและข้อมูลส่วนตัว
                    </h4>

                    <p className="mt-1 text-[11px] text-emerald-700/70">
                      อีเมลมาจากบัญชีที่เข้าสู่ระบบ ส่วนเบอร์โทรศัพท์และวันเกิดสามารถแก้ไขได้
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <ProfileField
                      label="อีเมล"
                      value={
                        currentSession?.email ||
                        ""
                      }
                      disabled
                      type="email"
                      onChange={() =>
                        undefined
                      }
                      helper="เชื่อมกับบัญชีที่เข้าสู่ระบบ"
                    />

                    <ProfileField
                      label="เบอร์โทรศัพท์ (ไม่บังคับ)"
                      value={draft.phone}
                      disabled={!isEditing}
                      type="tel"
                      inputMode="numeric"
                      placeholder="เช่น 0812345678"
                      maxLength={10}
                      onChange={(value) =>
                        setDraft({
                          ...draft,
                          phone: value
                            .replace(
                              /\D/g,
                              "",
                            )
                            .slice(0, 10),
                        })
                      }
                    />

                    <ProfileField
                      label="วันเกิด (ไม่บังคับ)"
                      value={
                        draft.birthDate
                      }
                      disabled={!isEditing}
                      type="date"
                      onChange={(value) =>
                        setDraft({
                          ...draft,
                          birthDate: value,
                        })
                      }
                    />
                  </div>
                </div>

                <ProfileField
                  label="ชื่อผู้ใช้งาน"
                  value={draft.username}
                  disabled
                  onChange={() =>
                    undefined
                  }
                  helper="สร้างจากบัญชีที่เข้าสู่ระบบ"
                />
              </div>
            </div>
          </section>

          {/* ข้อมูลที่อยู่ */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionTitle
              icon={
                <MapPin className="h-5 w-5" />
              }
              title="ข้อมูลที่อยู่และหอพัก"
              subtitle="ข้อมูลนี้จะถูกบันทึกแยกตามบัญชี"
            />

            <div className="p-5 sm:p-7">
              <ResidenceSection
                draft={draft}
                disabled={!isEditing}
                onChange={setDraft}
              />
            </div>
          </section>

          {/* การแจ้งเตือน */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionTitle
              icon={
                <Bell className="h-5 w-5" />
              }
              title="การแจ้งเตือน"
              subtitle="ตั้งค่าการแจ้งเตือนของบัญชี"
            />

            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
              <ToggleSetting
                title="แจ้งเตือนสถานะคำร้อง"
                description="รับการแจ้งเตือนเมื่อเจ้าหน้าที่อัปเดตคำร้อง"
                checked={
                  draft.notifyReportStatus
                }
                disabled={!isEditing}
                onChange={(checked) =>
                  setDraft({
                    ...draft,
                    notifyReportStatus:
                      checked,
                  })
                }
              />

              <ToggleSetting
                title="ข่าวสารและประกาศ"
                description="รับข่าวสารและประกาศจากมหาวิทยาลัย"
                checked={
                  draft.notifyNews
                }
                disabled={!isEditing}
                onChange={(checked) =>
                  setDraft({
                    ...draft,
                    notifyNews: checked,
                  })
                }
              />
            </div>
          </section>

          {/* ความเป็นส่วนตัว */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionTitle
              icon={
                <ShieldCheck className="h-5 w-5" />
              }
              title="ความเป็นส่วนตัว"
              subtitle="กำหนดการแสดงชื่อของคุณในคำร้อง"
            />

            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
              <ToggleSetting
                title="แสดงชื่อของฉันในคำร้อง"
                description="เจ้าหน้าที่สามารถเห็นชื่อเจ้าของคำร้องได้"
                checked={
                  draft.showNameOnReport
                }
                disabled={
                  !isEditing ||
                  draft.anonymousReportDefault
                }
                onChange={(checked) =>
                  setDraft({
                    ...draft,
                    showNameOnReport:
                      checked,
                  })
                }
              />

              <ToggleSetting
                title="แจ้งปัญหาแบบไม่เปิดเผยชื่อ"
                description="ซ่อนชื่อเมื่อสร้างคำร้องใหม่"
                checked={
                  draft.anonymousReportDefault
                }
                disabled={!isEditing}
                onChange={(checked) =>
                  setDraft({
                    ...draft,
                    anonymousReportDefault:
                      checked,
                    showNameOnReport:
                      checked
                        ? false
                        : draft.showNameOnReport,
                  })
                }
              />
            </div>
          </section>

          {isEditing && (
            <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                กรุณาตรวจสอบข้อมูลก่อนบันทึก
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

        {/* ความปลอดภัย */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionTitle
            icon={
              <KeyRound className="h-5 w-5" />
            }
            title="ความปลอดภัย"
            subtitle="จัดการรหัสผ่านสำหรับเข้าสู่ระบบ"
          />

          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <h3 className="text-sm font-bold">
                รหัสผ่าน
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                แนะนำให้เปลี่ยนรหัสผ่านเป็นระยะ
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setPasswordOpen(true)
              }
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-700"
            >
              <KeyRound className="h-4 w-4" />
              เปลี่ยนรหัสผ่าน
            </button>
          </div>
        </section>

        {/* ลบบัญชี */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50/50 px-5 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <Trash2 className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-bold text-rose-900">
                ลบบัญชีผู้ใช้
              </h2>

              <p className="text-xs text-rose-600">
                ลบข้อมูลโปรไฟล์ออกจากระบบทดลอง
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold">
                ต้องการลบบัญชี{" "}
                {fullName ||
                  currentSession?.name ||
                  "ของคุณ"}{" "}
                หรือไม่?
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                เมื่อลบบัญชี ระบบจะนำคุณออกจากระบบทันที
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setDeleteOpen(true)
              }
              className="rounded-lg bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700"
            >
              ลบบัญชีของฉัน
            </button>
          </div>
        </section>
      </main>

      {/* Modal เปลี่ยนรหัสผ่าน */}
      {passwordOpen && (
        <Modal
          onClose={
            closePasswordModal
          }
        >
          <div className="flex items-center justify-between border-b p-6">
            <div>
              <h2 className="font-bold">
                เปลี่ยนรหัสผ่าน
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่
              </p>
            </div>

            <button
              type="button"
              onClick={
                closePasswordModal
              }
              className="rounded-full bg-slate-100 p-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            onSubmit={changePassword}
            className="space-y-4 p-6"
          >
            <PasswordField
              label="รหัสผ่านปัจจุบัน"
              value={
                passwords.current
              }
              visible={
                visible.current
              }
              onChange={(value) =>
                setPasswords({
                  ...passwords,
                  current: value,
                })
              }
              onToggle={() =>
                setVisible({
                  ...visible,
                  current:
                    !visible.current,
                })
              }
            />

            <PasswordField
              label="รหัสผ่านใหม่"
              value={passwords.next}
              visible={visible.next}
              onChange={(value) =>
                setPasswords({
                  ...passwords,
                  next: value,
                })
              }
              onToggle={() =>
                setVisible({
                  ...visible,
                  next: !visible.next,
                })
              }
            />

            <PasswordField
              label="ยืนยันรหัสผ่านใหม่"
              value={
                passwords.confirm
              }
              visible={
                visible.confirm
              }
              onChange={(value) =>
                setPasswords({
                  ...passwords,
                  confirm: value,
                })
              }
              onToggle={() =>
                setVisible({
                  ...visible,
                  confirm:
                    !visible.confirm,
                })
              }
            />

            <div className="flex justify-end gap-3 border-t pt-5">
              <button
                type="button"
                onClick={
                  closePasswordModal
                }
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
        <Modal
          onClose={() =>
            setDeleteOpen(false)
          }
        >
          <div className="p-7 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-rose-600" />

            <h2 className="mt-4 font-bold">
              ยืนยันการลบบัญชี?
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              ข้อมูลโปรไฟล์และข้อมูลที่อยู่จะถูกลบ
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteOpen(false)
                }
                className="rounded-lg bg-slate-100 p-3 text-sm font-bold"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={
                  deleteAccount
                }
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
        <Modal
          onClose={() =>
            setAlert(null)
          }
        >
          <div className="p-7 text-center">
            <span
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                alert.type === "success"
                  ? "bg-emerald-100 text-emerald-700"
                  : alert.type ===
                      "warning"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
              }`}
            >
              {alert.type ===
              "success" ? (
                <Check className="h-7 w-7" />
              ) : (
                <AlertTriangle className="h-7 w-7" />
              )}
            </span>

            <h2 className="mt-4 font-bold">
              {alert.title}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {alert.message}
            </p>

            <button
              type="button"
              onClick={() =>
                setAlert(null)
              }
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

function ResidenceSection({
  draft,
  disabled,
  onChange,
}: {
  draft: Profile;
  disabled: boolean;
  onChange: (
    profile: Profile,
  ) => void;
}) {
  function selectInsideCampus() {
    onChange({
      ...draft,
      residenceLocation:
        "inside-campus",
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
      residenceLocation:
        "outside-campus",
      dormitory: "",
      building: "",
      floor: "",
      roomNumber: "",
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-bold text-slate-600">
          ปัจจุบันคุณพักอยู่ภายในมหาวิทยาลัยหรือไม่?
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <ResidenceChoice
            title="อยู่ภายในมหาวิทยาลัย"
            description="พักอยู่ในหอพักของมหาวิทยาลัย"
            selected={
              draft.residenceLocation ===
              "inside-campus"
            }
            disabled={disabled}
            onClick={
              selectInsideCampus
            }
          />

          <ResidenceChoice
            title="อยู่นอกมหาวิทยาลัย"
            description="บ้าน หอพัก หรือที่พักภายนอกมหาวิทยาลัย"
            selected={
              draft.residenceLocation ===
              "outside-campus"
            }
            disabled={disabled}
            onClick={
              selectOutsideCampus
            }
          />
        </div>
      </div>

      {!draft.residenceLocation && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center">
          <MapPin className="mx-auto h-7 w-7 text-slate-300" />

          <p className="mt-2 text-xs text-slate-400">
            ยังไม่มีข้อมูลที่พัก กรุณากดแก้ไขและเลือกประเภทที่พัก
          </p>
        </div>
      )}

      {draft.residenceLocation ===
        "inside-campus" && (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
          <div>
            <h4 className="text-sm font-bold text-emerald-900">
              ข้อมูลหอพักภายในมหาวิทยาลัย
            </h4>

            <p className="mt-1 text-[11px] text-emerald-700/70">
              กรุณากรอกชื่อหอพักและข้อมูลห้องพัก
            </p>
          </div>

          <AddressField
            label="ชื่อหอพัก"
            value={draft.dormitory}
            disabled={disabled}
            required
            placeholder="เช่น หอพักลักษณานิเวศ 3"
            onChange={(value) =>
              onChange({
                ...draft,
                dormitory: value,
              })
            }
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <AddressField
              label="อาคาร"
              value={draft.building}
              disabled={disabled}
              placeholder="เช่น อาคาร A"
              onChange={(value) =>
                onChange({
                  ...draft,
                  building: value,
                })
              }
            />

            <AddressField
              label="ชั้น"
              value={draft.floor}
              disabled={disabled}
              placeholder="เช่น 2"
              onChange={(value) =>
                onChange({
                  ...draft,
                  floor: value,
                })
              }
            />

            <AddressField
              label="เลขห้อง"
              value={
                draft.roomNumber
              }
              disabled={disabled}
              required
              placeholder="เช่น 205"
              onChange={(value) =>
                onChange({
                  ...draft,
                  roomNumber: value,
                })
              }
            />
          </div>
        </div>
      )}

      {draft.residenceLocation ===
        "outside-campus" && (
        <div className="space-y-4 rounded-2xl border border-sky-200 bg-sky-50/40 p-4 sm:p-5">
          <div>
            <h4 className="text-sm font-bold text-sky-900">
              ข้อมูลที่พักภายนอกมหาวิทยาลัย
            </h4>

            <p className="mt-1 text-[11px] text-sky-700/70">
              กรุณากรอกที่อยู่ปัจจุบันของคุณ
            </p>
          </div>

          <AddressField
            label="บ้านเลขที่ / หมู่ / ถนน / ชื่อหอพัก"
            value={
              draft.addressLine
            }
            disabled={disabled}
            placeholder="เช่น 222 หมู่ 10 ถนนมหาวิทยาลัย"
            onChange={(value) =>
              onChange({
                ...draft,
                addressLine: value,
              })
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <AddressField
              label="ตำบล / แขวง"
              value={
                draft.subdistrict
              }
              disabled={disabled}
              placeholder="เช่น ไทยบุรี"
              onChange={(value) =>
                onChange({
                  ...draft,
                  subdistrict: value,
                })
              }
            />

            <AddressField
              label="อำเภอ / เขต"
              value={draft.district}
              disabled={disabled}
              placeholder="เช่น ท่าศาลา"
              onChange={(value) =>
                onChange({
                  ...draft,
                  district: value,
                })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <AddressField
              label="จังหวัด"
              value={draft.province}
              disabled={disabled}
              placeholder="เช่น นครศรีธรรมราช"
              onChange={(value) =>
                onChange({
                  ...draft,
                  province: value,
                })
              }
            />

            <AddressField
              label="รหัสไปรษณีย์"
              value={
                draft.postalCode
              }
              disabled={disabled}
              placeholder="80160"
              inputMode="numeric"
              maxLength={5}
              onChange={(value) =>
                onChange({
                  ...draft,
                  postalCode: value
                    .replace(
                      /\D/g,
                      "",
                    )
                    .slice(0, 5),
                })
              }
            />
          </div>
        </div>
      )}

      <p className="text-[10px] leading-5 text-slate-400">
        ข้อมูลที่พักใช้สำหรับข้อมูลบัญชีเท่านั้น
        ไม่ใช้แทนตำแหน่งที่เกิดเหตุในคำร้อง
      </p>
    </div>
  );
}

function ResidenceChoice({
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
      } ${
        disabled
          ? "cursor-default opacity-70"
          : "cursor-pointer"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? "border-emerald-600 bg-emerald-600"
              : "border-slate-300 bg-white"
          }`}
        >
          {selected && (
            <Check className="h-3 w-3 text-white" />
          )}
        </span>

        <span>
          <span className="block text-sm font-bold">
            {title}
          </span>

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
  onChange: (
    value: string,
  ) => void;
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

        {required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}
      </span>

      <input
        type="text"
        value={value}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
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
          <h2 className="font-bold">
            {title}
          </h2>

          <p className="text-xs text-slate-400">
            {subtitle}
          </p>
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
  onChange: (
    value: string,
  ) => void;
  helper?: string;
  type?:
    | "text"
    | "email"
    | "tel"
    | "date";
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
      <span className="mb-2 block text-xs font-bold text-slate-600">
        {label}
      </span>

      <input
        type={type}
        value={value}
        disabled={disabled}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500"
      />

      {helper && (
        <span className="mt-1 block text-[10px] text-slate-400">
          {helper}
        </span>
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
  onChange: (
    value: string,
  ) => void;
  options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-600">
        {label}
      </span>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 disabled:bg-slate-50"
      >
        {options.map(
          ([
            optionValue,
            optionLabel,
          ]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {optionLabel}
            </option>
          ),
        )}
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
  onChange: (
    checked: boolean,
  ) => void;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 ${
        disabled
          ? "bg-slate-50/60"
          : "cursor-pointer hover:border-emerald-200"
      }`}
    >
      <span>
        <span className="block text-sm font-bold">
          {title}
        </span>

        <span className="mt-1 block text-xs text-slate-500">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.checked,
          )
        }
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
  onChange: (
    value: string,
  ) => void;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold">
        {label}
      </span>

      <div className="relative">
        <input
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          required
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
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
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {children}
      </div>
    </div>
  );
}