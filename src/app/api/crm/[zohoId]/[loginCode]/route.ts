import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zoho API configuration
const ZOHO_BASE_URL = "https://www.zohoapis.com/crm/v3";
const ZOHO_ACCESS_TOKEN = process.env.ZOHO_ACCESS_TOKEN;

// Validation schema for the request
const querySchema = z.object({
  includeSalesOrders: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  includeDeals: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  includeTasks: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  includeNotes: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

interface CRMData {
  contact: any;
  salesOrders: any[];
  deals: any[];
  tasks: any[];
  notes: any[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { zohoId: string; loginCode: string } },
) {
  try {
    // 1. Validate parameters
    const { zohoId, loginCode } = params;

    if (!zohoId || !loginCode) {
      return NextResponse.json(
        { error: "Missing required parameters: zohoId and loginCode" },
        { status: 400 },
      );
    }

    // 2. Parse query parameters
    const url = new URL(request.url);
    const queryParams = querySchema.parse(Object.fromEntries(url.searchParams));

    // 3. Validate login code (you might want to add your own validation logic here)
    // For now, we'll assume the login code is valid if it's provided
    if (!loginCode || loginCode.length < 6) {
      return NextResponse.json(
        { error: "Invalid login code" },
        { status: 401 },
      );
    }

    // 4. Fetch comprehensive CRM data
    const crmData: CRMData = {
      contact: null,
      salesOrders: [],
      deals: [],
      tasks: [],
      notes: [],
    };

    // 5. Fetch contact details
    try {
      const contactResponse = await getZohoContact(zohoId);
      crmData.contact = contactResponse.data?.[0] || null;
    } catch (error) {
      console.error("Error fetching contact:", error);
      return NextResponse.json(
        { error: "Contact not found or access denied" },
        { status: 404 },
      );
    }

    // 6. Fetch sales orders (if requested)
    if (queryParams.includeSalesOrders) {
      try {
        const salesOrdersResponse = await searchZohoSalesOrders(
          `(Contact_Name:equals:${zohoId})`,
        );
        crmData.salesOrders = salesOrdersResponse.data || [];
      } catch (error) {
        console.error("Error fetching sales orders:", error);
      }
    }

    // 7. Fetch deals (if requested)
    if (queryParams.includeDeals) {
      try {
        const dealsResponse = await searchZohoDeals(
          `(Contact_Name:equals:${zohoId})`,
        );
        crmData.deals = dealsResponse.data || [];
      } catch (error) {
        console.error("Error fetching deals:", error);
      }
    }

    // 8. Fetch tasks (if requested)
    if (queryParams.includeTasks) {
      try {
        const tasksResponse = await searchZohoTasks(
          `(Who_Id:equals:${zohoId})`,
        );
        crmData.tasks = tasksResponse.data || [];
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    }

    // 9. Fetch notes (if requested)
    if (queryParams.includeNotes) {
      try {
        const notesResponse = await searchZohoNotes(
          `(Parent_Id:equals:${zohoId})`,
        );
        crmData.notes = notesResponse.data || [];
      } catch (error) {
        console.error("Error fetching notes:", error);
      }
    }

    // 10. Return the CRM data
    return NextResponse.json({
      success: true,
      data: crmData,
      message: "CRM data fetched successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in CRM data endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper functions for Zoho API calls
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
