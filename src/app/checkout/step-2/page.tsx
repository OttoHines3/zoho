"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Separator } from "~/components/ui/separator"
import { api } from "~/trpc/react"

export default function CheckoutStep2Page() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [formData, setFormData] = useState({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
        industry: "",
        companySize: "",
    })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")

    // Get session token and userId from query params (or session in a real app)
    const sessionToken = searchParams.get("session_token") ?? ""
    const userId = searchParams.get("user_id") ?? ""
    const checkoutSessionId = searchParams.get("checkout_session_id") ?? ""

    const createCompanyInfo = api.companyInfo.create.useMutation()

    useEffect(() => {
        if (!sessionToken || !userId || !checkoutSessionId) {
            setError("Missing session or user information. Please complete Step 1 first.")
        }
    }, [sessionToken, userId, checkoutSessionId])

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            await createCompanyInfo.mutateAsync({
                checkoutSessionId,
                ...formData
            })
            setSuccess(true)
        } catch (err) {
            setError("Failed to save information. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center">
                        <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={() => router.push("/checkout/step-1")}>Back to Step 1</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center">
                        <h1 className="text-xl font-semibold text-green-600 mb-2">Information Saved!</h1>
                        <p className="text-gray-600 mb-4">Thank you. Your company information has been saved successfully.</p>
                        <Button onClick={() => router.push(`/checkout/step-3?checkout_session_id=${checkoutSessionId}`)}>
                            Continue to Agreement
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Step 2: Company Information</CardTitle>
                        <p className="text-gray-600">Please provide your company details to complete the setup.</p>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Basic Information</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName">Company Name *</Label>
                                        <Input
                                            id="companyName"
                                            value={formData.companyName}
                                            onChange={(e) => handleInputChange("companyName", e.target.value)}
                                            required
                                            placeholder="Your Company Inc."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactName">Contact Name *</Label>
                                        <Input
                                            id="contactName"
                                            value={formData.contactName}
                                            onChange={(e) => handleInputChange("contactName", e.target.value)}
                                            required
                                            placeholder="Jane Doe"
                                        />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange("email", e.target.value)}
                                            placeholder="contact@company.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange("phone", e.target.value)}
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Address Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Address Information</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => handleInputChange("address", e.target.value)}
                                        placeholder="123 Business St"
                                    />
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => handleInputChange("city", e.target.value)}
                                            placeholder="New York"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State</Label>
                                        <Input
                                            id="state"
                                            value={formData.state}
                                            onChange={(e) => handleInputChange("state", e.target.value)}
                                            placeholder="NY"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zipCode">ZIP Code</Label>
                                        <Input
                                            id="zipCode"
                                            value={formData.zipCode}
                                            onChange={(e) => handleInputChange("zipCode", e.target.value)}
                                            placeholder="10001"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
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
                            </div>

                            <Separator />

                            {/* Company Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Company Details</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="industry">Industry</Label>
                                        <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select industry" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="technology">Technology</SelectItem>
                                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                                <SelectItem value="finance">Finance</SelectItem>
                                                <SelectItem value="retail">Retail</SelectItem>
                                                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="companySize">Company Size</Label>
                                        <Select value={formData.companySize} onValueChange={(value) => handleInputChange("companySize", value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select size" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1-10">1-10 employees</SelectItem>
                                                <SelectItem value="11-50">11-50 employees</SelectItem>
                                                <SelectItem value="51-200">51-200 employees</SelectItem>
                                                <SelectItem value="201-1000">201-1000 employees</SelectItem>
                                                <SelectItem value="1000+">1000+ employees</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Saving..." : "Save & Continue"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 