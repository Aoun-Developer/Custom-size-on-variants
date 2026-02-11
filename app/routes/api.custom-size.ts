
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
        return json({ set: null }, { headers: { "Access-Control-Allow-Origin": "*" } });
    }

    // 2. Check Plan & Product Limits
    let allowed = true;
    let limit = 5; // Free Plan Limit

    try {
        const offlineSession = await prisma.session.findFirst({
            where: { shop, isOnline: false }
        });

        if (offlineSession) {
            // Check Billing
            // Use 'shopify.billing' directly as it is the instance from shopify.server.ts
            const billingCheck = await (shopify as any).billing.check({
                session: offlineSession,
                plans: [PRO_PLAN, ULTIMATE_PLAN],
                isTest: true,
            });

            if (billingCheck.hasActivePayment) {
                const activeSub = billingCheck.appSubscriptions.find((sub: any) => sub.status === "ACTIVE");
                if (activeSub?.name === PRO_PLAN) limit = 50;
                if (activeSub?.name === ULTIMATE_PLAN) limit = Number.MAX_SAFE_INTEGER;
            }

            // Count Products using GraphQL
            // unauthenticated.admin(shop) returns { admin } if an offline session exists
            const { admin } = await unauthenticated.admin(shop);

            if (admin) {
                const response = await admin.graphql(
                    `#graphql
                    query CountProducts($query: String!) {
                        productsCount(query: $query) {
                            count
                        }
                    }`,
                    { variables: { query: `variants.title:${set.triggerVariant}` } }
                );

                const data = await response.json();
                const count = data.data?.productsCount?.count || 0;

                // Log for debugging
                console.log(`[Custom Size API] Shop: ${shop}, Variant: ${variantParam}, Count: ${count}, Limit: ${limit}`);

                if (count > limit) {
                    allowed = false;
                }
            }
        }
    } catch (error) {
        console.error("Error checking limits:", error);
        // Fail open: Allow access if check fails to prevent blocking legitimate usage due to API errors
        allowed = true;
    }

    if (!allowed) {
        return json({ error: "Plan limit reached. Upgrade to add more products." }, {
            status: 402,
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    }

    return json({ set }, {
        headers: {
            "Access-Control-Allow-Origin": "*",
        }
    });
};
