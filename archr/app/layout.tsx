import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/landing/navbar";
import { PostHogProvider } from "./providers";
import { PostHogPageView } from "./pageview";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Archr - AI Calendar Optimizer",
  description:
    "Archr helps students auto-schedule coursework by parsing syllabi, syncing calendars, and re-optimizing when plans change.",
  icons: {
    icon: "/Logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className} antialiased`}>
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}