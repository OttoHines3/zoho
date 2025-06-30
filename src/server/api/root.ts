import { postRouter } from "~/server/api/routers/post";
import { checkoutRouter } from "~/server/api/routers/checkout";
import { companyInfoRouter } from "~/server/api/routers/company-info";
import { checkoutSessionRouter } from "~/server/api/routers/checkout-session";
import { agreementRouter } from "~/server/api/routers/agreement";
import { zohoRouter } from "~/server/api/routers/zoho";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  checkout: checkoutRouter,
  companyInfo: companyInfoRouter,
  checkoutSession: checkoutSessionRouter,
  agreement: agreementRouter,
  zoho: zohoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
