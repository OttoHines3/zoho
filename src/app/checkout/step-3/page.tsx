"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { api } from "~/trpc/react"

export default function CheckoutStep3Page() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const checkoutSessionId = searchParams.get("checkout_session_id") ?? ""
    const [signingUrl, setSigningUrl] = useState<string | null>(null)
    const [error, setError] = useState("")

    // Fetch company info for pre-fill (optional, for display)
    const { data: companyInfo, isLoading: companyLoading } = api.companyInfo.getBySession.useQuery(
        { checkoutSessionId },
        { enabled: !!checkoutSessionId }
    )

    // Fetch DocuSign embedded signing URL
    useEffect(() => {
        if (!checkoutSessionId) return
        const fetchSigningUrl = async () => {
            try {
                // Call tRPC endpoint to get DocuSign embedded signing URL
                const result = await api.agreement.getDocuSignSigningUrl.mutate({
                    checkoutSessionId,
                })
                setSigningUrl(result.url)
            } catch (err) {
                setError("Failed to load signing URL. Please try again.")
            }
        }
        fetchSigningUrl()
    }, [checkoutSessionId])

    if (!checkoutSessionId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center">
                        <h1 className="text-xl font-semibold text-red-600 mb-2">Missing Session</h1>
                        <p className="text-gray-600 mb-4">No checkout session ID provided.</p>
                        <Button onClick={() => router.push("/checkout/step-1")}>Back to Step 1</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center">
                        <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={() => router.refresh()}>Retry</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!signingUrl || companyLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading agreement...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Step 3: Sign Agreement</CardTitle>
                        <p className="text-gray-600">Please review and sign the agreement to continue.</p>
                    </CardHeader>
                    <CardContent>
                        {/* Optionally show company info for confirmation */}
                        {companyInfo?.data && (
                            <div className="mb-4 p-4 bg-blue-50 rounded">
                                <div className="font-semibold">Signing as:</div>
                                <div>{companyInfo.data.contactName} ({companyInfo.data.companyName})</div>
                                <div>{companyInfo.data.email}</div>
                            </div>
                        )}
                        {/* DocuSign IFrame */}
                        <iframe
                            src={signingUrl}
                            title="DocuSign Envelope"
                            width="100%"
                            height="600px"
                            style={{ border: "1px solid #ccc", borderRadius: 8 }}
                            allowFullScreen
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 