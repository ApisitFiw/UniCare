export type DemoRole = "user" | "admin";

export type DemoSession = {
  name: string;
  role: DemoRole;
  email?: string;
};

export type AdminAccountConfig = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "admin";
  status: "active";
};

export const ADMIN_ACCOUNTS: AdminAccountConfig[] = [
  {
    id: 101,
    name: "นัฐกรณ์",
    email: "Natthakon030948@gmail.com",
    phone: "089-876-5432",
    role: "admin",
    status: "active",
  },
  {
    id: 102,
    name: "Chanokporn",
    email: "Chanokporn0953inbluesky@gmail.com",
    phone: "081-111-2233",
    role: "admin",
    status: "active",
  },
  {
    id: 103,
    name: "Apisit",
    email: "a0611862595@gmail.com",
    phone: "082-222-3344",
    role: "admin",
    status: "active",
  },
  {
    id: 104,
    name: "กฤตภาส",
    email: "niceseeza90@gmail.com",
    phone: "083-333-4455",
    role: "admin",
    status: "active",
  },
  {
    id: 105,
    name: "Natthaphum",
    email: "sriviboon7710@gmail.com",
    phone: "084-444-5566",
    role: "admin",
    status: "active",
  },
  {
    id: 106,
    name: "Kittipoom",
    email: "chimon.ny.w@gmail.com",
    phone: "085-555-6677",
    role: "admin",
    status: "active",
  },
  {
    id: 107,
    name: "Achiraya",
    email: "jiranyanov1980@gmail.com",
    phone: "086-666-7788",
    role: "admin",
    status: "active",
  },
];

export type UserAccountConfig = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "user";
  status: "active" | "suspended" | "deleted";
};

export const USER_ACCOUNTS: UserAccountConfig[] = [
  {
    id: 1,
    name: "กิตติภูมิ",
    email: "kittipoom@example.com",
    phone: "081-234-5678",
    role: "user",
    status: "active",
  },
  {
    id: 2,
    name: "สมชาย ใจดี",
    email: "somchai@example.com",
    phone: "082-345-6789",
    role: "user",
    status: "active",
  },
  {
    id: 3,
    name: "นภัสสร แสงทอง",
    email: "napatsorn@example.com",
    phone: "083-456-7890",
    role: "user",
    status: "active",
  },
  {
    id: 4,
    name: "ธนกร รักเรียน",
    email: "thanakorn@example.com",
    phone: "084-567-8901",
    role: "user",
    status: "suspended",
  },
  {
    id: 5,
    name: "กิตติพงษ์ ศรีสุข",
    email: "kittipong@example.com",
    phone: "085-678-9012",
    role: "user",
    status: "active",
  },
  {
    id: 6,
    name: "พิมพ์ชนก วัฒนะ",
    email: "pimchanok@example.com",
    phone: "086-789-0123",
    role: "user",
    status: "active",
  },
];

export function getActiveUserAccounts(): UserAccountConfig[] {
  if (typeof window === "undefined") return USER_ACCOUNTS;
  try {
    const saved = window.localStorage.getItem("unicare_demo_system_users");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const users = parsed.filter(
          (u: any) => u.role !== "admin" && u.id < 100,
        );
        if (users.length > 0) {
          return users.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: "user" as const,
            status: (u.status === "deleted"
              ? "deleted"
              : u.status === "suspended"
                ? "suspended"
                : "active") as "active" | "suspended" | "deleted",
          }));
        }
      }
    }
  } catch {}
  return USER_ACCOUNTS;
}

const sessionKey = "unicare_demo_session";

export type SignInResult = {
  success: boolean;
  session: DemoSession | null;
  error?: string;
};

export function signInDemoExtended(
  email: string,
  password: string,
  selectedRole: DemoRole,
): SignInResult {
  const cleanEmail = email.trim().toLowerCase();

  if (selectedRole === "admin") {
    const adminAcc = ADMIN_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === cleanEmail,
    );

    let matchedAccount: { name: string; email: string; phone: string } | null =
      null;

    if (adminAcc) {
      if (password === "12345" || password === "Admin1234!") {
        matchedAccount = adminAcc;
      } else {
        return {
          success: false,
          session: null,
          error: "รหัสผ่านไม่ถูกต้อง (สำหรับ Admin ใช้ 12345)",
        };
      }
    } else if (cleanEmail === "admin@unicare.local") {
      if (password === "12345" || password === "Admin1234!") {
        matchedAccount = ADMIN_ACCOUNTS[0]; // นัฐกรณ์
      } else {
        return {
          success: false,
          session: null,
          error: "รหัสผ่านไม่ถูกต้อง (สำหรับ Admin ใช้ 12345)",
        };
      }
    }

    if (!matchedAccount) {
      return {
        success: false,
        session: null,
        error: "อีเมล หรือประเภทบัญชีไม่ถูกต้องสำหรับผู้ดูแลระบบ",
      };
    }

    let effectiveName = matchedAccount.name;
    let effectivePhone = matchedAccount.phone;

    if (typeof window !== "undefined") {
      try {
        const savedUsers = window.localStorage.getItem(
          "unicare_demo_system_users",
        );
        if (savedUsers) {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed)) {
            const found = parsed.find(
              (u: any) =>
                u.email?.toLowerCase() === matchedAccount!.email.toLowerCase(),
            );
            if (found?.status === "suspended") {
              return {
                success: false,
                session: null,
                error: `บัญชีผู้ดูแลระบบ (${found?.name || matchedAccount.name}) ถูกระงับการใช้งานในระบบ`,
              };
            }
            if (found?.name) effectiveName = found.name;
            if (found?.phone) effectivePhone = found.phone;
          }
        }
      } catch {}

      const adminProfile = {
        fullName: effectiveName,
        email: matchedAccount.email,
        phone: effectivePhone,
      };

      window.localStorage.setItem(
        "unicare_demo_admin_profile",
        JSON.stringify(adminProfile),
      );
    }

    const session: DemoSession = {
      name: effectiveName,
      role: "admin",
      email: matchedAccount.email,
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem(sessionKey, JSON.stringify(session));
      localStorage.setItem(sessionKey, JSON.stringify(session));
      window.dispatchEvent(new Event("unicare-profile-updated"));
    }

    return { success: true, session };
  }

  // selectedRole === "user"
  let matchedUser = USER_ACCOUNTS.find(
    (u) => u.email.toLowerCase() === cleanEmail,
  );

  // Check alias user@unicare.local
  if (!matchedUser && cleanEmail === "user@unicare.local") {
    matchedUser = USER_ACCOUNTS[0]; // กิตติภูมิ
  }

  // Check in unicare_demo_system_users for dynamically added/edited users
  let effectiveName = matchedUser?.name || "";
  let effectivePhone = matchedUser?.phone || "";
  let effectiveStatus = matchedUser?.status || "active";
  let matchedEmail = matchedUser?.email || cleanEmail;

  if (typeof window !== "undefined") {
    try {
      const savedUsers = window.localStorage.getItem(
        "unicare_demo_system_users",
      );
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed)) {
          const found = parsed.find(
            (u: any) =>
              u.role !== "admin" &&
              (u.email?.toLowerCase() === cleanEmail ||
                (cleanEmail === "user@unicare.local" && u.id === 1)),
          );
          if (found) {
            matchedUser = {
              id: found.id,
              name: found.name,
              email: found.email,
              phone: found.phone,
              role: "user",
              status: found.status || "active",
            };
            effectiveName = found.name;
            effectivePhone = found.phone;
            effectiveStatus = found.status || "active";
            matchedEmail = found.email;
          }
        }
      }
    } catch {}
  }

  if (!matchedUser) {
    return {
      success: false,
      session: null,
      error: "อีเมล หรือประเภทบัญชีไม่ถูกต้องสำหรับผู้ใช้งานทั่วไป",
    };
  }

  // Check password (12345 or User1234!)
  if (password !== "12345" && password !== "User1234!") {
    return {
      success: false,
      session: null,
      error: "รหัสผ่านไม่ถูกต้อง (สำหรับ Demo ใช้ 12345 หรือ User1234!)",
    };
  }

  // Check deleted status
  if (effectiveStatus === "deleted") {
    return {
      success: false,
      session: null,
      error: `บัญชีของคุณ (${effectiveName || matchedUser.name}) ถูกลบออกจากระบบ กรุณาติดต่อผู้ดูแลระบบเพื่อกู้คืนบัญชี`,
    };
  }

  // Check suspended status
  if (effectiveStatus === "suspended") {
    return {
      success: false,
      session: null,
      error: `บัญชีของคุณ (${effectiveName || matchedUser.name}) ถูกระงับการใช้งานในระบบจัดการบัญชี กรุณาติดต่อผู้ดูแลระบบ`,
    };
  }

  if (typeof window !== "undefined") {
    const userProfile = {
      fullName: effectiveName || matchedUser.name,
      email: matchedEmail,
      phone: effectivePhone || matchedUser.phone,
    };

    window.localStorage.setItem(
      "unicare_demo_user_profile",
      JSON.stringify(userProfile),
    );
  }

  const session: DemoSession = {
    name: effectiveName || matchedUser.name,
    role: "user",
    email: matchedEmail,
  };

  if (typeof window !== "undefined") {
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    localStorage.setItem(sessionKey, JSON.stringify(session));
    window.dispatchEvent(new Event("unicare-profile-updated"));
  }

  return { success: true, session };
}

export function signInDemo(
  email: string,
  password: string,
  selectedRole: DemoRole,
): DemoSession | null {
  const result = signInDemoExtended(email, password, selectedRole);
  return result.session;
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  const stored =
    sessionStorage.getItem(sessionKey) || localStorage.getItem(sessionKey);
  if (!stored) return null;

  try {
    const parsed: unknown = JSON.parse(stored);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "name" in parsed &&
      "role" in parsed &&
      typeof parsed.name === "string" &&
      (parsed.role === "user" || parsed.role === "admin")
    ) {
      let resolvedName = parsed.name;
      const parsedEmail =
        "email" in parsed && typeof parsed.email === "string"
          ? parsed.email
          : undefined;

      if (
        parsed.role === "user" &&
        (resolvedName === "ผู้ใช้ทดลอง" ||
          resolvedName === "กิตติภูมิ ปราชญนคร" ||
          resolvedName === "กิตติภูมิ ปราญนคร")
      ) {
        resolvedName = "กิตติภูมิ";
      } else if (
        parsed.role === "admin" &&
        (resolvedName === "ผู้ดูแลระบบทดลอง" ||
          resolvedName === "กิตติภูมิ ปราชญนคร" ||
          resolvedName === "กิตติภูมิ ปราชญากร" ||
          resolvedName === "นายนัฐกรณ์ ไพรพฤกษ์")
      ) {
        resolvedName = "นัฐกรณ์";
      }

      const session: DemoSession = {
        name: resolvedName,
        role: parsed.role,
        email: parsedEmail,
      };
      return session;
    }
  } catch {
    // ข้อมูลเก่าจากโค้ดบัญชีทดลองชุดก่อน
  }

  sessionStorage.removeItem(sessionKey);
  localStorage.removeItem(sessionKey);
  return null;
}

export function signOutDemo(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(sessionKey);
    localStorage.removeItem(sessionKey);
  }
}