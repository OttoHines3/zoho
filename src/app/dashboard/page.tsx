"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { Check, Clock, DollarSign, Building, User, Users, ExternalLink } from "lucide-react"
import { api } from "~/trpc/react"

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("sessions")

    const { data: sessionsData, isLoading: sessionsLoading } = api.checkoutSession.getUserSessions.useQuery()
    const { data: companyData, isLoading: companyLoading } = api.companyInfo.getByUser.useQuery()
    const { data: zohoContactData, isLoading: zohoLoading } = api.zoho.getContactInfo.useQuery()

    const createContactMutation = api.zoho.createOrUpdateContact.useMutation({
        onSuccess: () => {
            // Refetch contact data after creation
            window.location.reload()
        },
    })

    const createSalesOrderMutation = api.zoho.createSalesOrder.useMutation({
        onSuccess: () => {
            // Refetch data after creation
            window.location.reload()
        },
    })

    const { data: crmData, isLoading: crmLoading } = api.zoho.fetchCRMData.useQuery({
        includeSalesOrders: true,
        includeDeals: true,
        includeTasks: true,
        includeNotes: true,
    })

    const generateSignupLinkMutation = api.zoho.generateSignupLink.useMutation({
        onSuccess: (data) => {
            // Copy the magic link to clipboard
            if (data.data?.magicLink) {
                navigator.clipboard.writeText(data.data.magicLink);
                alert("Magic link copied to clipboard!");
            }
        },
    })

    const formatDate = (date: string | Date) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        return dateObj.toLocaleDateString()
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800"
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            case "payment_completed":
                return "bg-blue-100 text-blue-800"
            case "agreement_completed":
                return "bg-purple-100 text-purple-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getAgreementStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800"
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            case "sent":
                return "bg-blue-100 text-blue-800"
            case "partially_signed":
                return "bg-orange-100 text-orange-800"
            case "declined":
                return "bg-red-100 text-red-800"
            case "voided":
                return "bg-gray-100 text-gray-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    if (sessionsLoading || companyLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage your Zoho integration setup</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4">
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-white p-1 rounded-lg mb-6">
                    <Button
                        variant={activeTab === "sessions" ? "default" : "ghost"}
                        onClick={() => setActiveTab("sessions")}
                        className="flex-1"
                    >
                        <Clock className="h-4 w-4 mr-2" />
                        Checkout Sessions
                    </Button>
                    <Button
                        variant={activeTab === "company" ? "default" : "ghost"}
                        onClick={() => setActiveTab("company")}
                        className="flex-1"
                    >
                        <Building className="h-4 w-4 mr-2" />
                        Company Information
                    </Button>
                    <Button
                        variant={activeTab === "zoho" ? "default" : "ghost"}
                        onClick={() => setActiveTab("zoho")}
                        className="flex-1"
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Zoho Contact
                    </Button>
                    <Button
                        variant={activeTab === "crm" ? "default" : "ghost"}
                        onClick={() => setActiveTab("crm")}
                        className="flex-1"
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        CRM Data
                    </Button>
                </div>

                {/* Checkout Sessions Tab */}
                {activeTab === "sessions" && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold">Your Checkout Sessions</h2>
                        {sessionsData?.data && sessionsData.data.length > 0 ? (
                            <div className="grid gap-4">
                                {sessionsData.data.map((session) => (
                                    <Card key={session.id}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="flex items-center gap-2">
                                                    <DollarSign className="h-5 w-5 text-green-600" />
                                                    {session.module || "Zoho Integration"}
                                                </CardTitle>
                                                <Badge className={getStatusColor(session.status)}>
                                                    {session.status.replace("_", " ")}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Session ID:</span>
                                                    <p className="font-mono">{session.id}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Created:</span>
                                                    <p>{formatDate(session.createdAt)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Last Updated:</span>
                                                    <p>{formatDate(session.updatedAt)}</p>
                                                </div>
                                            </div>
                                            {session.cardLast4 && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <span className="text-gray-600">Card:</span>
                                                    <p>•••• {session.cardLast4}</p>
                                                </div>
                                            )}
                                            {session.agreement && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Agreement Status:</span>
                                                        <Badge className={getAgreementStatusColor(session.agreement.status)}>
                                                            {session.agreement.status.replace("_", " ")}
                                                        </Badge>
                                                    </div>
                                                    {session.agreement.completedAt && (
                                                        <div className="mt-2">
                                                            <span className="text-gray-600">Completed:</span>
                                                            <p>{formatDate(session.agreement.completedAt)}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Checkout Sessions</h3>
                                    <p className="text-gray-600 mb-4">You haven't completed any purchases yet.</p>
                                    <Button onClick={() => window.location.href = "/checkout/step-1"}>
                                        Start Purchase
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Company Information Tab */}
                {activeTab === "company" && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold">Company Information</h2>
                        {companyData?.data && companyData.data.length > 0 ? (
                            <div className="grid gap-4">
                                {companyData.data.map((company) => (
                                    <Card key={company.id}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Building className="h-5 w-5 text-blue-600" />
                                                {company.companyName}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="text-gray-600 text-sm">Contact:</span>
                                                        <p className="font-medium">{company.contactName}</p>
                                                    </div>
                                                    {company.email && (
                                                        <div>
                                                            <span className="text-gray-600 text-sm">Email:</span>
                                                            <p>{company.email}</p>
                                                        </div>
                                                    )}
                                                    {company.phone && (
                                                        <div>
                                                            <span className="text-gray-600 text-sm">Phone:</span>
                                                            <p>{company.phone}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-3">
                                                    {company.address && (
                                                        <div>
                                                            <span className="text-gray-600 text-sm">Address:</span>
                                                            <p>{company.address}</p>
                                                            {company.city && company.state && (
                                                                <p>{company.city}, {company.state} {company.zipCode}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {company.industry && (
                                                        <div>
                                                            <span className="text-gray-600 text-sm">Industry:</span>
                                                            <p className="capitalize">{company.industry}</p>
                                                        </div>
                                                    )}
                                                    {company.companySize && (
                                                        <div>
                                                            <span className="text-gray-600 text-sm">Company Size:</span>
                                                            <p>{company.companySize}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Company Information</h3>
                                    <p className="text-gray-600 mb-4">Complete your purchase to add company information.</p>
                                    <Button onClick={() => window.location.href = "/checkout/step-1"}>
                                        Start Purchase
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Zoho Contact Tab */}
                {activeTab === "zoho" && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold">Zoho Contact Management</h2>

                        {zohoLoading ? (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading Zoho contact information...</p>
                                </CardContent>
                            </Card>
                        ) : zohoContactData?.data ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-purple-600" />
                                        Zoho Contact Created
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Contact ID:</span>
                                            <p className="font-mono">{zohoContactData.data.zohoLink.zohoUserId}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Last Updated:</span>
                                            <p>{formatDate(zohoContactData.data.zohoLink.updatedAt)}</p>
                                        </div>
                                        <Separator />
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => createContactMutation.mutate({
                                                    checkoutSessionId: sessionsData?.data?.[0]?.id ?? "",
                                                    requireAgreementSigned: true,
                                                })}
                                                disabled={createContactMutation.isPending}
                                            >
                                                {createContactMutation.isPending ? "Updating..." : "Update Contact"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => window.open("https://crm.zoho.com/crm/", "_blank")}
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Open Zoho CRM
                                            </Button>
                                        </div>

                                        <Separator />

                                        <div className="space-y-3">
                                            <h4 className="font-medium">Sales Order</h4>
                                            {sessionsData?.data && sessionsData.data.length > 0 && (
                                                <Button
                                                    onClick={() => createSalesOrderMutation.mutate({
                                                        checkoutSessionId: sessionsData.data[0]?.id ?? "",
                                                        requirePaymentConfirmed: true,
                                                        requireContactCreated: true,
                                                    })}
                                                    disabled={createSalesOrderMutation.isPending}
                                                    className="w-full"
                                                >
                                                    {createSalesOrderMutation.isPending ? "Creating..." : "Create Sales Order"}
                                                </Button>
                                            )}
                                        </div>

                                        <Separator />

                                        <div className="space-y-3">
                                            <h4 className="font-medium">Magic Links</h4>
                                            <p className="text-sm text-gray-600">
                                                Generate secure links for returning users to access their CRM data.
                                            </p>
                                            <div className="space-y-2">
                                                <Button
                                                    onClick={() => generateSignupLinkMutation.mutate({
                                                        expiresInHours: 24,
                                                        maxUses: 1,
                                                    })}
                                                    disabled={generateSignupLinkMutation.isPending}
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    {generateSignupLinkMutation.isPending ? "Generating..." : "Generate 24h Link"}
                                                </Button>
                                                <Button
                                                    onClick={() => generateSignupLinkMutation.mutate({
                                                        expiresInHours: 168, // 7 days
                                                        maxUses: 5,
                                                    })}
                                                    disabled={generateSignupLinkMutation.isPending}
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    {generateSignupLinkMutation.isPending ? "Generating..." : "Generate 7-Day Link"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Zoho Contact</h3>
                                    <p className="text-gray-600 mb-4">
                                        Create a Zoho contact from your company information and agreement.
                                    </p>
                                    {sessionsData?.data && sessionsData.data.length > 0 ? (
                                        <div className="space-y-3">
                                            <Button
                                                onClick={() => createContactMutation.mutate({
                                                    checkoutSessionId: sessionsData.data[0]?.id ?? "",
                                                    requireAgreementSigned: true,
                                                })}
                                                disabled={createContactMutation.isPending}
                                                className="w-full"
                                            >
                                                {createContactMutation.isPending ? "Creating..." : "Create Zoho Contact"}
                                            </Button>

                                            <div className="text-center text-sm text-gray-500">
                                                <p>After creating a contact, you can create a sales order</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button onClick={() => window.location.href = "/checkout/step-1"}>
                                            Complete Purchase First
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* CRM Data Tab */}
                {activeTab === "crm" && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold">CRM Data Overview</h2>

                        {crmLoading ? (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading CRM data...</p>
                                </CardContent>
                            </Card>
                        ) : crmData?.data ? (
                            <div className="grid gap-6">
                                {/* Contact Information */}
                                {crmData.data.contact && (
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
                                                        {crmData.data.contact.First_Name} {crmData.data.contact.Last_Name}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 text-sm">Email:</span>
                                                    <p>{crmData.data.contact.Email}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 text-sm">Company:</span>
                                                    <p>{crmData.data.contact.Company}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 text-sm">Phone:</span>
                                                    <p>{crmData.data.contact.Phone}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Sales Orders */}
                                {crmData.data.salesOrders && crmData.data.salesOrders.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <DollarSign className="h-5 w-5 text-green-600" />
                                                Sales Orders ({crmData.data.salesOrders.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {crmData.data.salesOrders.map((order: any, index: number) => (
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
                                {crmData.data.deals && crmData.data.deals.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Building className="h-5 w-5 text-purple-600" />
                                                Deals ({crmData.data.deals.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {crmData.data.deals.map((deal: any, index: number) => (
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
                                {crmData.data.tasks && crmData.data.tasks.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-orange-600" />
                                                Tasks ({crmData.data.tasks.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {crmData.data.tasks.map((task: any, index: number) => (
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
                                {crmData.data.notes && crmData.data.notes.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Check className="h-5 w-5 text-indigo-600" />
                                                Notes ({crmData.data.notes.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {crmData.data.notes.map((note: any, index: number) => (
                                                    <div key={index} className="border rounded-lg p-3">
                                                        <p className="font-medium">{note.Note_Title}</p>
                                                        <p className="text-sm text-gray-600 mt-1">{note.Note_Content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {(!crmData.data.contact && crmData.data.salesOrders.length === 0 &&
                                    crmData.data.deals.length === 0 && crmData.data.tasks.length === 0 &&
                                    crmData.data.notes.length === 0) && (
                                        <Card>
                                            <CardContent className="p-8 text-center">
                                                <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No CRM Data Found</h3>
                                                <p className="text-gray-600 mb-4">
                                                    Create a Zoho contact first to view CRM data.
                                                </p>
                                                <Button onClick={() => setActiveTab("zoho")}>
                                                    Go to Zoho Contact
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No CRM Data Available</h3>
                                    <p className="text-gray-600 mb-4">
                                        {crmData?.message || "Unable to fetch CRM data. Please ensure you have a Zoho contact created."}
                                    </p>
                                    <Button onClick={() => setActiveTab("zoho")}>
                                        Create Zoho Contact
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
} 