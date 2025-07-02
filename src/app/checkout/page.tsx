"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useCart } from "~/lib/cart-context";

interface FormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    sameAsBilling: boolean;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { state } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "",
        sameAsBilling: true,
    });

    const getShippingFee = () => {
        return shippingMethod === "standard" ? 10 : 15;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!session?.user) {
            router.push("/signin?returnUrl=/checkout");
            return;
        }

        try {
            // Create invoice in Zoho Billing
            const response = await fetch("/api/billing/create-invoice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    items: [
                        ...state.items.map(item => ({
                            name: item.name,
                            description: item.description,
                            price: item.price,
                            quantity: item.quantity,
                        })),
                        {
                            name: `${shippingMethod === "standard" ? "Standard" : "Express"} Shipping`,
                            price: getShippingFee(),
                            quantity: 1,
                        },
                    ],
                    shippingDetails: {
                        name: formData.name,
                        address: formData.address,
                        city: formData.city,
                        state: formData.state,
                        zip: formData.zip,
                        country: formData.country,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create invoice");
            }

            const { invoiceId } = await response.json();

            // Redirect to Zoho Billing payment page
            window.location.href = `https://books.zoho.com/app#/invoices/${invoiceId}/pay`;
        } catch (err) {
            console.error("Checkout error:", err);
            setError("An error occurred while processing your order. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Shipping Information */}
                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Shipping Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="address">Address</Label>
                                            <Input
                                                id="address"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="city">City</Label>
                                                <Input
                                                    id="city"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="state">State</Label>
                                                <Input
                                                    id="state"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="zip">ZIP Code</Label>
                                                <Input
                                                    id="zip"
                                                    name="zip"
                                                    value={formData.zip}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="country">Country</Label>
                                                <Input
                                                    id="country"
                                                    name="country"
                                                    value={formData.country}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Shipping Method</Label>
                                            <Select
                                                value={shippingMethod}
                                                onValueChange={(value: "standard" | "express") => setShippingMethod(value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="standard">
                                                        Standard Shipping ($10)
                                                    </SelectItem>
                                                    <SelectItem value="express">
                                                        Express Shipping ($15)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="mt-6">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="sameAsBilling"
                                                    checked={formData.sameAsBilling}
                                                    onChange={handleInputChange}
                                                    className="rounded border-gray-300"
                                                />
                                                <span className="ml-2">Same as shipping for billing</span>
                                            </label>
                                        </div>
                                    </form>
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
                                        {state.items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span>
                                                    {item.name} x {item.quantity}
                                                </span>
                                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}

                                        <div className="border-t pt-4">
                                            <div className="flex justify-between text-sm">
                                                <span>Subtotal</span>
                                                <span>${state.total.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm mt-2">
                                                <span>Shipping</span>
                                                <span>${getShippingFee().toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <div className="flex justify-between text-lg font-semibold">
                                                <span>Total</span>
                                                <span>${(state.total + getShippingFee()).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full bg-black text-white hover:bg-gray-800"
                                            onClick={handleSubmit}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Processing..." : "Place Order"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 