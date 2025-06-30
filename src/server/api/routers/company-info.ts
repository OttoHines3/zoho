import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const companyInfoRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        checkoutSessionId: z.string(),
        companyName: z.string().min(1, "Company name is required"),
        contactName: z.string().min(1, "Contact name is required"),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        industry: z.string().optional(),
        companySize: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify the checkout session belongs to the current user
        const checkoutSession = await ctx.db.checkoutSession.findFirst({
          where: {
            id: input.checkoutSessionId,
            userId: ctx.session.user.id,
          },
        });

        if (!checkoutSession) {
          throw new Error("Checkout session not found or access denied");
        }

        // Check if company info already exists for this session
        const existingCompanyInfo = await ctx.db.companyInfo.findUnique({
          where: {
            checkoutSessionId: input.checkoutSessionId,
          },
        });

        if (existingCompanyInfo) {
          // Update existing company info
          const updatedCompanyInfo = await ctx.db.companyInfo.update({
            where: {
              id: existingCompanyInfo.id,
            },
            data: {
              companyName: input.companyName,
              contactName: input.contactName,
              email: input.email,
              phone: input.phone,
              address: input.address,
              city: input.city,
              state: input.state,
              zipCode: input.zipCode,
              country: input.country,
              industry: input.industry,
              companySize: input.companySize,
            },
          });

          return {
            success: true,
            data: updatedCompanyInfo,
            message: "Company information updated successfully",
          };
        } else {
          // Create new company info
          const newCompanyInfo = await ctx.db.companyInfo.create({
            data: {
              checkoutSessionId: input.checkoutSessionId,
              companyName: input.companyName,
              contactName: input.contactName,
              email: input.email,
              phone: input.phone,
              address: input.address,
              city: input.city,
              state: input.state,
              zipCode: input.zipCode,
              country: input.country,
              industry: input.industry,
              companySize: input.companySize,
            },
          });

          return {
            success: true,
            data: newCompanyInfo,
            message: "Company information saved successfully",
          };
        }
      } catch (error) {
        console.error("Error saving company info:", error);
        throw new Error("Failed to save company information");
      }
    }),

  getBySession: protectedProcedure
    .input(
      z.object({
        checkoutSessionId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        // Verify the checkout session belongs to the current user
        const checkoutSession = await ctx.db.checkoutSession.findFirst({
          where: {
            id: input.checkoutSessionId,
            userId: ctx.session.user.id,
          },
        });

        if (!checkoutSession) {
          throw new Error("Checkout session not found or access denied");
        }

        const companyInfo = await ctx.db.companyInfo.findUnique({
          where: {
            checkoutSessionId: input.checkoutSessionId,
          },
        });

        return {
          success: true,
          data: companyInfo,
        };
      } catch (error) {
        console.error("Error fetching company info:", error);
        throw new Error("Failed to fetch company information");
      }
    }),

  getByUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      const companyInfos = await ctx.db.companyInfo.findMany({
        where: {
          checkoutSession: {
            userId: ctx.session.user.id,
          },
        },
        include: {
          checkoutSession: {
            select: {
              id: true,
              status: true,
              module: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        data: companyInfos,
      };
    } catch (error) {
      console.error("Error fetching user company infos:", error);
      throw new Error("Failed to fetch company information");
    }
  }),
});
