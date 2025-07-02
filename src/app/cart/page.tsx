"use client";

import { useCart } from "~/lib/cart-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
    const { state, dispatch } = useCart();

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

    const removeItem = (productId: string, variant: string) => {
        dispatch({
            type: "REMOVE_ITEM",
            payload: { productId, variant },
        });
    };

    if (state.items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
                            <p className="text-gray-600 mb-4">
                                Add some Zoho integration modules to get started.
                            </p>
                            <Link href="/">
                                <Button>Browse Modules</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Shopping Cart</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {state.items.map((item) => (
                                        <div
                                            key={`${item.productId}-${item.variant}`}
                                            className="flex items-center justify-between py-4 border-b last:border-0"
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-medium">{item.title}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Variant: {item.variant}
                                                </p>
                                            </div>

                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.productId,
                                                                item.variant,
                                                                item.quantity,
                                                                -1
                                                            )
                                                        }
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-8 text-center">{item.quantity}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.productId,
                                                                item.variant,
                                                                item.quantity,
                                                                1
                                                            )
                                                        }
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="w-24 text-right">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => removeItem(item.productId, item.variant)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-base font-medium">
                                        <span>Subtotal</span>
                                        <span>${state.total.toFixed(2)}</span>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between text-lg font-semibold">
                                            <span>Total</span>
                                            <span>${state.total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <Link href="/checkout/step-1" className="block">
                                        <Button className="w-full bg-black text-white hover:bg-gray-800">
                                            Proceed to Checkout
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
} 