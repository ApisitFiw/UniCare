"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  Check,
  CircleHelp,
  ClipboardList,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  Megaphone,
  MessageCircle,
  Newspaper,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Sprout,
  User,
  X,
} from "lucide-react";

import Header from "@/components/Header";

type Profile = {
  fullName: string;
  email: string;
  phone: string;
};

type AlertState = {
  type: "success" | "warning" | "error";
  title: string;
  message: string;
} | null;

const PROFILE_KEY = "unicare_demo_user_profile";

const defaultProfile: Profile = {
  fullName: "กิตติภูมิ ปราญนคร",
  email: "kittiphum@example.com",
  phone: "081-234-5678",
};

const menuItems = [
  { href: "/user", label: "หน้าหลัก", icon: Home },
  { href: "/user/report", label: "แจ้งปัญหา", icon: Megaphone },
  { href: "/user/my-reports", label: "รายการของฉัน", icon: ClipboardList },
  { href: "/news", label: "ข่าวสาร / ประกาศ", icon: Newspaper },
  { href: "/faq", label: "คำถามที่พบบ่อย", icon: CircleHelp },
  { href: "/contact", label: "ติดต่อเรา", icon: MessageCircle },
];

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`;
  return name.trim().slice(0, 2) || "U";
}

export default function UserProfilePage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [draft, setDraft] = useState<Profile>(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
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
    const saved = window.localStorage.getItem(PROFILE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Profile;
      setProfile(parsed);
      setDraft(parsed);
    } catch {
      window.localStorage.removeItem(PROFILE_KEY);
    }
  }, []);

  const initials = useMemo(() => getInitials(profile.fullName), [profile.fullName]);

  function startEditing() {
    setDraft(profile);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(profile);
    setIsEditing(false);
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = {
      fullName: draft.fullName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
    };

    if (!cleaned.fullName || !cleaned.email || !cleaned.phone) {
      setAlert({
        type: "warning",
        title: "ข้อมูลไม่ครบ",
        message: "กรุณากรอกข้อมูลส่วนตัวให้ครบทุกช่อง",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) {
      setAlert({
        type: "warning",
        title: "อีเมลไม่ถูกต้อง",
        message: "กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง",
      });
      return;
    }

    setProfile(cleaned);
    setDraft(cleaned);
    setIsEditing(false);
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(cleaned));
    setAlert({
      type: "success",
      title: "บันทึกข้อมูลสำเร็จ",
      message: "ข้อมูลส่วนตัวของคุณถูกบันทึกเรียบร้อยแล้ว",
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
        message: "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน",
      });
      return;
    }

    closePasswordModal();
    setAlert({
      type: "success",
      title: "เปลี่ยนรหัสผ่านสำเร็จ",
      message: "โหมดทดลอง: ระบบตรวจสอบข้อมูลและจำลองการเปลี่ยนรหัสผ่านแล้ว",
    });
  }

  return (
    <div className="min-h-screen bg-[#f4f8f6] text-slate-800 md:flex">
      
      <div className="min-w-0 flex-1">
        <Header
            title="บัญชีของฉัน"
            subtitle="จัดการข้อมูลส่วนตัวและความปลอดภัย"
            userName={profile.fullName}
            role="USER"
/>

        <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6 lg:p-8">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><User className="h-5 w-5" /></span>
                <div>
                  <h2 className="text-base font-bold">ข้อมูลส่วนตัว</h2>
                  <p className="text-xs text-slate-400">ตรวจสอบและแก้ไขข้อมูลพื้นฐานของบัญชี</p>
                </div>
              </div>
              {!isEditing && (
                <button type="button" onClick={startEditing} className="flex items-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50">
                  <Pencil className="h-3.5 w-3.5" /> แก้ไข
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-[260px_1fr]">
              <div className="flex flex-col items-center border-b border-slate-100 bg-slate-50/60 px-6 py-8 text-center md:border-b-0 md:border-r">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">{initials}</span>
                <h3 className="mt-4 font-bold">{profile.fullName}</h3>
                <p className="mt-1 text-xs text-slate-400">{profile.email}</p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> บัญชีใช้งานอยู่
                </span>
              </div>

              <form onSubmit={saveProfile} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
                <ProfileField label="ชื่อ - นามสกุล" icon={<User className="h-4 w-4" />} value={draft.fullName} disabled={!isEditing} onChange={(value) => setDraft({ ...draft, fullName: value })} />
                <ProfileField label="อีเมล" type="email" icon={<Mail className="h-4 w-4" />} value={draft.email} disabled={!isEditing} onChange={(value) => setDraft({ ...draft, email: value })} />
                <ProfileField label="เบอร์โทรศัพท์" type="tel" icon={<Phone className="h-4 w-4" />} value={draft.phone} disabled={!isEditing} onChange={(value) => setDraft({ ...draft, phone: value })} fullWidth />
                {isEditing && (
                  <div className="flex justify-end gap-3 sm:col-span-2">
                    <button type="button" onClick={cancelEditing} className="rounded-lg bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200">ยกเลิก</button>
                    <button type="submit" className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"><Save className="h-4 w-4" />บันทึกการเปลี่ยนแปลง</button>
                  </div>
                )}
              </form>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck className="h-5 w-5" /></span>
              <div><h2 className="text-base font-bold">ความปลอดภัย</h2><p className="text-xs text-slate-400">จัดการรหัสผ่านและความปลอดภัยของบัญชี</p></div>
            </div>
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><LockKeyhole className="h-5 w-5" /></span>
                <div><h3 className="text-sm font-bold">รหัสผ่าน</h3><p className="mt-1 text-xs text-slate-500">อัปเดตรหัสผ่านสำหรับเข้าใช้งานระบบ</p><p className="mt-1 text-[11px] text-slate-400">แนะนำให้เปลี่ยนรหัสผ่านเป็นระยะเพื่อเพิ่มความปลอดภัย</p></div>
              </div>
              <button type="button" onClick={() => setPasswordOpen(true)} className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-700"><KeyRound className="h-4 w-4" />เปลี่ยนรหัสผ่าน</button>
            </div>
          </section>
        </main>
      </div>

      {passwordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={closePasswordModal}>
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div className="flex gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><LockKeyhole className="h-5 w-5" /></span><div><h2 className="font-bold">เปลี่ยนรหัสผ่าน</h2><p className="mt-1 text-xs text-slate-400">กรอกรหัสผ่านปัจจุบันและกำหนดรหัสผ่านใหม่</p></div></div>
              <button type="button" aria-label="ปิด" onClick={closePasswordModal} className="rounded-full bg-slate-100 p-2 text-slate-500"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={changePassword} className="space-y-4 p-6">
              <PasswordField label="รหัสผ่านปัจจุบัน" value={passwords.current} visible={visible.current} onChange={(value) => setPasswords({ ...passwords, current: value })} onToggle={() => setVisible({ ...visible, current: !visible.current })} />
              <PasswordField label="รหัสผ่านใหม่" value={passwords.next} visible={visible.next} onChange={(value) => setPasswords({ ...passwords, next: value })} onToggle={() => setVisible({ ...visible, next: !visible.next })} />
              <PasswordField label="ยืนยันรหัสผ่านใหม่" value={passwords.confirm} visible={visible.confirm} onChange={(value) => setPasswords({ ...passwords, confirm: value })} onToggle={() => setVisible({ ...visible, confirm: !visible.confirm })} />
              <button type="button" onClick={() => { closePasswordModal(); setAlert({ type: "success", title: "ส่งคำขอแล้ว", message: "โหมดทดลอง: ระบบจำลองการส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว" }); }} className="text-xs font-bold text-emerald-700 hover:underline">ลืมรหัสผ่าน?</button>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={closePasswordModal} className="rounded-lg bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-600">ยกเลิก</button><button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white">บันทึกรหัสผ่านใหม่</button></div>
            </form>
          </div>
        </div>
      )}

      {alert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setAlert(null)}>
          <div role="alertdialog" className="w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${alert.type === "success" ? "bg-emerald-50 text-emerald-600" : alert.type === "warning" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"}`}>
              {alert.type === "success" ? <Check className="h-8 w-8" /> : <CircleHelp className="h-8 w-8" />}
            </span>
            <h2 className="mt-5 text-lg font-bold">{alert.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{alert.message}</p>
            <button type="button" onClick={() => setAlert(null)} className="mt-6 w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white">ตกลง</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileField({ label, icon, value, disabled, onChange, type = "text", fullWidth = false }: { label: string; icon: ReactNode; value: string; disabled: boolean; onChange: (value: string) => void; type?: string; fullWidth?: boolean }) {
  return <label className={fullWidth ? "sm:col-span-2" : ""}><span className="mb-2 block text-xs font-bold text-slate-600">{label}</span><span className={`flex items-center gap-3 rounded-xl border px-4 ${disabled ? "border-slate-100 bg-slate-50 text-slate-400" : "border-emerald-300 bg-white text-emerald-700 ring-2 ring-emerald-50"}`}>{icon}<input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-700 outline-none disabled:cursor-not-allowed" /></span></label>;
}

function PasswordField({ label, value, visible, onChange, onToggle }: { label: string; value: string; visible: boolean; onChange: (value: string) => void; onToggle: () => void }) {
  return <label><span className="mb-2 block text-xs font-bold text-slate-600">{label}</span><span className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-50"><LockKeyhole className="h-4 w-4 text-slate-400" /><input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 py-3 text-sm outline-none" /><button type="button" aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} onClick={onToggle} className="text-slate-400">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>;
}
