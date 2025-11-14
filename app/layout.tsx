import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Curium Item Master Quality Check",
  description:
    "Upload and validate Item Master spreadsheets, review issues, and generate AI summaries.",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/rules", label: "Rules" },
  { href: "/roadmap", label: "Roadmap" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <nav className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Internal Prototype
                </span>
                <p className="text-sm font-semibold tracking-wide text-slate-800">
                  Curium Data Quality Studio
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden items-center gap-4 text-sm text-slate-600 md:flex">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="transition hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <span className="text-xs font-medium text-slate-400">
                  demo.user@curium-internal.com
                </span>
              </div>
            </div>
          </nav>
          <main className="flex-1 w-full">
            <div className="mx-auto max-w-6xl px-4 py-8 md:py-10 lg:py-12">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

