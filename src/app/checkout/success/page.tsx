"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Check, Download, Mail, Settings, Users } from "lucide-react"
import { api } from "~/trpc/react"

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams()
    const paymentIntentId = searchParams.get("payment_intent")
    const [paymentDetails, setPaymentDetails] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const getPaymentStatus = api.checkout.getPaymentStatus.useQuery(
        { paymentIntentId: paymentIntentId ?? "" },
        {
            enabled: !!paymentIntentId,
        }
    )

    useEffect(() => {
        if (getPaymentStatus.data) {
            setPaymentDetails(getPaymentStatus.data)
            setLoading(false)
        }
    }, [getPaymentStatus.data])

    useEffect(() => {
        if (getPaymentStatus.error) {
            setLoading(false)
        }
    }, [getPaymentStatus.error])

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount / 100)
    }

    const nextSteps = [
        {
            title: "Check Your Email",
            description: "We've sent you a confirmation email with your purchase details and next steps.",
            icon: Mail,
            action: "Check inbox"
        },
        {
            title: "Access Your Modules",
            description: "Your Zoho integration modules are now available in your dashboard.",
            icon: Settings,
            action: "Go to dashboard"
        },
        {
            title: "Setup Integration",
            description: "Follow our setup guide to connect your Zoho CRM with the integration modules.",
            icon: Download,
            action: "View setup guide"
        },
        {
            title: "Get Support",
            description: "Our team is here to help you get the most out of your integration.",
            icon: Users,
            action: "Contact support"
        }
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Processing your payment...</p>
                </div>
            </div>
        )
    }

    if (!paymentDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment Not Found</h1>
                        <p className="text-gray-600 mb-4">We couldn't find the payment details you're looking for.</p>
                        <Button onClick={() => window.history.back()}>Go Back</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                        <p className="text-gray-600">Thank you for your purchase. Your Zoho integration modules are ready.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4">
                <div className="grid lg:grid-cols-2 gap-8 mt-8">
                    {/* Payment Details */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment ID:</span>
                                    <span className="font-mono text-sm">{paymentDetails.paymentIntentId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Amount:</span>
                                    <span className="font-semibold">{formatAmount(paymentDetails.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className="text-green-600 font-semibold capitalize">{paymentDetails.status}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Date:</span>
                                    <span>{new Date(paymentDetails.created * 1000).toLocaleDateString()}</span>
                                </div>
                                {paymentDetails.metadata && (
                                    <div className="pt-4 border-t">
                                        <h4 className="font-semibold mb-2">Order Details</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Modules:</span>
                                                <span>{paymentDetails.metadata.quantity} Zoho Integration Module(s)</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Email:</span>
                                                <span>{paymentDetails.metadata.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Next Steps */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>What's Next?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {nextSteps.map((step, index) => (
                                        <div key={index} className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <step.icon className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                                                <p className="text-gray-600 text-sm mb-2">{step.description}</p>
                                                <Button variant="outline" size="sm">
                                                    {step.action}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Support Card */}
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-6">
                                <div className="text-center">
                                    <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
                                    <p className="text-blue-700 text-sm mb-4">
                                        Our support team is available 24/7 to help you get started with your Zoho integration.
                                    </p>
                                    <div className="space-y-2">
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                            Contact Support
                                        </Button>
                                        <Button variant="outline" className="w-full">
                                            View Documentation
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
} 