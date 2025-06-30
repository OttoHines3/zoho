"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { User, DollarSign, Building, Clock, Check, ExternalLink, AlertCircle } from "lucide-react"

interface CRMData {
    contact: any;
    salesOrders: any[];
    deals: any[];
    tasks: any[];
    notes: any[];
}

export default function MagicLinkPage() {
    const params = useParams()
    const [crmData, setCrmData] = useState<CRMData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const zohoId = params.zohoId as string
    const loginCode = params.loginCode as string

    useEffect(() => {
        const fetchCRMData = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch(`/api/crm/${zohoId}/${loginCode}?includeSalesOrders=true&includeDeals=true&includeTasks=true&includeNotes=true`)

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || "Failed to fetch CRM data")
                }

                const data = await response.json()

                if (data.success && data.data) {
                    setCrmData(data.data)
                } else {
                    throw new Error(data.message || "No CRM data available")
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setLoading(false)
            }
        }

        if (zohoId && loginCode) {
            fetchCRMData()
        }
    }, [zohoId, loginCode])

    const formatDate = (date: string | Date) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        return dateObj.toLocaleDateString()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your CRM data...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={() => window.location.href = "/"}>
                            Return Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!crmData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                        <p className="text-gray-600 mb-4">No CRM data found for this link.</p>
                        <Button onClick={() => window.location.href = "/"}>
                            Return Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Your CRM Data</h1>
                    <p className="text-gray-600 mt-2">Welcome back! Here's your latest information.</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4">
                <div className="grid gap-6">
                    {/* Contact Information */}
                    {crmData.contact && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-600" />
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-gray-600 text-sm">Name:</span>
                                        <p className="font-medium">
                                            {crmData.contact.First_Name} {crmData.contact.Last_Name}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">Email:</span>
                                        <p>{crmData.contact.Email}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">Company:</span>
                                        <p>{crmData.contact.Company}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">Phone:</span>
                                        <p>{crmData.contact.Phone}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sales Orders */}
                    {crmData.salesOrders && crmData.salesOrders.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    Sales Orders ({crmData.salesOrders.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {crmData.salesOrders.map((order: any, index: number) => (
                                        <div key={index} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{order.Subject}</p>
                                                    <p className="text-sm text-gray-600">{order.Status}</p>
                                                </div>
                                                <Badge className="bg-green-100 text-green-800">
                                                    ${order.Grand_Total}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Deals */}
                    {crmData.deals && crmData.deals.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building className="h-5 w-5 text-purple-600" />
                                    Deals ({crmData.deals.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {crmData.deals.map((deal: any, index: number) => (
                                        <div key={index} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{deal.Deal_Name}</p>
                                                    <p className="text-sm text-gray-600">{deal.Stage}</p>
                                                </div>
                                                <Badge className="bg-purple-100 text-purple-800">
                                                    ${deal.Amount}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tasks */}
                    {crmData.tasks && crmData.tasks.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                    Tasks ({crmData.tasks.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {crmData.tasks.map((task: any, index: number) => (
                                        <div key={index} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{task.Subject}</p>
                                                    <p className="text-sm text-gray-600">{task.Status}</p>
                                                </div>
                                                <Badge className="bg-orange-100 text-orange-800">
                                                    {task.Priority}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes */}
                    {crmData.notes && crmData.notes.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-indigo-600" />
                                    Notes ({crmData.notes.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {crmData.notes.map((note: any, index: number) => (
                                        <div key={index} className="border rounded-lg p-3">
                                            <p className="font-medium">{note.Note_Title}</p>
                                            <p className="text-sm text-gray-600 mt-1">{note.Note_Content}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={() => window.open("https://crm.zoho.com/crm/", "_blank")}
                                    className="flex-1"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Zoho CRM
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = "/"}
                                    className="flex-1"
                                >
                                    Return Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
} 