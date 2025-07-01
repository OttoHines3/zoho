"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Separator } from "~/components/ui/separator"
import { Check, CreditCard, Lock, Minus, Plus, Shield } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { api } from "~/trpc/react"
import type { Stripe } from '@stripe/stripe-js';

// Validate Stripe publishable key
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!stripePublishableKey) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set")
}

if (!stripePublishableKey.startsWith("pk_")) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with 'pk_'")
}

const stripePromise = loadStripe(stripePublishableKey);

function CheckoutForm() {
    const [quantity, setQuantity] = useState(6)
    const [processing, setProcessing] = useState(false)
    const [cardError, setCardError] = useState<string | null>(null)
    const [email, setEmail] = useState("")
    const [nameOnCard, setNameOnCard] = useState("")
    const [country, setCountry] = useState("US")
    const [zipCode, setZipCode] = useState("")

    const stripe = useStripe()
    const elements = useElements()

    const createPaymentIntent = api.checkout.createPaymentIntent.useMutation()
    const createCheckoutSession = api.checkoutSession.create.useMutation()
    const getPaymentStatus = api.checkout.getPaymentStatus.useQuery(
        { paymentIntentId: "" },
        { enabled: false }
    )

    const pricePerModule = 99
    const subtotal = quantity * pricePerModule
    const tax = 0
    const total = subtotal + tax

    const features = [
        "Full Zoho CRM Integration",
        "API authentication & management",
        "Data synchronization",
        "Custom field mapping",
        "Real-time updates",
        "24/7 support",
    ]

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setProcessing(true)
        setCardError(null)

        try {
            // Validate required fields
            if (!email || !nameOnCard || !stripe || !elements) {
                setCardError("Please fill in all required fields")
                return
            }

            // Create payment intent
            const { clientSecret } = await createPaymentIntent.mutateAsync({
                quantity,
                email,
                nameOnCard,
            })

            if (!clientSecret) {
                setCardError("Failed to create payment intent")
                return
            }

            // Get card element
            const cardElement = elements.getElement(CardElement)
            if (!cardElement) {
                setCardError("Card information is required")
                return
            }

            // Confirm card payment
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: nameOnCard,
                        email: email,
                        address: {
                            country: country,
                            postal_code: zipCode,
                        },
                    },
                },
            })

            if (result.error) {
                setCardError(result.error.message ?? "Payment failed")
            } else if (result.paymentIntent?.status === "succeeded") {
                // Payment captured successfully
                console.log("Payment successful:", result.paymentIntent.id)

                // Create checkout session
                const checkoutSession = await createCheckoutSession.mutateAsync({
                    module: "zoho_integration",
                    status: "payment_completed",
                })

                // Redirect to Step 2 with session info
                const sessionToken = "session_token_placeholder" // In real app, get from auth
                const userId = "user_id_placeholder" // In real app, get from auth
                window.location.href = `/checkout/step-2?session_token=${sessionToken}&user_id=${userId}&checkout_session_id=${checkoutSession.data.id}`
            } else if (result.paymentIntent?.status === "requires_capture") {
                // Payment authorized but needs manual capture
                console.log("Payment authorized, requires capture:", result.paymentIntent.id)
                // TODO: Implement manual capture logic if needed
            }
        } catch (err) {
            if (err && typeof err === "object" && "message" in err) {
                setCardError((err as { message?: string }).message ?? "Something went wrong")
            } else {
                setCardError("Something went wrong")
            }
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                        <Lock className="h-4 w-4 text-green-600" />
                        <h1 className="text-lg font-semibold">Complete Your Purchase</h1>
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-1">Secure checkout powered by Stripe</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4">
                <div className="grid lg:grid-cols-2 gap-8 mt-8">
                    {/* Left Side - Module Details */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Check className="h-4 w-4 text-blue-600" />
                                    </div>
                                    Your Modules
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Module Item */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">Zoho Integration Module</h3>
                                        <p className="text-gray-600 text-sm mt-1">Complete integration with Zoho CRM and API</p>

                                        {/* Quantity Selector */}
                                        <div className="flex items-center gap-3 mt-4">
                                            <Label className="text-sm font-medium">Quantity:</Label>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    className="h-8 w-8 p-0"
                                                    disabled={processing}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center font-medium">{quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setQuantity(quantity + 1)}
                                                    className="h-8 w-8 p-0"
                                                    disabled={processing}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold">${pricePerModule}</div>
                                        <div className="text-sm text-gray-500">per module</div>
                                    </div>
                                </div>

                                <Separator />

                                {/* What's Included */}
                                <div>
                                    <h4 className="font-semibold mb-3">What&apos;s included:</h4>
                                    <div className="grid gap-2">
                                        {features.map((feature, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                <span className="text-sm text-gray-700">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                {/* Pricing Summary */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal:</span>
                                        <span>${subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Tax:</span>
                                        <span>${tax.toFixed(2)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total:</span>
                                        <span className="text-blue-600">${total}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side - Payment Information */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payment Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Contact Information */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-700">Contact Information</h4>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="your@email.com"
                                                value={email}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Payment Method */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-700">Payment Method</h4>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="cardName">Name on Card</Label>
                                                <Input
                                                    id="cardName"
                                                    placeholder="John Doe"
                                                    value={nameOnCard}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNameOnCard(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="cardNumber">Card Information</Label>
                                                <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                                                    <CardElement
                                                        options={{
                                                            style: {
                                                                base: {
                                                                    fontSize: "16px",
                                                                    color: "#374151",
                                                                    '::placeholder': { color: "#9CA3AF" },
                                                                },
                                                                invalid: { color: "#EF4444" },
                                                            },
                                                        }}
                                                    />
                                                </div>
                                                {cardError && (
                                                    <p className="text-sm text-red-600">{cardError}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Billing Address */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-700">Billing Address</h4>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="country">Country</Label>
                                                <Select value={country} onValueChange={setCountry}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="US">United States</SelectItem>
                                                        <SelectItem value="CA">Canada</SelectItem>
                                                        <SelectItem value="UK">United Kingdom</SelectItem>
                                                        <SelectItem value="AU">Australia</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="zipCode">ZIP Code</Label>
                                                <Input
                                                    id="zipCode"
                                                    placeholder="12345"
                                                    value={zipCode}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setZipCode(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Pay Button */}
                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                                        disabled={processing || !stripe || !elements || !email || !nameOnCard}
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="h-4 w-4 mr-2" />
                                                Pay ${total}
                                            </>
                                        )}
                                    </Button>

                                    {/* Security Notice */}
                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                        <Shield className="h-3 w-3" />
                                        <span>Your payment information is encrypted and secure</span>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CheckoutStep1Page() {
    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm />
        </Elements>
    )
}
