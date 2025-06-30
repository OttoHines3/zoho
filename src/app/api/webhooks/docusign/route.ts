import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createCaller } from "~/server/api/root";
import { createContext } from "~/server/api/trpc";

const webhookSecret = process.env.DOCUSIGN_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("x-docusign-signature-1");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing DocuSign signature header" },
        { status: 400 },
      );
    }

    // TODO: Verify DocuSign webhook signature
    // const isValid = verifyDocuSignSignature(body, signature, webhookSecret);
    // if (!isValid) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    // }

    const event = JSON.parse(body);
    console.log("DocuSign webhook event:", event);

    // Create tRPC caller for database updates
    const ctx = await createContext({ headers: headersList });
    const caller = createCaller(ctx);

    // Handle different DocuSign event types
    switch (event.event) {
      case "envelope-sent":
        await handleEnvelopeSent(caller, event);
        break;

      case "recipient-completed":
        await handleRecipientCompleted(caller, event);
        break;

      case "envelope-completed":
        await handleEnvelopeCompleted(caller, event);
        break;

      case "envelope-declined":
        await handleEnvelopeDeclined(caller, event);
        break;

      case "envelope-voided":
        await handleEnvelopeVoided(caller, event);
        break;

      default:
        console.log(`Unhandled DocuSign event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("DocuSign webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleEnvelopeSent(caller: any, event: any) {
  console.log("Envelope sent:", event.data.envelopeId);

  // Update agreement status to 'sent'
  try {
    await caller.agreement.updateStatus({
      envelopeId: event.data.envelopeId,
      status: "sent",
      eventData: event.data,
    });
  } catch (error) {
    console.error("Error updating envelope sent status:", error);
  }
}

async function handleRecipientCompleted(caller: any, event: any) {
  console.log("Recipient completed signing:", event.data.envelopeId);

  // Update agreement status to 'partially_signed'
  try {
    await caller.agreement.updateStatus({
      envelopeId: event.data.envelopeId,
      status: "partially_signed",
      eventData: event.data,
    });
  } catch (error) {
    console.error("Error updating recipient completed status:", error);
  }
}

async function handleEnvelopeCompleted(caller: any, event: any) {
  console.log("Envelope completed:", event.data.envelopeId);

  // Update agreement status to 'completed' and trigger next steps
  try {
    await caller.agreement.updateStatus({
      envelopeId: event.data.envelopeId,
      status: "completed",
      eventData: event.data,
    });

    // Trigger Zoho contact creation and sales order creation
    await caller.agreement.triggerPostCompletionActions({
      envelopeId: event.data.envelopeId,
    });
  } catch (error) {
    console.error("Error updating envelope completed status:", error);
  }
}

async function handleEnvelopeDeclined(caller: any, event: any) {
  console.log("Envelope declined:", event.data.envelopeId);

  // Update agreement status to 'declined'
  try {
    await caller.agreement.updateStatus({
      envelopeId: event.data.envelopeId,
      status: "declined",
      eventData: event.data,
    });
  } catch (error) {
    console.error("Error updating envelope declined status:", error);
  }
}

async function handleEnvelopeVoided(caller: any, event: any) {
  console.log("Envelope voided:", event.data.envelopeId);

  // Update agreement status to 'voided'
  try {
    await caller.agreement.updateStatus({
      envelopeId: event.data.envelopeId,
      status: "voided",
      eventData: event.data,
    });
  } catch (error) {
    console.error("Error updating envelope voided status:", error);
  }
}
