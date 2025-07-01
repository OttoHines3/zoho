import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createCaller } from "~/server/api/root";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import type { AppRouter } from "~/server/api/root";

const webhookSecret = process.env.DOCUSIGN_WEBHOOK_SECRET!;

// Add type for event
type DocuSignEvent = {
  event: string;
  data: { envelopeId: string; [key: string]: unknown };
};

// Add type guard for DocuSignEvent
function isDocuSignEvent(event: unknown): event is DocuSignEvent {
  if (typeof event !== "object" || event === null) return false;
  const e = event as Record<string, unknown>;
  return (
    typeof e.event === "string" &&
    typeof e.data === "object" &&
    e.data !== null &&
    typeof (e.data as Record<string, unknown>).envelopeId === "string"
  );
}

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

    const rawEvent: unknown = JSON.parse(body);
    if (!isDocuSignEvent(rawEvent)) {
      return NextResponse.json(
        { error: "Invalid DocuSign event payload" },
        { status: 400 },
      );
    }
    const event = rawEvent;
    console.log("DocuSign webhook event:", event);

    // Create tRPC caller for database updates
    const session = await auth();
    const caller = createCaller({ db, session, headers: headersList });

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

async function handleEnvelopeSent(
  caller: ReturnType<typeof createCaller>,
  event: DocuSignEvent,
) {
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

async function handleRecipientCompleted(
  caller: ReturnType<typeof createCaller>,
  event: DocuSignEvent,
) {
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

async function handleEnvelopeCompleted(
  caller: ReturnType<typeof createCaller>,
  event: DocuSignEvent,
) {
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

async function handleEnvelopeDeclined(
  caller: ReturnType<typeof createCaller>,
  event: DocuSignEvent,
) {
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

async function handleEnvelopeVoided(
  caller: ReturnType<typeof createCaller>,
  event: DocuSignEvent,
) {
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
