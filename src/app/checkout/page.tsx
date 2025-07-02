"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "~/lib/cart-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function CheckoutPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { state } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [shippingMethod, setShippingMethod] = useState("standard");
    const [error, setError] = useState("");

    // Redirect to sign in if not authenticated
    useEffect(() => {
        if (!session) {
            router.push("/signin?returnUrl=/checkout");
        }
    }, [session, router]);

    // Redirect if cart is empty
    useEffect(() => {
        if (state.items.length === 0) {
            router.push("/");
        }
    }, [state.items, router]);

    const [formData, setFormData] = useState({
        fullname: "",
        phone: "",
        address1: "",
        address2: "",
        city: "",
        zipCode: "",
        country: "Philippines",
        sameAsBilling: true,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const getShippingFee = () => shippingMethod === "standard" ? 10 : 15;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // TODO: Implement your payment processing logic here
            // For example:
            // 1. Validate the form data
            // 2. Create a payment intent with your payment provider
            // 3. Process the payment
            // 4. Create the order in your database
            // 5. Clear the cart
            // 6. Redirect to success page

            const orderData = {
                items: state.items,
                shipping: {
                    ...formData,
                    method: shippingMethod,
                    fee: getShippingFee(),
                },
                total: state.total + getShippingFee(),
                user: session?.user,
            };

            console.log("Processing order:", orderData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For now, just redirect to a success page
            router.push("/checkout/success");
        } catch (err) {
            console.error("Checkout error:", err);
            setError("An error occurred while processing your order. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
                    {/* Shipping Form */}
                    <div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-6">Shipping Address</h2>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="fullname">Fullname *</Label>
                                    <Input
                                        id="fullname"
                                        name="fullname"
                                        value={formData.fullname}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="address1">Address 1 *</Label>
                                    <Input
                                        id="address1"
                                        name="address1"
                                        value={formData.address1}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="address2">Address 2</Label>
                                    <Input
                                        id="address2"
                                        name="address2"
                                        value={formData.address2}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="city">City *</Label>
                                        <Input
                                            id="city"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="zipCode">Zip Code *</Label>
                                        <Input
                                            id="zipCode"
                                            name="zipCode"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="country">Country *</Label>
                                    <Input
                                        id="country"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        required
                                    />
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
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow mt-6">
                            <h2 className="text-xl font-semibold mb-6">Delivery Method</h2>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer">
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            name="delivery"
                                            value="standard"
                                            checked={shippingMethod === "standard"}
                                            onChange={(e) => setShippingMethod(e.target.value)}
                                        />
                                        <span className="ml-2">Standard Shipping</span>
                                    </div>
                                    <span>$10.00</span>
                                </label>
                                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer">
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            name="delivery"
                                            value="express"
                                            checked={shippingMethod === "express"}
                                            onChange={(e) => setShippingMethod(e.target.value)}
                                        />
                                        <span className="ml-2">Express Shipping</span>
                                    </div>
                                    <span>$15.00</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white p-6 rounded-lg shadow h-fit">
                        <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                        <div className="space-y-4">
                            {state.items.map((item) => (
                                <div key={`${item.productId}-${item.variant}`} className="flex justify-between">
                                    <div>
                                        <h3 className="font-medium">{item.title}</h3>
                                        <p className="text-sm text-gray-600">{item.variant}</p>
                                        <p className="text-sm text-gray-600">x{item.quantity}</p>
                                    </div>
                                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t pt-4">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>${state.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span>Shipping Fee:</span>
                                    <span>${getShippingFee().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mt-2 text-lg font-semibold">
                                    <span>Total:</span>
                                    <span>${(state.total + getShippingFee()).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full mt-6 bg-black text-white hover:bg-gray-800"
                            disabled={isLoading}
                        >
                            {isLoading ? "Processing..." : "Place Order"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
} 