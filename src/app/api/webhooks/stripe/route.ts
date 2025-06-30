import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case "payment_intent.canceled":
        await handlePaymentIntentCanceled(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case "charge.succeeded":
        await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;

      case "charge.failed":
        await handleChargeFailed(event.data.object as Stripe.Charge);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
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

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  console.log("Payment succeeded:", paymentIntent.id);

  // Here you would typically:
  // 1. Update your database with the successful payment
  // 2. Send confirmation email to customer
  // 3. Provision the purchased modules
  // 4. Update order status

  const metadata = paymentIntent.metadata;
  console.log("Payment metadata:", metadata);

  // Example: Provision Zoho integration modules
  if (metadata.module_type === "zoho_integration") {
    const quantity = parseInt(metadata.quantity || "1");
    console.log(
      `Provisioning ${quantity} Zoho integration modules for ${metadata.email}`,
    );

    // TODO: Implement module provisioning logic
    // await provisionZohoModules(metadata.email, quantity);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment failed:", paymentIntent.id);

  // Here you would typically:
  // 1. Update order status to failed
  // 2. Send failure notification to customer
  // 3. Log the failure for review

  const metadata = paymentIntent.metadata;
  console.log("Failed payment metadata:", metadata);
}

async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent,
) {
  console.log("Payment canceled:", paymentIntent.id);

  // Here you would typically:
  // 1. Update order status to canceled
  // 2. Release any reserved inventory
  // 3. Send cancellation notification
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  console.log("Charge succeeded:", charge.id);

  // Additional charge-level processing if needed
  if (charge.payment_intent) {
    console.log("Associated payment intent:", charge.payment_intent);
  }
}

async function handleChargeFailed(charge: Stripe.Charge) {
  console.log("Charge failed:", charge.id);

  // Handle charge-level failures
  if (charge.failure_message) {
    console.log("Failure reason:", charge.failure_message);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Subscription created:", subscription.id);

  // Handle new subscription creation
  // This would be relevant if you implement recurring billing
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Subscription updated:", subscription.id);

  // Handle subscription changes
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Subscription deleted:", subscription.id);

  // Handle subscription cancellation
}
