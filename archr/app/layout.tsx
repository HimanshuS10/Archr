import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
        <body
          className={`${raleway.className} ${raleway.variable} antialiased`}
        >
          {children}
        </body>
      </html>
  );
}
