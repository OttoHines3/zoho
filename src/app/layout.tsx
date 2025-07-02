"use client";

import "~/styles/globals.css";
import { Geist } from "next/font/google";
import { NavHeader } from "~/components/ui/nav-header";
import { Providers } from "./providers";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <head>
        <title>Zoho Integration Portal</title>
        <meta name="description" content="A modern portal for managing your Zoho integration modules and payments." />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Providers>
          <NavHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
