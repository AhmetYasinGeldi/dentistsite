import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// latin-ext: Türkçe karakterler (ğ, ş, ı, İ) için gerekli.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

// Geçici; klinik adı belirlenince güncellenecek.
export const metadata: Metadata = {
  title: "Diş Kliniği",
  description: "WhatsApp üzerinden kolayca randevu alın.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
