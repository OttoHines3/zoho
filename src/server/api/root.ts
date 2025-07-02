import { postRouter } from "~/server/api/routers/post";
import { agreementRouter } from "~/server/api/routers/agreement";
import { companyInfoRouter } from "~/server/api/routers/company-info";
import { zohoRouter } from "~/server/api/routers/zoho";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  agreement: agreementRouter,
  companyInfo: companyInfoRouter,
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
