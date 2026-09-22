export type DemoRole = "user" | "admin";

type DemoSession = {
  name: string;
  role: DemoRole;
};

const sessionKey = "unicare_demo_session";

const accounts = [
  {
    email: "user@unicare.local",
    password: "User1234!",
    name: "ผู้ใช้ทดลอง",
    role: "user" as const,
  },
  {
    email: "admin@unicare.local",
    password: "Admin1234!",
    name: "ผู้ดูแลระบบทดลอง",
    role: "admin" as const,
  },
];

export function signInDemo(
  email: string,
  password: string,
  selectedRole: DemoRole,
): DemoSession | null {
  const account = accounts.find(
    (item) =>
      item.email === email.trim().toLowerCase() &&
      item.password === password &&
      item.role === selectedRole,
  );

  if (!account) return null;

  const session: DemoSession = {
    name: account.name,
    role: account.role,
  };

  sessionStorage.setItem(sessionKey, JSON.stringify(session));
  return session;
}

export function getDemoSession(): DemoSession | null {
  const stored = sessionStorage.getItem(sessionKey);
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
      return { name: parsed.name, role: parsed.role };
    }
  } catch {
    // ข้อมูลเก่าจากโค้ดบัญชีทดลองชุดก่อน
  }

  sessionStorage.removeItem(sessionKey);
  return null;
}

export function signOutDemo(): void {
  sessionStorage.removeItem(sessionKey);
}