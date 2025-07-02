import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "~/env";
import { createHmac } from "crypto";
import { db } from "~/server/db";
import { zohoBilling } from "~/lib/zoho-billing";
import { createCaller } from "~/server/api/root";
import type { Order, User } from "@prisma/client";

// Webhook event types from Zoho Books
type WebhookEvent = {
  event_type:
    | "invoice.created"
    | "invoice.updated"
    | "invoice.paid"
    | "invoice.voided"
    | "payment.created"
    | "payment.updated"
    | "payment.deleted"
    | "refund.created";
  data: {
    id: string;
    invoice_id?: string;
    payment_id?: string;
    amount?: number;
    [key: string]: unknown;
  };
};

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = createHmac("sha256", secret);
  const expectedSignature = hmac.update(body).digest("hex");
  return signature === expectedSignature;
}

interface OrderWithRelations extends Order {
  user: Pick<User, "email" | "name">;
  items: Array<{
    name: string;
    description?: string;
    price: number;
    quantity: number;
  }>;
  shippingDetails?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-zoho-webhook-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 400 },
      );
    }

    // Verify webhook signature
    const webhookSecret = env.ZOHO_BILLING_WEBHOOK_SECRET;
    const isValid = verifyWebhookSignature(body, signature, webhookSecret);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    let event: WebhookEvent;
    try {
      event = JSON.parse(body) as WebhookEvent;
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    // Handle different event types
    switch (event.event_type) {
      case "invoice.created":
        await handleInvoiceCreated(event.data);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data);
        break;

      case "invoice.voided":
        await handleInvoiceVoided(event.data);
        break;

      case "payment.created":
        await handlePaymentCreated(event.data);
        break;

      case "refund.created":
        await handleRefundCreated(event.data);
        break;

      default:
        console.log(`Unhandled event type: ${event.event_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleInvoiceCreated(data: WebhookEvent["data"]) {
  try {
    // Find the order associated with this invoice
    const order = await db.order.findUnique({
      where: { zohoInvoiceId: data.id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!order?.user?.email) {
      console.error(
        `Order not found or invalid user data for invoice ${data.id}`,
      );
      return;
    }

    // Send email notification to customer
    await sendEmail({
      to: order.user.email,
      subject: "Order Confirmation",
      template: "order-confirmation",
      data: {
        orderNumber: order.id,
        customerName: order.user.name ?? "Customer",
        invoiceId: data.id,
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error("Error handling invoice created:", error.message);
    throw error;
  }
}

async function handleInvoicePaid(data: WebhookEvent["data"]) {
  try {
    // Update order status to paid
    const order = (await db.order.update({
      where: { zohoInvoiceId: data.id },
      data: { status: "paid" },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        items: true,
        shippingDetails: true,
      },
    })) as OrderWithRelations;

    if (!order?.user?.email) {
      console.error(
        `Order not found or invalid user data for invoice ${data.id}`,
      );
      return;
    }

    // Send payment confirmation email
    await sendEmail({
      to: order.user.email,
      subject: "Payment Confirmation",
      template: "payment-confirmation",
      data: {
        orderNumber: order.id,
        customerName: order.user.name ?? "Customer",
        amount: order.total,
        items: order.items,
      },
    });

    // Create DocuSign envelope and get signing URL
    const caller = createCaller({ db, session: null });
    const docuSignResponse = await caller.agreement.getDocuSignSigningUrl({
      checkoutSessionId: order.id,
    });

    // Create or update agreement record
    await db.agreementSignatureStatus.upsert({
      where: { checkoutSessionId: order.id },
      create: {
        checkoutSessionId: order.id,
        provider: "DocuSign",
        status: "pending",
        envelopeId: docuSignResponse.envelopeId,
      },
      update: {
        provider: "DocuSign",
        status: "pending",
        envelopeId: docuSignResponse.envelopeId,
      },
    });

    // Send email with DocuSign link
    await sendEmail({
      to: order.user.email,
      subject: "Please Sign Your Agreement",
      template: "docusign-request",
      data: {
        orderNumber: order.id,
        customerName: order.user.name ?? "Customer",
        signingUrl: docuSignResponse.url,
      },
    });

    // Trigger order fulfillment process
    if (order.shippingDetails) {
      await triggerFulfillment({
        orderId: order.id,
        items: order.items,
        shippingDetails: order.shippingDetails,
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error handling invoice paid:", error.message);
    } else {
      console.error("Error handling invoice paid:", error);
    }
    throw error;
  }
}

async function handleInvoiceVoided(data: WebhookEvent["data"]) {
  try {
    // Update order status to cancelled
    const order = await db.order.update({
      where: { zohoInvoiceId: data.id },
      data: { status: "cancelled" },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!order || !order.user.email) {
      console.error(
        `Order not found or invalid user data for invoice ${data.id}`,
      );
      return;
    }

    // Send cancellation notification
    await sendEmail({
      to: order.user.email,
      subject: "Order Cancelled",
      template: "order-cancelled",
      data: {
        orderNumber: order.id,
        customerName: order.user.name ?? "Customer",
      },
    });
  } catch (error) {
    console.error("Error handling invoice voided:", error);
    throw error;
  }
}

async function handlePaymentCreated(data: WebhookEvent["data"]) {
  try {
    if (!data.invoice_id) {
      console.error("No invoice_id in payment data");
      return;
    }

    // Get the invoice details to find the order
    const invoice = await zohoBilling.getInvoice(data.invoice_id);

    // Update order payment status
    const order = await db.order.update({
      where: { zohoInvoiceId: invoice.invoice.invoice_id },
      data: {
        status: invoice.invoice.status === "paid" ? "paid" : "pending",
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!order || !order.user.email || !data.amount) {
      console.error(
        `Order not found or invalid data for invoice ${invoice.invoice.invoice_id}`,
      );
      return;
    }

    // Send payment received notification
    await sendEmail({
      to: order.user.email,
      subject: "Payment Received",
      template: "payment-received",
      data: {
        orderNumber: order.id,
        customerName: order.user.name ?? "Customer",
        amount: data.amount,
      },
    });
  } catch (error) {
    console.error("Error handling payment created:", error);
    throw error;
  }
}

async function handleRefundCreated(data: WebhookEvent["data"]) {
  try {
    if (!data.payment_id) {
      console.error("No payment_id in refund data");
      return;
    }

    // Get the payment details to find the order
    const payment = await zohoBilling.getPayment(data.payment_id);

    // Update order status
    const order = await db.order.update({
      where: { zohoInvoiceId: payment.invoice_id },
      data: { status: "refunded" },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!order || !order.user.email || !data.amount) {
      console.error(
        `Order not found or invalid data for payment ${data.payment_id}`,
      );
      return;
    }

    // Send refund confirmation
    await sendEmail({
      to: order.user.email,
      subject: "Refund Processed",
      template: "refund-confirmation",
      data: {
        orderNumber: order.id,
        customerName: order.user.name ?? "Customer",
        amount: data.amount,
      },
    });
  } catch (error) {
    console.error("Error handling refund created:", error);
    throw error;
  }
}

// Helper functions (to be implemented in separate files)
interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

async function sendEmail(options: EmailOptions) {
  // TODO: Implement email sending logic using your preferred email service
  console.log("Sending email:", options);
}

interface FulfillmentOptions {
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

async function triggerFulfillment(options: FulfillmentOptions) {
  // TODO: Implement order fulfillment logic
  console.log("Triggering fulfillment:", options);
}
