import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { CompanyInfo, Order } from "@prisma/client";

interface OrderWithRelations extends Order {
  items: Array<{
    name: string;
    description?: string;
    price: number;
    quantity: number;
  }>;
  user: {
    email: string | null;
    name: string | null;
  };
}

export const agreementRouter = createTRPCRouter({
  getDocuSignSigningUrl: protectedProcedure
    .input(z.object({ checkoutSessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Fetch company info and order details
        const [companyInfo, order] = (await Promise.all([
          ctx.db.companyInfo.findUnique({
            where: { checkoutSessionId: input.checkoutSessionId },
          }),
          ctx.db.order.findUnique({
            where: { id: input.checkoutSessionId },
            include: {
              items: true,
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          }),
        ])) as [CompanyInfo | null, OrderWithRelations | null];

        if (!companyInfo || !order) {
          throw new Error("Required information not found for this session");
        }

        // 2. Create or update agreement record
        const agreement = await ctx.db.agreementSignatureStatus.upsert({
          where: { checkoutSessionId: input.checkoutSessionId },
          update: {
            provider: "DocuSign",
            status: "pending",
          },
          create: {
            checkoutSessionId: input.checkoutSessionId,
            provider: "DocuSign",
            status: "pending",
          },
        });

        // 3. Create document template
        const documentHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Service Agreement</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .header { text-align: center; margin-bottom: 40px; }
              .section { margin: 20px 0; }
              .signature { margin-top: 40px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f8f8f8; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Service Agreement</h1>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="section">
              <h2>Company Information</h2>
              <p>Company Name: ${companyInfo.companyName}</p>
              <p>Contact Name: ${companyInfo.contactName}</p>
              <p>Email: ${companyInfo.email ?? "N/A"}</p>
              <p>Phone: ${companyInfo.phone ?? "N/A"}</p>
              <p>Address: ${companyInfo.address ?? "N/A"}</p>
              <p>City: ${companyInfo.city ?? "N/A"}</p>
              <p>State: ${companyInfo.state ?? "N/A"}</p>
              <p>ZIP Code: ${companyInfo.zipCode ?? "N/A"}</p>
              <p>Country: ${companyInfo.country ?? "US"}</p>
            </div>

            <div class="section">
              <h2>Order Details</h2>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.description ?? "N/A"}</td>
                      <td>${item.quantity}</td>
                      <td>$${item.price.toFixed(2)}</td>
                      <td>$${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" style="text-align: right;"><strong>Total:</strong></td>
                    <td>$${order.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div class="section">
              <h2>Terms and Conditions</h2>
              <p>This is a placeholder for the terms and conditions. The actual terms will be provided by your legal team.</p>
              <ol>
                <li>Service Description</li>
                <li>Payment Terms</li>
                <li>Term and Termination</li>
                <li>Confidentiality</li>
                <li>Limitation of Liability</li>
                <li>Governing Law</li>
              </ol>
            </div>

            <div class="signature">
              <p>By signing below, you agree to the terms and conditions outlined in this agreement.</p>
              <div style="margin-top: 60px;">
                <p>____________________________</p>
                <p>Signature</p>
                <p>Name: ${companyInfo.contactName}</p>
                <p>Title: ____________________</p>
                <p>Date: ____________________</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // 4. Create DocuSign envelope with the template
        // TODO: Replace this with real DocuSign API integration
        const fakeDocuSignUrl = `https://demo.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=FAKE&Name=${encodeURIComponent(companyInfo.contactName)}&Email=${encodeURIComponent(companyInfo.email ?? "")}&EnvelopeId=${agreement.id}&Template=${encodeURIComponent(documentHtml)}`;

        return { url: fakeDocuSignUrl, envelopeId: agreement.id };
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(
            `Failed to create DocuSign envelope: ${error.message}`,
          );
        }
        throw new Error("Failed to create DocuSign envelope");
      }
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        envelopeId: z.string(),
        status: z.enum([
          "pending",
          "sent",
          "partially_signed",
          "completed",
          "declined",
          "voided",
        ]),
        eventData: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const agreement = await ctx.db.agreementSignatureStatus.findFirst({
          where: { envelopeId: input.envelopeId },
        });

        if (!agreement) {
          throw new Error("Agreement not found");
        }

        const updateData: any = {
          status: input.status,
        };

        // Set completedAt timestamp when agreement is completed
        if (input.status === "completed") {
          updateData.completedAt = new Date();
        }

        const updatedAgreement = await ctx.db.agreementSignatureStatus.update({
          where: { id: agreement.id },
          data: updateData,
          include: {
            checkoutSession: {
              include: {
                companyInfo: true,
                user: true,
              },
            },
          },
        });

        return {
          success: true,
          data: updatedAgreement,
        };
      } catch (error) {
        console.error("Error updating agreement status:", error);
        throw new Error("Failed to update agreement status");
      }
    }),

  triggerPostCompletionActions: protectedProcedure
    .input(z.object({ envelopeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the completed agreement with all related data
        const agreement = await ctx.db.agreementSignatureStatus.findFirst({
          where: { envelopeId: input.envelopeId },
          include: {
            checkoutSession: {
              include: {
                companyInfo: true,
                user: true,
              },
            },
          },
        });

        if (!agreement || agreement.status !== "completed") {
          throw new Error("Agreement not found or not completed");
        }

        const { checkoutSession } = agreement;

        // TODO: Implement Zoho contact creation
        // await createZohoContact(checkoutSession.companyInfo, checkoutSession.user);

        // TODO: Implement Zoho sales order creation
        // await createZohoSalesOrder(checkoutSession);

        // Update checkout session status to completed
        await ctx.db.checkoutSession.update({
          where: { id: checkoutSession.id },
          data: { status: "completed" },
        });

        return {
          success: true,
          message: "Post-completion actions triggered successfully",
        };
      } catch (error) {
        console.error("Error triggering post-completion actions:", error);
        throw new Error("Failed to trigger post-completion actions");
      }
    }),

  getAgreementStatus: protectedProcedure
    .input(z.object({ checkoutSessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const agreement = await ctx.db.agreementSignatureStatus.findUnique({
          where: { checkoutSessionId: input.checkoutSessionId },
        });

        return {
          success: true,
          data: agreement,
        };
      } catch (error) {
        console.error("Error fetching agreement status:", error);
        throw new Error("Failed to fetch agreement status");
      }
    }),
});
