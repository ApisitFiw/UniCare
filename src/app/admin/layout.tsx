import type { ReactNode } from "react";
import DashboardSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f7f5] md:flex">
      <DashboardSidebar />

      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}