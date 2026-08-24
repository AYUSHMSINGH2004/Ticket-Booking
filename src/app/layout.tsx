import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BookMyShow Clone",
  description: "High-performance ticket booking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased selection:bg-accent selection:text-white`}>
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 pb-24">
          {children}
        </main>
      </body>
    </html>
  );
}
