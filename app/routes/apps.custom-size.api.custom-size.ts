
import { json } from "@remix-run/node";
import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import { PRO_PLAN, ULTIMATE_PLAN } from "../constants";

export const loader = async ({ request }: any) => {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const variantParam = url.searchParams.get("variant");

    console.log(`[Proxy API] Request from shop: ${shop}, variant: ${variantParam}`);

    if (!shop || !variantParam) {
        return json({ error: "Missing parameters" }, {
            status: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            }
        });
    }

    const variantHandles = variantParam.split(',');

    // 1. Get the Sets
    const sets = await prisma.customSizeSet.findMany({
        where: {
            shop,
            triggerVariant: { in: variantHandles }
        },
        include: {
            fields: {
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!sets || sets.length === 0) {
        console.log(`[Proxy API] No sets found for shop: ${shop}, variants: ${variantHandles.join(',')}`);
        return json({ sets: [] }, {
            headers: {
                "Access-Control-Allow-Origin": "*",
            }
        });
    }

    // 2. Check plan limits (Skipped for testing/paused pricing)
    /*
    try {
        // ... (original plan check logic)
    } catch (err) {
        console.error("[Proxy API] Error checking plan:", err);
    }
    */

    // 3. Get Design
    const design = await prisma.customSizeDesign.findUnique({ where: { shop } });

    console.log(`[Proxy API] Returning ${sets.length} sets`);

    return json({ sets, design }, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        }
    });
};
