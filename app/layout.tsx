import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
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
      <head>
        <meta name="p:domain_verify" content="13d82dacb6d96d58fe06ec43dbea2fcb"/>
      </head>
      <body className={`${inter.className} min-h-screen bg-white text-gray-900`}>
        {children}
        <footer className="border-t bg-white py-8">
          <div className="mx-auto w-full max-w-6xl px-4">
            <nav className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <Link href="/about" className="hover:underline">
                About
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/disclosure" className="hover:underline">
                Affiliate Disclosure
              </Link>
            </nav>
            <p className="mt-4 text-center text-xs text-gray-400">
              As an Amazon Associate I earn from qualifying purchases.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
