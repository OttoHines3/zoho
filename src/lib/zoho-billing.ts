import { env } from "~/env";

interface ZohoBillingConfig {
  organizationId: string;
  authToken: string;
  baseUrl: string;
}

interface CreateInvoiceInput {
  customerId: string;
  items: Array<{
    name: string;
    description?: string;
    rate: number;
    quantity: number;
  }>;
  date?: string;
  dueDate?: string;
  notes?: string;
}

interface PaymentInput {
  invoiceId: string;
  amount: number;
  paymentMode: string;
  description?: string;
}

interface ZohoAPIError {
  message: string;
  code: string;
}

interface ZohoCustomer {
  customer_id: string;
  display_name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  billing_address?: {
    attention?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

interface ZohoInvoice {
  invoice_id: string;
  customer_id: string;
  status: "draft" | "sent" | "paid" | "void" | "overdue";
  total: number;
  balance: number;
  date: string;
  due_date?: string;
  line_items: Array<{
    item_id: string;
    name: string;
    description?: string;
    rate: number;
    quantity: number;
  }>;
}

interface ZohoPayment {
  payment_id: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  date: string;
  payment_mode: string;
  description?: string;
}

class ZohoBillingClient {
  private config: ZohoBillingConfig;

  constructor(config: ZohoBillingConfig) {
    this.config = config;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.config.baseUrl}/${endpoint}`;
    const headers = {
      Authorization: `Zoho-authtoken ${this.config.authToken}`,
      "X-organization-id": this.config.organizationId,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = (await response.json()) as ZohoAPIError;
      throw new Error(error.message ?? "Zoho Billing API request failed");
    }

    return response.json() as Promise<T>;
  }

  async createCustomer(data: {
    displayName: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    billingAddress?: {
      attention?: string;
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  }): Promise<{ customer: ZohoCustomer }> {
    return this.makeRequest("customers", {
      method: "POST",
      body: JSON.stringify({ customer: data }),
    });
  }

  async createInvoice(
    input: CreateInvoiceInput,
  ): Promise<{ invoice: ZohoInvoice }> {
    const lineItems = input.items.map((item) => ({
      name: item.name,
      description: item.description,
      rate: item.rate,
      quantity: item.quantity,
    }));

    const invoiceData = {
      customer_id: input.customerId,
      line_items: lineItems,
      date: input.date ?? new Date().toISOString().split("T")[0],
      due_date: input.dueDate,
      notes: input.notes,
    };

    return this.makeRequest("invoices", {
      method: "POST",
      body: JSON.stringify({ invoice: invoiceData }),
    });
  }

  async recordPayment(input: PaymentInput): Promise<{ payment: ZohoPayment }> {
    const paymentData = {
      invoice_id: input.invoiceId,
      amount: input.amount,
      payment_mode: input.paymentMode,
      description: input.description,
      date: new Date().toISOString().split("T")[0],
    };

    return this.makeRequest("customerpayments", {
      method: "POST",
      body: JSON.stringify({ payment: paymentData }),
    });
  }

  async getInvoice(invoiceId: string): Promise<{ invoice: ZohoInvoice }> {
    return this.makeRequest(`invoices/${invoiceId}`);
  }

  async listInvoices(params?: {
    customerId?: string;
    status?: "draft" | "sent" | "paid" | "void" | "overdue";
    page?: number;
    perPage?: number;
  }): Promise<{
    invoices: ZohoInvoice[];
    page_context: { page: number; per_page: number; has_more_page: boolean };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.customerId) queryParams.set("customer_id", params.customerId);
    if (params?.status) queryParams.set("status", params.status);
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.perPage) queryParams.set("per_page", params.perPage.toString());

    return this.makeRequest(`invoices?${queryParams.toString()}`);
  }

  async voidInvoice(
    invoiceId: string,
    reason?: string,
  ): Promise<{ invoice: ZohoInvoice }> {
    return this.makeRequest(`invoices/${invoiceId}/status/void`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string,
  ): Promise<{
    refund: {
      refund_id: string;
      payment_id: string;
      amount: number;
      date: string;
      reason?: string;
    };
  }> {
    const refundData = {
      amount,
      reason,
      date: new Date().toISOString().split("T")[0],
    };

    return this.makeRequest(`customerpayments/${paymentId}/refunds`, {
      method: "POST",
      body: JSON.stringify({ refund: refundData }),
    });
  }

  async getPayment(paymentId: string): Promise<ZohoPayment> {
    return this.makeRequest(`customerpayments/${paymentId}`);
  }
}

// Create a singleton instance
export const zohoBilling = new ZohoBillingClient({
  organizationId: env.ZOHO_BILLING_ORGANIZATION_ID,
  authToken: env.ZOHO_BILLING_AUTH_TOKEN,
  baseUrl: "https://books.zoho.com/api/v3",
});
