import type { Metadata } from "next";
import { Geist, Syne } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "zenDoc — Document storage with a second lock",
  description:
    "A simpler document vault. Sign in to see your library. Enter a master password to share, download, or delete. Military-grade encryption on the server.",
  openGraph: {
    title: "zenDoc — Document storage with a second lock",
    description:
      "Share, download, or delete only with a master password. Military-grade server-side encryption holds the rest.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${syne.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>{children}</body>
    </html>
  );
}
