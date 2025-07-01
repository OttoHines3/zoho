import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/* ─────────────────────────  constants  ───────────────────────── */
const ZOHO_BASE_URL = "https://www.zohoapis.com/crm/v3";
const ZOHO_TOKEN = process.env.ZOHO_ACCESS_TOKEN; // pk_123…

/* ────────────────────────  query schema  ─────────────────────── */
const querySchema = z.object({
  includeSalesOrders: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  includeDeals: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  includeTasks: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  includeNotes: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

/* ────────────────────────  util types  ───────────────────────── */
interface ZohoEntity {
  id: string;
  [k: string]: unknown;
}
type ZohoArray = { data: unknown[] };

const isZohoArray = (x: unknown): x is ZohoArray =>
  !!x && typeof x === "object" && Array.isArray((x as ZohoArray).data);
const isWithId = (x: unknown): x is ZohoEntity =>
  !!x && typeof x === "object" && typeof (x as ZohoEntity).id === "string";

/* ──────────────────────────  handler  ────────────────────────── */
export async function GET(
  req: NextRequest,
  { params }: { params: { zohoId: string; loginCode: string } }, // ✅ correct ctx
) {
  if (!ZOHO_TOKEN) {
    return NextResponse.json(
      { error: "Zoho token not configured" },
      { status: 500 },
    );
  }

  const { zohoId, loginCode } = params;
  if (!zohoId || loginCode.length < 6) {
    return NextResponse.json(
      { error: "Invalid zohoId or loginCode" },
      { status: 400 },
    );
  }

  /* ── parse feature flags ── */
  const qs = querySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );

  /* ── base object ── */
  const out = {
    contact: null as ZohoEntity | null,
    salesOrders: [] as ZohoEntity[],
    deals: [] as ZohoEntity[],
    tasks: [] as ZohoEntity[],
    notes: [] as ZohoEntity[],
  };

  /* ── fetch helpers ── */
  const zFetch = async (path: string) => {
    const r = await fetch(`${ZOHO_BASE_URL}${path}`, {
      headers: { Authorization: `Zoho-oauthtoken ${ZOHO_TOKEN}` },
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<unknown>;
  };

  try {
    /* contact */
    const contactRes = await zFetch(`/Contacts/${zohoId}`);
    if (isZohoArray(contactRes) && isWithId(contactRes.data[0]))
      out.contact = contactRes.data[0];

    /* optional entities */
    if (qs.includeSalesOrders) {
      const so = await zFetch(
        `/Sales_Orders/search?criteria=${encodeURIComponent(`(Contact_Name:equals:${zohoId})`)}`,
      );
      if (isZohoArray(so)) out.salesOrders = so.data.filter(isWithId);
    }
    if (qs.includeDeals) {
      const dl = await zFetch(
        `/Deals/search?criteria=${encodeURIComponent(`(Contact_Name:equals:${zohoId})`)}`,
      );
      if (isZohoArray(dl)) out.deals = dl.data.filter(isWithId);
    }
    if (qs.includeTasks) {
      const tk = await zFetch(
        `/Tasks/search?criteria=${encodeURIComponent(`(Who_Id:equals:${zohoId})`)}`,
      );
      if (isZohoArray(tk)) out.tasks = tk.data.filter(isWithId);
    }
    if (qs.includeNotes) {
      const nt = await zFetch(
        `/Notes/search?criteria=${encodeURIComponent(`(Parent_Id:equals:${zohoId})`)}`,
      );
      if (isZohoArray(nt)) out.notes = nt.data.filter(isWithId);
    }

    return NextResponse.json({ success: true, data: out, ts: Date.now() });
  } catch (err) {
    console.error("Zoho API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch CRM data" },
      { status: 502 },
    );
  }
}
