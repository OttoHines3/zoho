import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const agreementRouter = createTRPCRouter({
  getDocuSignSigningUrl: protectedProcedure
    .input(z.object({ checkoutSessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch company info for this session
      const companyInfo = await ctx.db.companyInfo.findUnique({
        where: { checkoutSessionId: input.checkoutSessionId },
      });
      if (!companyInfo) {
        throw new Error("Company info not found for this session");
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

      // 3. (Placeholder) Call DocuSign API to create envelope and get embedded signing URL
      // TODO: Replace this with real DocuSign API integration
      // Use companyInfo.contactName, companyInfo.email, etc. to pre-fill
      const fakeDocuSignUrl = `https://demo.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=FAKE&Name=${encodeURIComponent(companyInfo.contactName)}&Email=${encodeURIComponent(companyInfo.email ?? "test@example.com")}&EnvelopeId=${agreement.id}`;

      return { url: fakeDocuSignUrl, envelopeId: agreement.id };
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
