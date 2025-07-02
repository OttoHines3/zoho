"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "~/lib/cart-context";
import { Button } from "~/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function CheckoutSuccessPage() {
    const router = useRouter();
    const { dispatch } = useCart();

    // Clear the cart when reaching this page
    useEffect(() => {
        dispatch({ type: "CLEAR_CART" });
    }, [dispatch]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full mx-auto p-8">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Order Confirmed!</h1>
                    <p className="text-gray-600 mb-8">
                        Thank you for your purchase. We&apos;ll send you an email with your order details shortly.
                    </p>
                    <div className="space-y-4">
                        <Button
                            onClick={() => router.push("/dashboard")}
                            className="w-full bg-black text-white hover:bg-gray-800"
                        >
                            View Order Status
                        </Button>
                        <Button
                            onClick={() => router.push("/")}
                            variant="outline"
                            className="w-full"
                        >
                            Continue Shopping
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
} 