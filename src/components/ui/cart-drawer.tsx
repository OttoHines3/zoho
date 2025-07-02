"use client";

import { X, Plus, Minus } from "lucide-react";
import { Button } from "./button";
import { useCart } from "~/lib/cart-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { state, dispatch } = useCart();
    const router = useRouter();
    const { data: session } = useSession();

    const updateQuantity = (
        productId: string,
        variant: string,
        currentQuantity: number,
        change: number
    ) => {
        const newQuantity = currentQuantity + change;
        if (newQuantity < 1) {
            dispatch({
                type: "REMOVE_ITEM",
                payload: { productId, variant },
            });
        } else {
            dispatch({
                type: "UPDATE_QUANTITY",
                payload: { productId, variant, quantity: newQuantity },
            });
        }
    };

    const handleCheckout = () => {
        if (!session) {
            // Redirect to sign in if not authenticated
            router.push("/signin?returnUrl=/checkout");
            onClose();
            return;
        }

        // Redirect to payment page if authenticated
        router.push("/checkout");
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold">
                        You have {state.items.length} items in your cart
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {state.items.map((item) => (
                        <div
                            key={`${item.productId}-${item.variant}`}
                            className="flex items-start space-x-4 py-4 border-b last:border-0"
                        >
                            {/* Product Image Placeholder */}
                            <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                                <span className="text-gray-400 text-xs">Image</span>
                            </div>

                            <div className="flex-1">
                                <h3 className="font-medium">{item.title}</h3>
                                <p className="text-sm text-gray-600">{item.variant}</p>

                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="w-6 h-6"
                                            onClick={() =>
                                                updateQuantity(
                                                    item.productId,
                                                    item.variant,
                                                    item.quantity,
                                                    -1
                                                )
                                            }
                                        >
                                            <Minus className="w-3 h-3" />
                                        </Button>
                                        <span className="w-8 text-center">{item.quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="w-6 h-6"
                                            onClick={() =>
                                                updateQuantity(
                                                    item.productId,
                                                    item.variant,
                                                    item.quantity,
                                                    1
                                                )
                                            }
                                        >
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <span className="font-medium">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="border-t p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Subtotal</span>
                        <span className="font-medium">${state.total.toFixed(2)}</span>
                    </div>

                    <div className="space-y-2">
                        <Link href="/cart" className="block">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={onClose}
                            >
                                View Cart
                            </Button>
                        </Link>
                        <Button
                            className="w-full bg-black text-white hover:bg-gray-800"
                            onClick={handleCheckout}
                            disabled={state.items.length === 0}
                        >
                            Checkout
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
} 