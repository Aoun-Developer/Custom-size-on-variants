
import { json } from "@remix-run/node";
import prisma from "../db.server";
import shopify, { unauthenticated } from "../shopify.server";
import { PRO_PLAN, ULTIMATE_PLAN } from "../constants";

export const loader = async ({ request }: any) => {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const variantParam = url.searchParams.get("variant");

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
        return json({ sets: [] }, { headers: { "Access-Control-Allow-Origin": "*" } });
    }

    // 2. Check Plan & Product Limits (Skipped for testing)
    /*
    // ... (original plan check logic)
    */

    // 3. Get Design
    const design = await prisma.customSizeDesign.findUnique({ where: { shop } });

    return json({ sets, design }, {
        headers: {
            "Access-Control-Allow-Origin": "*",
        }
    });
};
