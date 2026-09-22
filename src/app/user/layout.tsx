import type { ReactNode } from "react";
import UserSidebar from "@/components/UserSidebar";

export default function UserLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f7f5] md:flex">
      <UserSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}