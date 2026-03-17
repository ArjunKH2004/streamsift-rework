import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StreamSift - Understand Your Audience. Instantly.",
  description:
    "Real-time audience intelligence tool for streamers and content creators. Get instant clarity on your audience engagement.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-space">{children}</div>
      </body>
    </html>
  );
}
