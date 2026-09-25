"use client";

import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Leaf,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";

type Gender =
  | ""
  | "male"
  | "female"
  | "other"
  | "not-specified";

interface RegisterForm {
  prefix: string;
  firstName: string;
  lastName: string;
  nickname: string;
  gender: Gender;

  email: string;
  phone: string;
  birthDate: string;

  username: string;
  password: string;
  confirmPassword: string;
}

interface DemoRegisteredUser {
  id: string;

  prefix: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  gender?: Gender;

  email: string;
  phone?: string;
  birthDate?: string;

  username: string;
  password: string;
  role: "user";

  notifyReportStatus: boolean;
  notifyNews: boolean;
  showNameOnReport: boolean;
  anonymousReportDefault: boolean;

  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  createdAt: string;
}

const initialForm: RegisterForm = {
  prefix: "",
  firstName: "",
  lastName: "",
  nickname: "",
  gender: "",

  email: "",
  phone: "",
  birthDate: "",

  username: "",
  password: "",
  confirmPassword: "",
};

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<RegisterForm>(
      initialForm,
    );

  const [
    notifyReportStatus,
    setNotifyReportStatus,
  ] = useState(true);

  const [
    notifyNews,
    setNotifyNews,
  ] = useState(false);

  const [
    showNameOnReport,
    setShowNameOnReport,
  ] = useState(true);

  const [
    anonymousReportDefault,
    setAnonymousReportDefault,
  ] = useState(false);

  const [
    acceptedTerms,
    setAcceptedTerms,
  ] = useState(false);

  const [
    acceptedPrivacy,
    setAcceptedPrivacy,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [
    registerSuccess,
    setRegisterSuccess,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  useEffect(() => {
    if (anonymousReportDefault) {
      setShowNameOnReport(false);
    }
  }, [anonymousReportDefault]);

  function updateForm<
    K extends keyof RegisterForm,
  >(
    field: K,
    value: RegisterForm[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function validateForm() {
    const email =
      form.email
        .trim()
        .toLowerCase();

    const phone =
      form.phone.replace(
        /\D/g,
        "",
      );

    const username =
      form.username.trim();

    if (!form.prefix) {
      return "กรุณาเลือกคำนำหน้าชื่อ";
    }

    if (!form.firstName.trim()) {
      return "กรุณากรอกชื่อ";
    }

    if (!form.lastName.trim()) {
      return "กรุณากรอกนามสกุล";
    }

    if (!email) {
      return "กรุณากรอกอีเมล";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      return "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (
      phone &&
      !/^\d{9,10}$/.test(phone)
    ) {
      return "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9–10 หลัก";
    }

    if (!username) {
      return "กรุณากรอกชื่อผู้ใช้งาน";
    }

    if (username.length < 4) {
      return "ชื่อผู้ใช้งานต้องมีอย่างน้อย 4 ตัวอักษร";
    }

    if (
      !/^[a-zA-Z0-9._-]+$/.test(
        username,
      )
    ) {
      return "ชื่อผู้ใช้งานใช้ได้เฉพาะภาษาอังกฤษ ตัวเลข จุด ขีดกลาง และขีดล่าง";
    }

    if (!form.password) {
      return "กรุณากรอกรหัสผ่าน";
    }

    if (
      form.password.length < 8
    ) {
      return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    }

    if (
      !/[A-Za-z]/.test(
        form.password,
      )
    ) {
      return "รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว";
    }

    if (
      !/[0-9]/.test(form.password)
    ) {
      return "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว";
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      return "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน";
    }

    if (!acceptedTerms) {
      return "กรุณายอมรับเงื่อนไขการใช้งาน";
    }

    if (!acceptedPrivacy) {
      return "กรุณายอมรับนโยบายความเป็นส่วนตัว";
    }

    return "";
  }

  function resetForm() {
    setForm(initialForm);

    setNotifyReportStatus(true);
    setNotifyNews(false);
    setShowNameOnReport(true);
    setAnonymousReportDefault(false);

    setAcceptedTerms(false);
    setAcceptedPrivacy(false);

    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const storedUsers =
        localStorage.getItem(
          "unicare-demo-users",
        );

      let users: DemoRegisteredUser[] =
        [];

      if (storedUsers) {
        try {
          const parsed =
            JSON.parse(storedUsers);

          users = Array.isArray(parsed)
            ? parsed
            : [];
        } catch {
          users = [];
        }
      }

      const normalizedUsername =
        form.username
          .trim()
          .toLowerCase();

      const normalizedEmail =
        form.email
          .trim()
          .toLowerCase();

      const cleanedPhone =
        form.phone
          .replace(/\D/g, "")
          .slice(0, 10);

      const usernameAlreadyExists =
        users.some(
          (user) =>
            user.username.toLowerCase() ===
            normalizedUsername,
        );

      if (usernameAlreadyExists) {
        setError(
          "ชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น",
        );
        return;
      }

      const emailAlreadyExists =
        users.some(
          (user) =>
            user.email
              ?.trim()
              .toLowerCase() ===
            normalizedEmail,
        );

      if (emailAlreadyExists) {
        setError(
          "อีเมลนี้ถูกใช้ลงทะเบียนแล้ว กรุณาใช้อีเมลอื่น",
        );
        return;
      }

      const newUser: DemoRegisteredUser =
        {
          id: crypto.randomUUID(),

          prefix: form.prefix,
          firstName:
            form.firstName.trim(),
          lastName:
            form.lastName.trim(),

          nickname:
            form.nickname.trim() ||
            undefined,

          gender:
            form.gender ||
            undefined,

          email: normalizedEmail,

          phone:
            cleanedPhone ||
            undefined,

          birthDate:
            form.birthDate ||
            undefined,

          username:
            normalizedUsername,

          password:
            form.password,

          role: "user",

          notifyReportStatus,
          notifyNews,
          showNameOnReport,
          anonymousReportDefault,

          acceptedTerms,
          acceptedPrivacy,

          createdAt:
            new Date().toISOString(),
        };

      /*
       * บันทึกบัญชีสำหรับระบบ Login
       */
      localStorage.setItem(
        "unicare-demo-users",
        JSON.stringify([
          ...users,
          newUser,
        ]),
      );

      /*
       * สร้างข้อมูลเริ่มต้นสำหรับหน้า Profile
       * Storage Key ตรงกับหน้า /user/profile
       */
      const profileStorageKey =
        `unicare_demo_user_profile:${normalizedEmail}`;

      const profileData = {
        prefix: form.prefix,
        firstName:
          form.firstName.trim(),
        lastName:
          form.lastName.trim(),
        nickname:
          form.nickname.trim(),
        gender: form.gender,
        username:
          normalizedUsername,

        phone: cleanedPhone,
        birthDate:
          form.birthDate,

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

        notifyReportStatus,
        notifyNews,
        showNameOnReport,
        anonymousReportDefault,
      };

      localStorage.setItem(
        profileStorageKey,
        JSON.stringify(
          profileData,
        ),
      );

      resetForm();
      setRegisterSuccess(true);

      window.setTimeout(() => {
        router.replace("/login");
      }, 1800);
    } catch {
      setError(
        "ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:flex lg:items-center lg:justify-center lg:py-10">
      <section className="mx-auto grid w-full max-w-7xl overflow-hidden rounded-[30px] bg-white shadow-[0_25px_80px_rgba(15,74,62,0.16)] lg:grid-cols-[0.85fr_1.15fr]">
        {/* ด้านซ้าย */}
        <aside className="relative hidden min-h-[900px] overflow-hidden bg-gradient-to-br from-[#12836f] via-[#08705f] to-[#04493f] p-10 text-white lg:flex lg:flex-col">
          <div className="absolute -left-32 top-48 h-80 w-80 rounded-full bg-emerald-300/10" />

          <div className="absolute -bottom-40 -right-28 h-[440px] w-[440px] rounded-full bg-emerald-950/25" />

          <Link
            href="/"
            className="relative z-10 flex w-fit items-center gap-3"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
              <Leaf className="h-6 w-6 text-emerald-200" />
            </span>

            <span>
              <span className="block text-xl font-extrabold tracking-wide">
                UNICARE
              </span>

              <span className="block text-[10px] font-medium uppercase tracking-wider text-emerald-100">
                Walailak University
              </span>
            </span>
          </Link>

          <div className="relative z-10 mt-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 ring-1 ring-white/10">
              <UserPlus className="h-3.5 w-3.5" />
              Create Account
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-tight">
              เริ่มต้นเป็นส่วนหนึ่ง
              <br />
              ของ UNICARE
            </h1>

            <p className="mt-4 max-w-md text-sm leading-7 text-emerald-50/85">
              สร้างบัญชีสำหรับแจ้งปัญหา
              ติดตามความคืบหน้า
              รับข่าวสารและร่วมดูแลสภาพแวดล้อมภายในมหาวิทยาลัย
            </p>

            <div className="mt-7 space-y-3">
              <FeatureItem
                icon={
                  <FileText className="h-4 w-4" />
                }
                title="แจ้งและติดตามปัญหา"
                description="ตรวจสอบสถานะและประวัติคำร้องของคุณ"
              />

              <FeatureItem
                icon={
                  <Bell className="h-4 w-4" />
                }
                title="รับการแจ้งเตือน"
                description="รับข่าวสารเมื่อสถานะคำร้องมีการเปลี่ยนแปลง"
              />

              <FeatureItem
                icon={
                  <ShieldCheck className="h-4 w-4" />
                }
                title="ควบคุมความเป็นส่วนตัว"
                description="เลือกแสดงชื่อหรือแจ้งปัญหาแบบไม่เปิดเผยชื่อ"
              />
            </div>
          </div>

          <p className="relative z-10 mt-auto pt-8 text-[10px] text-emerald-100/70">
            © 2026 UniCare ·
            Walailak University
          </p>
        </aside>

        {/* ด้านขวา */}
        <section className="px-5 py-8 sm:px-10 lg:px-14 lg:py-10">
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-7 flex items-center gap-2 text-[#08705f] lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                <Leaf className="h-5 w-5" />
              </span>

              <span className="font-extrabold">
                UNICARE
              </span>
            </div>

            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <UserPlus className="h-6 w-6" />
                </div>

                <h2 className="mt-4 text-2xl font-extrabold text-slate-800">
                  ลงทะเบียนผู้ใช้งานใหม่
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  กรอกข้อมูลและตั้งค่าบัญชีสำหรับเข้าใช้งานระบบ
                  UNICARE
                </p>
              </div>

              <div className="hidden shrink-0 pt-2 text-right sm:block">
                <p className="text-[11px] text-slate-400">
                  มีบัญชีอยู่แล้ว?
                </p>

                <Link
                  href="/login"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 transition hover:text-emerald-900 hover:underline"
                >
                  กลับเข้าสู่ระบบ
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="mt-3 sm:hidden">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
              >
                มีบัญชีอยู่แล้ว?
                กลับเข้าสู่ระบบ
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {registerSuccess && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                <CheckCircle2 className="h-6 w-6 shrink-0" />

                <div>
                  <p className="text-sm font-bold">
                    สร้างบัญชีสำเร็จ
                  </p>

                  <p className="mt-0.5 text-xs">
                    กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-7"
            >
              {/* ข้อมูลผู้ใช้งาน */}
              <FormSection
                number="1"
                title="ข้อมูลผู้ใช้งาน"
                description="ข้อมูลส่วนตัวสำหรับแสดงในบัญชีและคำร้อง"
              >
                <div className="grid gap-4 sm:grid-cols-[0.7fr_1.15fr_1.15fr]">
                  <FormLabel
                    label="คำนำหน้าชื่อ"
                    required
                  >
                    <select
                      required
                      value={form.prefix}
                      onChange={(event) =>
                        updateForm(
                          "prefix",
                          event.target.value,
                        )
                      }
                      className={
                        inputClassName
                      }
                    >
                      <option value="">
                        เลือก
                      </option>

                      <option value="นาย">
                        นาย
                      </option>

                      <option value="นาง">
                        นาง
                      </option>

                      <option value="นางสาว">
                        นางสาว
                      </option>

                      <option value="อื่น ๆ">
                        อื่น ๆ
                      </option>
                    </select>
                  </FormLabel>

                  <FormLabel
                    label="ชื่อ"
                    required
                  >
                    <input
                      type="text"
                      required
                      value={
                        form.firstName
                      }
                      onChange={(event) =>
                        updateForm(
                          "firstName",
                          event.target.value,
                        )
                      }
                      placeholder="กรอกชื่อ"
                      className={
                        inputClassName
                      }
                    />
                  </FormLabel>

                  <FormLabel
                    label="นามสกุล"
                    required
                  >
                    <input
                      type="text"
                      required
                      value={
                        form.lastName
                      }
                      onChange={(event) =>
                        updateForm(
                          "lastName",
                          event.target.value,
                        )
                      }
                      placeholder="กรอกนามสกุล"
                      className={
                        inputClassName
                      }
                    />
                  </FormLabel>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <FormLabel
                    label="ชื่อเล่น"
                    optional
                  >
                    <input
                      type="text"
                      value={
                        form.nickname
                      }
                      onChange={(event) =>
                        updateForm(
                          "nickname",
                          event.target.value,
                        )
                      }
                      placeholder="กรอกชื่อเล่น"
                      className={
                        inputClassName
                      }
                    />
                  </FormLabel>

                  <FormLabel
                    label="เพศ"
                    optional
                  >
                    <select
                      value={form.gender}
                      onChange={(event) =>
                        updateForm(
                          "gender",
                          event.target
                            .value as Gender,
                        )
                      }
                      className={
                        inputClassName
                      }
                    >
                      <option value="">
                        ไม่ระบุ
                      </option>

                      <option value="male">
                        ชาย
                      </option>

                      <option value="female">
                        หญิง
                      </option>

                      <option value="other">
                        อื่น ๆ
                      </option>

                      <option value="not-specified">
                        ไม่ต้องการระบุ
                      </option>
                    </select>
                  </FormLabel>
                </div>

                <div className="mt-4">
                  <FormLabel
                    label="อีเมล"
                    required
                  >
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={(event) =>
                          updateForm(
                            "email",
                            event.target.value,
                          )
                        }
                        placeholder="example@email.com"
                        className={`${inputClassName} pl-10`}
                      />
                    </div>
                  </FormLabel>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <FormLabel
                    label="เบอร์โทรศัพท์"
                    optional
                  >
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={form.phone}
                        onChange={(event) =>
                          updateForm(
                            "phone",
                            event.target.value
                              .replace(
                                /\D/g,
                                "",
                              )
                              .slice(
                                0,
                                10,
                              ),
                          )
                        }
                        placeholder="เช่น 0812345678"
                        className={`${inputClassName} pl-10`}
                      />
                    </div>
                  </FormLabel>

                  <FormLabel
                    label="วันเกิด"
                    optional
                  >
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="date"
                        value={
                          form.birthDate
                        }
                        onChange={(event) =>
                          updateForm(
                            "birthDate",
                            event.target.value,
                          )
                        }
                        className={`${inputClassName} pl-10`}
                      />
                    </div>
                  </FormLabel>
                </div>
              </FormSection>

              {/* ข้อมูลบัญชี */}
              <FormSection
                number="2"
                title="ข้อมูลบัญชี"
                description="ชื่อผู้ใช้งานและรหัสผ่านสำหรับเข้าสู่ระบบ"
              >
                <FormLabel
                  label="ชื่อผู้ใช้งาน"
                  required
                >
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={form.username}
                      onChange={(event) =>
                        updateForm(
                          "username",
                          event.target.value,
                        )
                      }
                      placeholder="ตั้งชื่อผู้ใช้งานอย่างน้อย 4 ตัวอักษร"
                      className={`${inputClassName} pl-10`}
                    />
                  </div>
                </FormLabel>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <FormLabel
                    label="รหัสผ่าน"
                    required
                  >
                    <PasswordInput
                      value={
                        form.password
                      }
                      visible={
                        showPassword
                      }
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                      onChange={(value) =>
                        updateForm(
                          "password",
                          value,
                        )
                      }
                      onToggle={() =>
                        setShowPassword(
                          (previous) =>
                            !previous,
                        )
                      }
                    />
                  </FormLabel>

                  <FormLabel
                    label="ยืนยันรหัสผ่าน"
                    required
                  >
                    <PasswordInput
                      value={
                        form.confirmPassword
                      }
                      visible={
                        showConfirmPassword
                      }
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                      onChange={(value) =>
                        updateForm(
                          "confirmPassword",
                          value,
                        )
                      }
                      onToggle={() =>
                        setShowConfirmPassword(
                          (previous) =>
                            !previous,
                        )
                      }
                    />
                  </FormLabel>
                </div>

                <p className="mt-2 text-[10px] leading-5 text-slate-400">
                  รหัสผ่านต้องมีอย่างน้อย 8
                  ตัวอักษร
                  และประกอบด้วยตัวอักษรภาษาอังกฤษกับตัวเลข
                </p>
              </FormSection>

              {/* การตั้งค่า */}
              <FormSection
                number="3"
                title="การแจ้งเตือนและความเป็นส่วนตัว"
                description="สามารถกลับมาแก้ไขภายหลังได้ในหน้าจัดการบัญชี"
              >
                <div className="space-y-3">
                  <SettingSwitch
                    title="แจ้งเตือนเมื่อสถานะคำร้องเปลี่ยนแปลง"
                    description="รับแจ้งเตือนเมื่อเจ้าหน้าที่รับเรื่องหรืออัปเดตสถานะ"
                    checked={
                      notifyReportStatus
                    }
                    onChange={
                      setNotifyReportStatus
                    }
                  />

                  <SettingSwitch
                    title="รับข่าวสารและประกาศ"
                    description="รับข่าวสารเกี่ยวกับมหาวิทยาลัยและสิ่งแวดล้อม"
                    checked={
                      notifyNews
                    }
                    onChange={
                      setNotifyNews
                    }
                  />

                  <SettingSwitch
                    title="แสดงชื่อของฉันในคำร้อง"
                    description="เจ้าหน้าที่สามารถเห็นชื่อเจ้าของคำร้องได้"
                    checked={
                      showNameOnReport
                    }
                    disabled={
                      anonymousReportDefault
                    }
                    onChange={
                      setShowNameOnReport
                    }
                  />

                  <SettingSwitch
                    title="แจ้งปัญหาแบบไม่เปิดเผยชื่อเป็นค่าเริ่มต้น"
                    description="ซ่อนชื่อของคุณเมื่อสร้างคำร้องใหม่"
                    checked={
                      anonymousReportDefault
                    }
                    onChange={
                      setAnonymousReportDefault
                    }
                  />
                </div>
              </FormSection>

              {/* ข้อตกลง */}
              <FormSection
                number="4"
                title="ข้อตกลงและการยืนยัน"
                description="โปรดอ่านและยืนยันก่อนสร้างบัญชี"
              >
                <div className="space-y-3">
                  <ConsentCheckbox
                    checked={
                      acceptedTerms
                    }
                    onChange={
                      setAcceptedTerms
                    }
                  >
                    ฉันยอมรับ{" "}
                    <Link
                      href="/terms"
                      className="font-bold text-emerald-700 hover:underline"
                    >
                      เงื่อนไขการใช้งาน
                    </Link>{" "}
                    ของระบบ UNICARE
                  </ConsentCheckbox>

                  <ConsentCheckbox
                    checked={
                      acceptedPrivacy
                    }
                    onChange={
                      setAcceptedPrivacy
                    }
                  >
                    ฉันยอมรับ{" "}
                    <Link
                      href="/privacy"
                      className="font-bold text-emerald-700 hover:underline"
                    >
                      นโยบายความเป็นส่วนตัว
                    </Link>{" "}
                    และการจัดเก็บข้อมูลที่จำเป็น
                  </ConsentCheckbox>
                </div>
              </FormSection>

              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium leading-5 text-rose-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  registerSuccess
                }
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#119c78] to-[#08705f] text-sm font-bold text-white shadow-md shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {registerSuccess ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}

                {isSubmitting
                  ? "กำลังสร้างบัญชี..."
                  : registerSuccess
                    ? "สร้างบัญชีสำเร็จ"
                    : "สร้างบัญชี"}
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex max-w-sm items-center gap-4 rounded-2xl border border-white/10 bg-black/10 p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-100">
        {icon}
      </span>

      <span>
        <span className="block text-xs font-bold">
          {title}
        </span>

        <span className="mt-1 block text-[10px] leading-4 text-emerald-100/75">
          {description}
        </span>
      </span>
    </div>
  );
}

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-800">
          {number}
        </span>

        <div>
          <h3 className="text-sm font-extrabold text-slate-800">
            {title}
          </h3>

          <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function FormLabel({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}

        {optional && (
          <span className="ml-1 font-normal text-slate-400">
            (ไม่บังคับ)
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

function PasswordInput({
  value,
  visible,
  placeholder,
  onChange,
  onToggle,
}: {
  value: string;
  visible: boolean;
  placeholder: string;
  onChange: (
    value: string,
  ) => void;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      <input
        type={
          visible
            ? "text"
            : "password"
        }
        required
        autoComplete="new-password"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={placeholder}
        className={`${inputClassName} pl-10 pr-10`}
      />

      <button
        type="button"
        onClick={onToggle}
        aria-label={
          visible
            ? "ซ่อนรหัสผ่าน"
            : "แสดงรหัสผ่าน"
        }
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-emerald-700"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function SettingSwitch({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (
    checked: boolean,
  ) => void;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition ${
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
          : "cursor-pointer border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30"
      }`}
    >
      <span>
        <span className="block text-xs font-bold text-slate-700">
          {title}
        </span>

        <span className="mt-1 block text-[10px] leading-4 text-slate-400">
          {description}
        </span>
      </span>

      <span className="relative shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.checked,
            )
          }
          className="peer sr-only"
        />

        <span className="block h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-emerald-600 peer-focus:ring-4 peer-focus:ring-emerald-100">
          <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
        </span>
      </span>
    </label>
  );
}

function ConsentCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (
    checked: boolean,
  ) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:border-emerald-200 hover:bg-emerald-50/30">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked,
          )
        }
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-700"
      />

      <span className="text-xs leading-5 text-slate-500">
        {children}
      </span>
    </label>
  );
}