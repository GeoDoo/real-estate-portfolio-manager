import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Real Estate Portfolio Manager",
  description:
    "Professional real estate investment analysis and portfolio management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav
          className="shadow h-16 flex items-center w-full mb-8 fixed top-0 left-0 right-0 z-[100]"
          style={{ background: "var(--card)" }}
        >
          <div className="max-w-6xl mx-auto w-full flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <a
                href="/"
                className="text-xl font-bold"
                style={{ color: "var(--primary)" }}
              >
                Geoshan Properties Ltd
              </a>
              <a
                href="/portfolios"
                className="text-base font-medium transition-colors hover:underline"
                style={{ color: "var(--text-muted)" }}
              >
                Portfolios
              </a>
              <a
                href="/library"
                className="text-base font-medium transition-colors hover:underline"
                style={{ color: "var(--text-muted)" }}
              >
                Library
              </a>
            </div>
          </div>
        </nav>
        <div className="pt-20">
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
