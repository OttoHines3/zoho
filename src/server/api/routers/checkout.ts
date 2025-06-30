import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import Stripe from "stripe";

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export const checkoutRouter = createTRPCRouter({
  createPaymentIntent: publicProcedure
    .input(
      z.object({
        quantity: z.number().min(1).max(25),
        email: z.string().email(),
        nameOnCard: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { quantity, email, nameOnCard } = input;
        const amount = quantity * 99 * 100; // $99 per module, convert to cents

        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          automatic_payment_methods: {
            enabled: true,
          },
          capture_method: "automatic", // Automatically capture payment
          metadata: {
            quantity: quantity.toString(),
            email,
            nameOnCard,
            module_type: "zoho_integration",
          },
        });

        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        };
      } catch (error) {
        console.error("Error creating payment intent:", error);
        throw new Error("Failed to create payment intent");
      }
    }),

  confirmPayment: publicProcedure
    .input(
      z.object({
        paymentIntentId: z.string(),
        paymentMethodId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { paymentIntentId, paymentMethodId } = input;

        const paymentIntent = await stripe.paymentIntents.confirm(
          paymentIntentId,
          {
            payment_method: paymentMethodId,
          },
        );

        return {
          status: paymentIntent.status,
          paymentIntentId: paymentIntent.id,
        };
      } catch (error) {
        console.error("Error confirming payment:", error);
        throw new Error("Failed to confirm payment");
      }
    }),

  capturePayment: publicProcedure
    .input(
      z.object({
        paymentIntentId: z.string(),
        amount: z.number().optional(), // Optional partial capture
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { paymentIntentId, amount } = input;

        const captureOptions: Stripe.PaymentIntentCaptureParams = {};
        if (amount) {
          captureOptions.amount_to_capture = amount;
        }

        const paymentIntent = await stripe.paymentIntents.capture(
          paymentIntentId,
          captureOptions,
        );

        return {
          status: paymentIntent.status,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          amountCaptured: paymentIntent.amount_capturable,
        };
      } catch (error) {
        console.error("Error capturing payment:", error);
        throw new Error("Failed to capture payment");
      }
    }),

  getPaymentStatus: publicProcedure
    .input(
      z.object({
        paymentIntentId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { paymentIntentId } = input;

        const paymentIntent =
          await stripe.paymentIntents.retrieve(paymentIntentId);

        return {
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          amountCaptured: paymentIntent.amount_capturable,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
          created: paymentIntent.created,
        };
      } catch (error) {
        console.error("Error retrieving payment intent:", error);
        throw new Error("Failed to retrieve payment status");
      }
    }),

  refundPayment: publicProcedure
    .input(
      z.object({
        paymentIntentId: z.string(),
        amount: z.number().optional(), // Optional partial refund
        reason: z
          .enum(["duplicate", "fraudulent", "requested_by_customer"])
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { paymentIntentId, amount, reason } = input;

        const refundOptions: Stripe.RefundCreateParams = {
          payment_intent: paymentIntentId,
        };

        if (amount) {
          refundOptions.amount = amount;
        }

        if (reason) {
          refundOptions.reason = reason;
        }

        const refund = await stripe.refunds.create(refundOptions);

        return {
          refundId: refund.id,
          status: refund.status,
          amount: refund.amount,
          currency: refund.currency,
        };
      } catch (error) {
        console.error("Error creating refund:", error);
        throw new Error("Failed to create refund");
      }
    }),

  createCustomer: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        paymentMethodId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { email, name, paymentMethodId } = input;

        const customerData: Stripe.CustomerCreateParams = {
          email,
          name,
        };

        if (paymentMethodId) {
          customerData.payment_method = paymentMethodId;
          customerData.invoice_settings = {
            default_payment_method: paymentMethodId,
          };
        }

        const customer = await stripe.customers.create(customerData);

        return {
          customerId: customer.id,
          email: customer.email,
          name: customer.name,
        };
      } catch (error) {
        console.error("Error creating customer:", error);
        throw new Error("Failed to create customer");
      }
    }),
});
