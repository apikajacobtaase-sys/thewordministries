import type { ReactNode } from "react";
import AdminNavigation from "./AdminNavigation";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <AdminNavigation />

      <div className="min-w-0 lg:pl-[250px]">
        {children}
      </div>
    </div>
  );
}
