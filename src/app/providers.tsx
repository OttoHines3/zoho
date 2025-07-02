"use client";

import { CartProvider } from "~/lib/cart-context";
import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "~/trpc/react";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <TRPCReactProvider>
            <SessionProvider>
                <CartProvider>
                    {children}
                </CartProvider>
            </SessionProvider>
        </TRPCReactProvider>
    );
} 