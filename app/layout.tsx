import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/sidebar-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pinterest Affiliate System",
  description: "Automation dashboard for Pinterest affiliate campaigns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <body className={`${inter.className} min-h-screen bg-muted/20`}>
        <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
          <aside className="border-r bg-background">
            <div className="sticky top-0 p-5">
              <h1 className="text-lg font-semibold">Pinterest System</h1>
              <p className="mt-1 text-xs text-muted-foreground">Affiliate Dashboard</p>
              <div className="mt-6">
                <SidebarNav />
              </div>
            </div>
          </aside>
          <main className="p-4 md:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
