import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { NavHeader } from "~/components/ui/nav-header";
import { CartProvider } from "~/lib/cart-context";

export const metadata: Metadata = {
  title: "Zoho Integration Portal",
  description: "A modern portal for managing your Zoho integration modules and payments.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <CartProvider>
            <NavHeader />
            {children}
          </CartProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
