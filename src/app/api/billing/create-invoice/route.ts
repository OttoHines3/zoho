import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { zohoBilling } from "~/lib/zoho-billing";

interface CartItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

interface ShippingDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface CreateInvoiceRequest {
  items: CartItem[];
  shippingDetails: ShippingDetails;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CreateInvoiceRequest;
    const { items, shippingDetails } = body;

    // 1. Get or create Zoho customer
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        zohoCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let zohoCustomerId = user.zohoCustomerId;

    if (!zohoCustomerId) {
      // Create new customer in Zoho
      const customerResponse = await zohoBilling.createCustomer({
        displayName: user.name ?? user.email,
        email: user.email,
        firstName: user.name?.split(" ")[0],
        lastName: user.name?.split(" ")[1],
        billingAddress: {
          attention: shippingDetails.name,
          street: shippingDetails.address,
          city: shippingDetails.city,
          state: shippingDetails.state,
          zip: shippingDetails.zip,
          country: shippingDetails.country,
        },
      });

      zohoCustomerId = customerResponse.customer.customer_id;

      // Save Zoho customer ID
      await db.user.update({
        where: { id: user.id },
        data: { zohoCustomerId },
      });
    }

    // 2. Create invoice
    const invoiceResponse = await zohoBilling.createInvoice({
      customerId: zohoCustomerId,
      items: items.map((item) => ({
        name: item.name,
        description: item.description,
        rate: item.price,
        quantity: item.quantity,
      })),
      notes: `Shipping Address:\n${shippingDetails.name}\n${shippingDetails.address}\n${shippingDetails.city}, ${shippingDetails.state} ${shippingDetails.zip}\n${shippingDetails.country}`,
    });

    // 3. Save invoice details to database
    const order = await db.order.create({
      data: {
        userId: user.id,
        zohoInvoiceId: invoiceResponse.invoice.invoice_id,
        status: "pending",
        total: invoiceResponse.invoice.total,
        items: {
          create: items.map((item) => ({
            name: item.name,
            description: item.description ?? "",
            price: item.price,
            quantity: item.quantity,
          })),
        },
        shippingDetails: {
          create: {
            name: shippingDetails.name,
            address: shippingDetails.address,
            city: shippingDetails.city,
            state: shippingDetails.state,
            zip: shippingDetails.zip,
            country: shippingDetails.country,
          },
        },
      },
    });

    return NextResponse.json({
      invoiceId: invoiceResponse.invoice.invoice_id,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}
