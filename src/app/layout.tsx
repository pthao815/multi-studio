import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AI Multi-Studio",
  description: "Generate social media content from any source",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-base">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-base text-slate-300 overflow-x-hidden`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
