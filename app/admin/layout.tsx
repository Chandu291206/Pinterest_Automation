import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-screen bg-muted/20 md:grid-cols-[240px_1fr]">
      {/* Desktop Sidebar */}
      <aside className="hidden border-r bg-background md:block">
        <div className="sticky top-0 p-5">
          <h1 className="text-lg font-semibold">Pinterest System</h1>
          <p className="mt-1 text-xs text-muted-foreground">Admin Dashboard</p>
          <div className="mt-6">
            <SidebarNav />
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="fixed top-4 left-4 z-40 md:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-64">
          <div className="p-5">
            <h1 className="text-lg font-semibold">Pinterest System</h1>
            <p className="mt-1 text-xs text-muted-foreground">Admin Dashboard</p>
            <div className="mt-6">
              <SidebarNav />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}
