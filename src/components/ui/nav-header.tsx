"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { Button } from "./button";
import { useCart } from "~/lib/cart-context";
import { CartDrawer } from "./cart-drawer";

export function NavHeader() {
    const { state } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const cartItemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <>
            <header className="bg-white border-b">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo and primary navigation */}
                        <div className="flex items-center">
                            <Link href="/" className="text-xl font-bold text-gray-900 mr-8">
                                Zoho Store
                            </Link>
                            <div className="hidden md:flex items-center space-x-8">
                                <Link href="/" className="text-gray-600 hover:text-gray-900">
                                    Home
                                </Link>
                                <Link href="/products" className="text-gray-600 hover:text-gray-900">
                                    Products
                                </Link>
                            </div>
                        </div>

                        {/* Secondary Navigation */}
                        <div className="flex items-center space-x-4">
                            <Link href="/signin">
                                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                                    <User className="w-5 h-5 mr-2" />
                                    Login
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                className="text-gray-600 hover:text-gray-900 relative"
                                onClick={() => setIsCartOpen(true)}
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Cart
                                {cartItemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {cartItemCount}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </nav>
            </header>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
} 