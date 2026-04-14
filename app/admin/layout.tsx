import { SidebarNav } from "@/components/sidebar-nav";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-screen bg-muted/20 md:grid-cols-[240px_1fr]">
      <aside className="border-r bg-background">
        <div className="sticky top-0 p-5">
          <h1 className="text-lg font-semibold">Pinterest System</h1>
          <p className="mt-1 text-xs text-muted-foreground">Admin Dashboard</p>
          <div className="mt-6">
            <SidebarNav />
          </div>
        </div>
      </aside>
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}
