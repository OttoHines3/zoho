"use client";

import { useState } from "react";
import { Lock, Minus, Plus } from "lucide-react";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { z } from "zod";
import { api } from "~/trpc/react";
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const stripePromise: Promise<Stripe | null> = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm() {
    const [quantity, setQuantity] = useState(1);
    const [processing, setProcessing] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const stripe = useStripe();
    const elements = useElements();

    // TODO: Replace with correct API call if available
    // const createPaymentIntent = api.checkout.createPaymentIntent.useMutation();
    // For now, comment out the line above to avoid error

    const handleQuantity = (delta: number) => {
        setQuantity((q) => Math.max(1, Math.min(25, q + delta)));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setCardError(null);
        try {
            // 1. Create payment intent
            // const { clientSecret } = await createPaymentIntent.mutateAsync({ quantity });
            // setClientSecret(clientSecret);
            // if (!stripe || !elements) return;
            // 2. Confirm card payment
            // const result = await stripe.confirmCardPayment(clientSecret, {
            //     payment_method: {
            //         card: elements.getElement(CardElement)!,
            //     },
            // });
            // if (result.error) {
            //     setCardError(result.error.message ?? "Payment failed");
            // } else if (result.paymentIntent?.status === "succeeded") {
            //     // TODO: Redirect or show success
            // }
        } catch (err) {
            if (err && typeof err === "object" && "message" in err) {
                setCardError((err as { message?: string }).message ?? "Something went wrong");
            } else {
                setCardError("Something went wrong");
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Quantity Picker */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    How many modules do you need?
                </label>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className="rounded border w-10 h-10 flex items-center justify-center text-lg"
                        onClick={() => handleQuantity(-1)}
                        disabled={quantity <= 1 || processing}
                    >
                        <Minus />
                    </button>
                    <input
                        type="text"
                        readOnly
                        value={quantity}
                        className="w-12 text-center border rounded h-10 bg-slate-100 dark:bg-slate-700"
                    />
                    <button
                        type="button"
                        className="rounded border w-10 h-10 flex items-center justify-center text-lg"
                        onClick={() => handleQuantity(1)}
                        disabled={quantity >= 25 || processing}
                    >
                        <Plus />
                    </button>
                </div>
                <div className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                    $99 each × {quantity} = <span className="font-semibold">${99 * quantity}</span>
                </div>
            </div>

            {/* Section 2: Stripe Card Form */}
            <div>
                <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: "16px",
                                    color: "#1e293b",
                                    '::placeholder': { color: "#94a3b8" },
                                },
                                invalid: { color: "#ef4444" },
                            },
                        }}
                    />
                </div>
                {cardError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{cardError}</p>}
            </div>

            {/* CTA */}
            <button
                type="submit"
                disabled={quantity < 1 || !stripe || !elements || processing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                {processing ? "Processing..." : "Pay & Continue"}
            </button>
        </form>
    );
}

export default function CheckoutStep1Page() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 px-8 py-10">
                {/* Brand Logo */}
                <div className="flex justify-center mb-8">
                    <svg className="w-12 h-12 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Lock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Choose your plan</h1>
                    </div>
                </div>
                <Elements stripe={stripePromise}>
                    <CheckoutForm />
                </Elements>
            </div>
        </div>
    );
} 