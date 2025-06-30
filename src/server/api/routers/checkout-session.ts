import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const checkoutSessionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        module: z.string().optional(),
        status: z.string().default("pending"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const checkoutSession = await ctx.db.checkoutSession.create({
          data: {
            userId: ctx.session.user.id,
            module: input.module,
            status: input.status,
          },
        });

        return {
          success: true,
          data: checkoutSession,
        };
      } catch (error) {
        console.error("Error creating checkout session:", error);
        throw new Error("Failed to create checkout session");
      }
    }),

  getById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const checkoutSession = await ctx.db.checkoutSession.findFirst({
          where: {
            id: input.id,
            userId: ctx.session.user.id,
          },
          include: {
            companyInfo: true,
            salesOrder: true,
            agreement: true,
          },
        });

        if (!checkoutSession) {
          throw new Error("Checkout session not found");
        }

        return {
          success: true,
          data: checkoutSession,
        };
      } catch (error) {
        console.error("Error fetching checkout session:", error);
        throw new Error("Failed to fetch checkout session");
      }
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.string(),
        cardLast4: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const checkoutSession = await ctx.db.checkoutSession.update({
          where: {
            id: input.id,
            userId: ctx.session.user.id,
          },
          data: {
            status: input.status,
            cardLast4: input.cardLast4,
          },
        });

        return {
          success: true,
          data: checkoutSession,
        };
      } catch (error) {
        console.error("Error updating checkout session:", error);
        throw new Error("Failed to update checkout session");
      }
    }),

  getUserSessions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const checkoutSessions = await ctx.db.checkoutSession.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        include: {
          companyInfo: true,
          salesOrder: true,
          agreement: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        data: checkoutSessions,
      };
    } catch (error) {
      console.error("Error fetching user checkout sessions:", error);
      throw new Error("Failed to fetch checkout sessions");
    }
  }),
});
