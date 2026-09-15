import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Footer from "../src/components/Footer";
import LayoutWrapper from "../components/LayoutWrapper";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlatePilot",
  description: "PlatePilot - Eat Smart, Live Better",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <div className="flex-1">{children}</div>
        <Footer />
        <LayoutWrapper />
      </body>
    </html>
  );
}
