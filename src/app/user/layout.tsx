import { Suspense, type ReactNode } from "react";
import UserSidebar from "@/components/UserSidebar";

export default function UserLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f7f5] lg:flex">
      <Suspense fallback={<div className="hidden lg:block w-64" />}>
        <UserSidebar />
      </Suspense>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}