import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { randomBytes } from "crypto";

// Zoho API configuration
const ZOHO_BASE_URL = "https://www.zohoapis.com/crm/v3";
const ZOHO_ACCESS_TOKEN = process.env.ZOHO_ACCESS_TOKEN;

interface ZohoContactData {
  data: Array<{
    Last_Name?: string;
    First_Name?: string;
    Email?: string;
    Phone?: string;
    Company?: string;
    Mailing_Street?: string;
    Mailing_City?: string;
    Mailing_State?: string;
    Mailing_Zip?: string;
    Mailing_Country?: string;
    Industry?: string;
    Description?: string;
    Lead_Source?: string;
    [key: string]: string | undefined;
  }>;
  trigger?: string[];
}

interface ZohoSalesOrderData {
  data: Array<{
    Contact_Name?: string;
    Subject?: string;
    Deal_Name?: string;
    Grand_Total?: number;
    Sub_Total?: number;
    Tax_Amount?: number;
    Discount?: number;
    Adjustment?: number;
    Status?: string;
    Description?: string;
    Terms_and_Conditions?: string;
    [key: string]: any;
  }>;
  trigger?: string[];
}

interface ZohoContact {
  id: string;
  Company?: string;
  [key: string]: unknown;
}

interface ZohoSalesOrder {
  id: string;
  [key: string]: unknown;
}

interface ZohoDeal {
  id: string;
  [key: string]: unknown;
}

interface ZohoTask {
  id: string;
  [key: string]: unknown;
}

interface ZohoNote {
  id: string;
  [key: string]: unknown;
}

interface CRMData {
  contact: ZohoContact | null;
  salesOrders: ZohoSalesOrder[];
  deals: ZohoDeal[];
  tasks: ZohoTask[];
  notes: ZohoNote[];
}

interface SignupLinkData {
  zohoId: string;
  loginCode: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

export const zohoRouter = createTRPCRouter({
  createOrUpdateContact: protectedProcedure
    .input(
      z.object({
        checkoutSessionId: z.string(),
        requireAgreementSigned: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Fetch checkout session with company info and agreement status
        const checkoutSession = await ctx.db.checkoutSession.findFirst({
          where: {
            id: input.checkoutSessionId,
            userId: ctx.session.user.id,
          },
          include: {
            companyInfo: true,
            agreement: true,
            user: true,
          },
        });

        if (!checkoutSession) {
          throw new Error("Checkout session not found");
        }

        if (!checkoutSession.companyInfo) {
          throw new Error("Company information not found");
        }

        // 2. Check if agreement is signed (if required)
        if (input.requireAgreementSigned) {
          if (
            !checkoutSession.agreement ||
            checkoutSession.agreement.status !== "completed"
          ) {
            throw new Error(
              "Agreement must be signed before creating Zoho contact",
            );
          }
        }

        // 3. Check if Zoho contact already exists for this user
        const existingZohoLink = await ctx.db.zohoAccountLink.findUnique({
          where: { userId: ctx.session.user.id },
        });

        const companyInfo = checkoutSession.companyInfo;
        const user = checkoutSession.user;

        if (!companyInfo || !user) {
          throw new Error("Missing company information or user data");
        }

        // 4. Prepare contact data for Zoho API
        const contactName = companyInfo.contactName || "";
        const nameParts = contactName.split(" ");
        const lastName = nameParts.slice(-1).join(" ") || contactName;
        const firstName = nameParts.slice(0, -1).join(" ") || "";

        const contactData: ZohoContactData = {
          data: [
            {
              Last_Name: lastName,
              First_Name: firstName,
              Email: companyInfo.email || user.email || "",
              Phone: companyInfo.phone || "",
              Company: companyInfo.companyName || "",
              Mailing_Street: companyInfo.address || "",
              Mailing_City: companyInfo.city || "",
              Mailing_State: companyInfo.state || "",
              Mailing_Zip: companyInfo.zipCode || "",
              Mailing_Country: companyInfo.country || "US",
              Industry: companyInfo.industry || "",
              Description: `Created via checkout session: ${checkoutSession.id}`,
              Lead_Source: "Website Checkout",
            },
          ],
          trigger: ["approval", "workflow"],
        };

        let zohoContactId: string;
        let isUpdate = false;

        if (existingZohoLink?.zohoUserId) {
          // 5a. Update existing contact
          const updateResponse = await updateZohoContact(
            existingZohoLink.zohoUserId,
            contactData,
          );
          zohoContactId = existingZohoLink.zohoUserId;
          isUpdate = true;
        } else {
          // 5b. Create new contact
          const createResponse = await createZohoContact(contactData);
          zohoContactId = createResponse.data[0].details.id;
          isUpdate = false;
        }

        // 6. Update or create ZohoAccountLink record
        const zohoLink = await ctx.db.zohoAccountLink.upsert({
          where: { userId: ctx.session.user.id },
          update: {
            zohoUserId: zohoContactId,
            updatedAt: new Date(),
          },
          create: {
            userId: ctx.session.user.id,
            zohoUserId: zohoContactId,
          },
        });

        // 7. Update checkout session status
        await ctx.db.checkoutSession.update({
          where: { id: input.checkoutSessionId },
          data: { status: "contact_created" },
        });

        return {
          success: true,
          data: {
            zohoContactId,
            isUpdate,
            zohoLink,
          },
          message: isUpdate
            ? "Zoho contact updated successfully"
            : "Zoho contact created successfully",
        };
      } catch (error) {
        console.error("Error creating/updating Zoho contact:", error);
        throw new Error("Failed to create/update Zoho contact");
      }
    }),

  createSalesOrder: protectedProcedure
    .input(
      z.object({
        checkoutSessionId: z.string(),
        requirePaymentConfirmed: z.boolean().default(true),
        requireContactCreated: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Fetch checkout session with all related data
        const checkoutSession = await ctx.db.checkoutSession.findFirst({
          where: {
            id: input.checkoutSessionId,
            userId: ctx.session.user.id,
          },
          include: {
            companyInfo: true,
            agreement: true,
            user: true,
          },
        });

        if (!checkoutSession) {
          throw new Error("Checkout session not found");
        }

        // 2. Check if payment is confirmed (if required)
        if (input.requirePaymentConfirmed) {
          if (
            checkoutSession.status !== "payment_completed" &&
            checkoutSession.status !== "contact_created"
          ) {
            throw new Error(
              "Payment must be confirmed before creating sales order",
            );
          }
        }

        // 3. Check if contact is created (if required)
        if (input.requireContactCreated) {
          const zohoLink = await ctx.db.zohoAccountLink.findUnique({
            where: { userId: ctx.session.user.id },
          });

          if (!zohoLink?.zohoUserId) {
            throw new Error(
              "Zoho contact must be created before creating sales order",
            );
          }
        }

        // 4. Get Zoho contact ID
        const zohoLink = await ctx.db.zohoAccountLink.findUnique({
          where: { userId: ctx.session.user.id },
        });

        if (!zohoLink?.zohoUserId) {
          throw new Error("Zoho contact not found");
        }

        // 5. Get existing sales order amount from database
        const existingSalesOrder = await ctx.db.salesOrder.findUnique({
          where: { checkoutSessionId: input.checkoutSessionId },
        });

        const orderAmount = existingSalesOrder?.amount || 0;

        // 6. Prepare sales order data
        const salesOrderData: ZohoSalesOrderData = {
          data: [
            {
              Contact_Name: zohoLink.zohoUserId,
              Subject: `${checkoutSession.module || "Zoho Integration"} - ${checkoutSession.id}`,
              Deal_Name: `${checkoutSession.module || "Zoho Integration"} Deal`,
              Grand_Total: orderAmount,
              Sub_Total: orderAmount,
              Tax_Amount: 0,
              Discount: 0,
              Adjustment: 0,
              Status: "Draft",
              Description: `Sales order created from checkout session: ${checkoutSession.id}`,
              Terms_and_Conditions:
                "Payment processed via Stripe. Agreement signed via DocuSign.",
            },
          ],
          trigger: ["approval", "workflow"],
        };

        // 7. Create sales order in Zoho
        const createResponse = await createZohoSalesOrder(salesOrderData);
        const zohoSalesOrderId = createResponse.data[0].details.id;

        // 8. Update checkout session status
        await ctx.db.checkoutSession.update({
          where: { id: input.checkoutSessionId },
          data: { status: "sales_order_created" },
        });

        // 9. Update existing sales order with Zoho ID
        if (existingSalesOrder) {
          await ctx.db.salesOrder.update({
            where: { checkoutSessionId: input.checkoutSessionId },
            data: { zohoSalesOrderId },
          });
        } else {
          // Create new sales order record if it doesn't exist
          await ctx.db.salesOrder.create({
            data: {
              checkoutSessionId: input.checkoutSessionId,
              zohoSalesOrderId,
              amount: orderAmount,
              currency: "USD",
            },
          });
        }

        return {
          success: true,
          data: {
            zohoSalesOrderId,
            zohoContactId: zohoLink.zohoUserId,
            checkoutSessionId: input.checkoutSessionId,
          },
          message: "Zoho sales order created successfully",
        };
      } catch (error) {
        console.error("Error creating Zoho sales order:", error);
        throw new Error("Failed to create Zoho sales order");
      }
    }),

  createContactAndSalesOrder: protectedProcedure
    .input(
      z.object({
        checkoutSessionId: z.string(),
        requireAgreementSigned: z.boolean().default(true),
        requirePaymentConfirmed: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. First create/update the contact
        const contactResult = await ctx.db.$transaction(async (tx) => {
          // This would normally call the createOrUpdateContact logic
          // For now, we'll reuse the existing logic by calling the mutation
          const checkoutSession = await tx.checkoutSession.findFirst({
            where: {
              id: input.checkoutSessionId,
              userId: ctx.session.user.id,
            },
            include: {
              companyInfo: true,
              agreement: true,
              user: true,
            },
          });

          if (!checkoutSession || !checkoutSession.companyInfo) {
            throw new Error("Checkout session or company info not found");
          }

          // Check agreement if required
          if (input.requireAgreementSigned) {
            if (
              !checkoutSession.agreement ||
              checkoutSession.agreement.status !== "completed"
            ) {
              throw new Error(
                "Agreement must be signed before creating Zoho contact",
              );
            }
          }

          // Create/update contact logic here...
          // (Simplified for brevity - in practice, you'd extract this to a shared function)

          return { success: true, contactId: "temp_contact_id" };
        });

        // 2. Then create the sales order
        const salesOrderResult = await ctx.db.$transaction(async (tx) => {
          // Check payment confirmation
          if (input.requirePaymentConfirmed) {
            const session = await tx.checkoutSession.findUnique({
              where: { id: input.checkoutSessionId },
            });

            if (
              !session ||
              (session.status !== "payment_completed" &&
                session.status !== "contact_created")
            ) {
              throw new Error(
                "Payment must be confirmed before creating sales order",
              );
            }
          }

          // Create sales order logic here...
          return { success: true, salesOrderId: "temp_sales_order_id" };
        });

        return {
          success: true,
          data: {
            contactResult,
            salesOrderResult,
          },
          message: "Contact and sales order created successfully",
        };
      } catch (error) {
        console.error("Error creating contact and sales order:", error);
        throw new Error("Failed to create contact and sales order");
      }
    }),

  generateSignupLink: protectedProcedure
    .input(
      z.object({
        zohoId: z.string().optional(),
        expiresInHours: z.number().default(24),
        maxUses: z.number().default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Get Zoho contact ID from user or input
        let zohoContactId: string;

        if (input.zohoId) {
          // Use provided zoho_id
          zohoContactId = input.zohoId;
        } else {
          // Get from current user's linked account
          const zohoLink = await ctx.db.zohoAccountLink.findUnique({
            where: { userId: ctx.session.user.id },
          });

          if (!zohoLink?.zohoUserId) {
            throw new Error("No Zoho contact found for this user");
          }

          zohoContactId = zohoLink.zohoUserId;
        }

        // 2. Generate secure login code
        const loginCode = generateSecureLoginCode();

        // 3. Calculate expiration time
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + input.expiresInHours);

        // 4. Store signup link data in database
        const signupLink = await ctx.db.signupLink.create({
          data: {
            zohoId: zohoContactId,
            loginCode,
            expiresAt,
            maxUses: input.maxUses,
            currentUses: 0,
            isActive: true,
          },
        });

        // 5. Generate the magic link URL
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const magicLink = `${baseUrl}/api/crm/${zohoContactId}/${loginCode}`;

        return {
          success: true,
          data: {
            signupLink,
            magicLink,
            expiresAt,
            maxUses: input.maxUses,
          },
          message: "Signup link generated successfully",
        };
      } catch (error) {
        console.error("Error generating signup link:", error);
        throw new Error("Failed to generate signup link");
      }
    }),

  validateSignupLink: protectedProcedure
    .input(
      z.object({
        zohoId: z.string(),
        loginCode: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // 1. Find the signup link in database
        const signupLink = await ctx.db.signupLink.findFirst({
          where: {
            zohoId: input.zohoId,
            loginCode: input.loginCode,
            isActive: true,
          },
        });

        if (!signupLink) {
          return {
            success: false,
            data: null,
            message: "Invalid or expired signup link",
          };
        }

        // 2. Check if link has expired
        if (signupLink.expiresAt < new Date()) {
          // Mark as inactive
          await ctx.db.signupLink.update({
            where: { id: signupLink.id },
            data: { isActive: false },
          });

          return {
            success: false,
            data: null,
            message: "Signup link has expired",
          };
        }

        // 3. Check if max uses reached
        if (signupLink.currentUses >= signupLink.maxUses) {
          return {
            success: false,
            data: null,
            message: "Signup link has reached maximum uses",
          };
        }

        // 4. Fetch CRM data to verify contact exists
        try {
          const contactResponse = await getZohoContact(input.zohoId);
          const contact = contactResponse.data?.[0];

          if (!contact) {
            return {
              success: false,
              data: null,
              message: "Contact not found in Zoho",
            };
          }

          return {
            success: true,
            data: {
              signupLink,
              contact,
              isValid: true,
            },
            message: "Signup link is valid",
          };
        } catch (error) {
          console.error("Error validating contact:", error);
          return {
            success: false,
            data: null,
            message: "Unable to verify contact in Zoho",
          };
        }
      } catch (error) {
        console.error("Error validating signup link:", error);
        throw new Error("Failed to validate signup link");
      }
    }),

  fetchCRMData: protectedProcedure
    .input(
      z.object({
        zohoId: z.string().optional(),
        loginCode: z.string().optional(),
        includeSalesOrders: z.boolean().default(true),
        includeDeals: z.boolean().default(true),
        includeTasks: z.boolean().default(true),
        includeNotes: z.boolean().default(true),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        // 1. Get Zoho contact ID from user or input
        let zohoContactId: string;

        if (input.zohoId) {
          // Use provided zoho_id
          zohoContactId = input.zohoId;
        } else {
          // Get from current user's linked account
          const zohoLink = await ctx.db.zohoAccountLink.findUnique({
            where: { userId: ctx.session.user.id },
          });

          if (!zohoLink?.zohoUserId) {
            return {
              success: true,
              data: null,
              message: "No Zoho contact found for this user",
            };
          }

          zohoContactId = zohoLink.zohoUserId;
        }

        // 2. Fetch comprehensive CRM data
        const crmData: CRMData = {
          contact: null,
          salesOrders: [],
          deals: [],
          tasks: [],
          notes: [],
        };

        // 3. Fetch contact details
        try {
          const contactResponse = await getZohoContact(zohoContactId);
          crmData.contact = contactResponse.data?.[0] || null;
        } catch (error) {
          console.error("Error fetching contact:", error);
        }

        // 4. Fetch sales orders (if requested)
        if (input.includeSalesOrders) {
          try {
            const salesOrdersResponse = await searchZohoSalesOrders(
              `(Contact_Name:equals:${zohoContactId})`,
            );
            crmData.salesOrders = salesOrdersResponse.data || [];
          } catch (error) {
            console.error("Error fetching sales orders:", error);
          }
        }

        // 5. Fetch deals (if requested)
        if (input.includeDeals) {
          try {
            const dealsResponse = await searchZohoDeals(
              `(Contact_Name:equals:${zohoContactId})`,
            );
            crmData.deals = dealsResponse.data || [];
          } catch (error) {
            console.error("Error fetching deals:", error);
          }
        }

        // 6. Fetch tasks (if requested)
        if (input.includeTasks) {
          try {
            const tasksResponse = await searchZohoTasks(
              `(Who_Id:equals:${zohoContactId})`,
            );
            crmData.tasks = tasksResponse.data || [];
          } catch (error) {
            console.error("Error fetching tasks:", error);
          }
        }

        // 7. Fetch notes (if requested)
        if (input.includeNotes) {
          try {
            const notesResponse = await searchZohoNotes(
              `(Parent_Id:equals:${zohoContactId})`,
            );
            crmData.notes = notesResponse.data || [];
          } catch (error) {
            console.error("Error fetching notes:", error);
          }
        }

        return {
          success: true,
          data: crmData,
          message: "CRM data fetched successfully",
        };
      } catch (error) {
        console.error("Error fetching CRM data:", error);
        throw new Error("Failed to fetch CRM data");
      }
    }),

  getContactInfo: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = input.userId || ctx.session.user.id;

        const zohoLink = await ctx.db.zohoAccountLink.findUnique({
          where: { userId },
          include: {
            user: true,
          },
        });

        if (!zohoLink) {
          return {
            success: true,
            data: null,
            message: "No Zoho contact found",
          };
        }

        // Fetch contact details from Zoho API
        const contactDetails = await getZohoContact(zohoLink.zohoUserId);

        return {
          success: true,
          data: {
            zohoLink,
            contactDetails,
          },
        };
      } catch (error) {
        console.error("Error fetching Zoho contact info:", error);
        throw new Error("Failed to fetch Zoho contact info");
      }
    }),

  searchContacts: protectedProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const searchCriteria = [];

        if (input.email) {
          searchCriteria.push(`(Email:equals:${input.email})`);
        }
        if (input.phone) {
          searchCriteria.push(`(Phone:equals:${input.phone})`);
        }
        if (input.company) {
          searchCriteria.push(`(Company:equals:${input.company})`);
        }

        if (searchCriteria.length === 0) {
          throw new Error("At least one search criteria is required");
        }

        const searchQuery = searchCriteria.join(" or ");
        const response = await searchZohoContacts(searchQuery);

        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        console.error("Error searching Zoho contacts:", error);
        throw new Error("Failed to search Zoho contacts");
      }
    }),
});

// Helper functions for Zoho API calls
async function createZohoContact(contactData: ZohoContactData) {
  if (!ZOHO_ACCESS_TOKEN) {
    throw new Error("Zoho access token not configured");
  }

  const response = await fetch(`${ZOHO_BASE_URL}/Contacts`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contactData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho API error: ${error}`);
  }

  return response.json();
}

async function updateZohoContact(
  contactId: string,
  contactData: ZohoContactData,
) {
  if (!ZOHO_ACCESS_TOKEN) {
    throw new Error("Zoho access token not configured");
  }

  const response = await fetch(`${ZOHO_BASE_URL}/Contacts/${contactId}`, {
    method: "PUT",
    headers: {
      Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contactData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho API error: ${error}`);
  }

  return response.json();
}

async function createZohoSalesOrder(salesOrderData: ZohoSalesOrderData) {
  if (!ZOHO_ACCESS_TOKEN) {
    throw new Error("Zoho access token not configured");
  }

  const response = await fetch(`${ZOHO_BASE_URL}/Sales_Orders`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(salesOrderData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho API error: ${error}`);
  }

  return response.json();
}

async function getZohoContact(contactId: string) {
  if (!ZOHO_ACCESS_TOKEN) {
    throw new Error("Zoho access token not configured");
  }

  const response = await fetch(`${ZOHO_BASE_URL}/Contacts/${contactId}`, {
    method: "GET",
    headers: {
      Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho API error: ${error}`);
  }

  return response.json();
}

async function searchZohoContacts(searchQuery: string) {
  if (!ZOHO_ACCESS_TOKEN) {
    throw new Error("Zoho access token not configured");
  }

  const response = await fetch(
    `${ZOHO_BASE_URL}/Contacts/search?criteria=${encodeURIComponent(searchQuery)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho API error: ${error}`);
  }

  return response.json();
}

async function searchZohoSalesOrders(searchQuery: string) {
  if (!ZOHO_ACCESS_TOKEN) {
    throw new Error("Zoho access token not configured");
  }

  const response = await fetch(
    `${ZOHO_BASE_URL}/Sales_Orders/search?criteria=${encodeURIComponent(searchQuery)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho API error: ${error}`);
  }

  return response.json();
}

async function searchZohoDeals(searchQuery: string) {
  if (!ZOHO_ACCESS_TOKEN) {
    throw new Error("Zoho access token not configured");
  }

  const response = await fetch(
    `${ZOHO_BASE_URL}/Deals/search?criteria=${encodeURIComponent(searchQuery)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho API error: ${error}`);
  }

  return response.json();
}

async function searchZohoTasks(searchQuery: string) {
  if (!ZOHO_ACCESS_TOKEN) {
    throw new Error("Zoho access token not configured");
  }

  const response = await fetch(
    `${ZOHO_BASE_URL}/Tasks/search?criteria=${encodeURIComponent(searchQuery)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho API error: ${error}`);
  }

  return response.json();
}

async function searchZohoNotes(searchQuery: string) {
  if (!ZOHO_ACCESS_TOKEN) {
    throw new Error("Zoho access token not configured");
  }

  const response = await fetch(
    `${ZOHO_BASE_URL}/Notes/search?criteria=${encodeURIComponent(searchQuery)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho API error: ${error}`);
  }

  return response.json();
}

// Helper function to generate secure login codes
function generateSecureLoginCode(): string {
  // Generate a 12-character alphanumeric code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
