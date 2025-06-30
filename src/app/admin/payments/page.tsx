"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Separator } from "~/components/ui/separator"
import { Check, DollarSign, RefreshCw, X, AlertCircle } from "lucide-react"
import { api } from "~/trpc/react"

export default function AdminPaymentsPage() {
    const [paymentIntentId, setPaymentIntentId] = useState("")
    const [captureAmount, setCaptureAmount] = useState("")
    const [refundAmount, setRefundAmount] = useState("")
    const [refundReason, setRefundReason] = useState("")
    const [loading, setLoading] = useState(false)

    const getPaymentStatus = api.checkout.getPaymentStatus.useQuery(
        { paymentIntentId },
        { enabled: !!paymentIntentId }
    )

    const capturePayment = api.checkout.capturePayment.useMutation()
    const refundPayment = api.checkout.refundPayment.useMutation()

    const handleCapture = async () => {
        if (!paymentIntentId) return

        setLoading(true)
        try {
            const amount = captureAmount ? parseInt(captureAmount) * 100 : undefined
            await capturePayment.mutateAsync({
                paymentIntentId,
                amount,
            })

            // Refresh payment status
            await getPaymentStatus.refetch()
            setCaptureAmount("")
        } catch (error) {
            console.error("Capture failed:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleRefund = async () => {
        if (!paymentIntentId) return

        setLoading(true)
        try {
            const amount = refundAmount ? parseInt(refundAmount) * 100 : undefined
            await refundPayment.mutateAsync({
                paymentIntentId,
                amount,
                reason: refundReason as any,
            })

            // Refresh payment status
            await getPaymentStatus.refetch()
            setRefundAmount("")
            setRefundReason("")
        } catch (error) {
            console.error("Refund failed:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount / 100)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "succeeded":
                return "text-green-600"
            case "failed":
                return "text-red-600"
            case "canceled":
                return "text-gray-600"
            case "requires_capture":
                return "text-yellow-600"
            default:
                return "text-blue-600"
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
                    <p className="text-gray-600">Manage payment captures, refunds, and monitor payment status</p>
                </div>

                <div className="grid gap-6">
                    {/* Payment Lookup */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Payment Lookup
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="paymentId">Payment Intent ID</Label>
                                    <Input
                                        id="paymentId"
                                        placeholder="pi_..."
                                        value={paymentIntentId}
                                        onChange={(e) => setPaymentIntentId(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        onClick={() => getPaymentStatus.refetch()}
                                        disabled={!paymentIntentId}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Lookup
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Status */}
                    {getPaymentStatus.data && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <span className={`font-semibold ${getStatusColor(getPaymentStatus.data.status)}`}>
                                                {getPaymentStatus.data.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Amount:</span>
                                            <span className="font-semibold">{formatAmount(getPaymentStatus.data.amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Captured:</span>
                                            <span className="font-semibold">{formatAmount(getPaymentStatus.data.amountCaptured)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Currency:</span>
                                            <span className="font-semibold">{getPaymentStatus.data.currency.toUpperCase()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Created:</span>
                                            <span className="font-semibold">
                                                {new Date(getPaymentStatus.data.created * 1000).toLocaleString()}
                                            </span>
                                        </div>
                                        {getPaymentStatus.data.metadata && (
                                            <div className="pt-2 border-t">
                                                <div className="text-sm text-gray-600 mb-1">Metadata:</div>
                                                <div className="text-xs space-y-1">
                                                    {Object.entries(getPaymentStatus.data.metadata).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between">
                                                            <span>{key}:</span>
                                                            <span className="font-mono">{value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment Actions */}
                    {getPaymentStatus.data && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Capture Payment */}
                            {getPaymentStatus.data.status === "requires_capture" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Check className="h-5 w-5" />
                                            Capture Payment
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="captureAmount">Amount to Capture (USD)</Label>
                                            <Input
                                                id="captureAmount"
                                                type="number"
                                                placeholder="99.00"
                                                value={captureAmount}
                                                onChange={(e) => setCaptureAmount(e.target.value)}
                                            />
                                            <p className="text-sm text-gray-500 mt-1">
                                                Leave empty to capture full amount
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleCapture}
                                            disabled={loading}
                                            className="w-full"
                                        >
                                            {loading ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                    Capturing...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Capture Payment
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Refund Payment */}
                            {getPaymentStatus.data.status === "succeeded" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <X className="h-5 w-5" />
                                            Refund Payment
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="refundAmount">Amount to Refund (USD)</Label>
                                            <Input
                                                id="refundAmount"
                                                type="number"
                                                placeholder="99.00"
                                                value={refundAmount}
                                                onChange={(e) => setRefundAmount(e.target.value)}
                                            />
                                            <p className="text-sm text-gray-500 mt-1">
                                                Leave empty to refund full amount
                                            </p>
                                        </div>
                                        <div>
                                            <Label htmlFor="refundReason">Reason</Label>
                                            <Select value={refundReason} onValueChange={setRefundReason}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select reason" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="requested_by_customer">Customer Request</SelectItem>
                                                    <SelectItem value="duplicate">Duplicate</SelectItem>
                                                    <SelectItem value="fraudulent">Fraudulent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            onClick={handleRefund}
                                            disabled={loading}
                                            variant="destructive"
                                            className="w-full"
                                        >
                                            {loading ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <X className="h-4 w-4 mr-2" />
                                                    Refund Payment
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Error Display */}
                    {(getPaymentStatus.error || capturePayment.error || refundPayment.error) && (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-red-700">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="font-medium">Error:</span>
                                    <span>
                                        {getPaymentStatus.error?.message ||
                                            capturePayment.error?.message ||
                                            refundPayment.error?.message}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
} 