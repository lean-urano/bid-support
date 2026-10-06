import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AdminHeader />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
        <AdminSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
