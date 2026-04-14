import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Curated Picks",
  description: "Curated product picks, tested and loved.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <body className={`${inter.className} min-h-screen bg-white text-gray-900`}>{children}</body>
    </html>
  );
}
