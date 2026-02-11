
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

    // 1. Get the Set
    const set = await prisma.customSizeSet.findFirst({
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

    if (!set) {
        console.log(`[Proxy API] No set found for shop: ${shop}, variants: ${variantHandles.join(',')}`);
        return json({ set: null }, {
            headers: {
                "Access-Control-Allow-Origin": "*",
            }
        });
    }

    // 2. Check plan limits
    try {
        const { admin } = await unauthenticated.admin(shop);

        const response = await admin.graphql(`
            query {
                app {
                    installation {
                        activeSubscriptions {
                            name
                        }
                    }
                }
            }
        `);

        const data = await response.json();
        const subscriptions = data?.data?.app?.installation?.activeSubscriptions || [];
        const activePlan = subscriptions[0]?.name || "Free";

        // Count products using this set
        const count = await prisma.customSizeSet.count({
            where: { shop, triggerVariant: set.triggerVariant }
        });

        console.log(`[Custom Size API] Shop: ${shop}, Variant: ${variantParam}, Count: ${count}, Limit: ${activePlan}`);

        let limit = 1;
        if (activePlan === PRO_PLAN) limit = 100;
        if (activePlan === ULTIMATE_PLAN) limit = Infinity;

        if (count > limit) {
            return json({
                error: "Product limit exceeded. Please upgrade your plan.",
                set: null
            }, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                }
            });
        }
    } catch (err) {
        console.error("[Proxy API] Error checking plan:", err);
        // Continue anyway - don't block customer experience
    }

    console.log(`[Proxy API] Returning set:`, set.name);

    return json({ set }, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        }
    });
};
