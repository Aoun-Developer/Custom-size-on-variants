
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, Button, Text, Box, ExceptionList, Badge } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { PRO_PLAN, ULTIMATE_PLAN } from "../constants";

export const loader = async ({ request }: any) => {
    const { billing } = await authenticate.admin(request);
    const billingCheck = await billing.check({
        plans: [PRO_PLAN, ULTIMATE_PLAN],
        isTest: true,
    });

    // Determine current plan
    let currentPlan = "Free";
    if (billingCheck.appSubscriptions) {
        const activeSub = billingCheck.appSubscriptions.find((sub: any) => sub.status === "ACTIVE");
        if (activeSub) {
            currentPlan = activeSub.name;
        }
    }

    return json({
        currentPlan,
    });
};

export const action = async ({ request }: any) => {
    const { billing } = await authenticate.admin(request);
    const formData = await request.formData();
    const plan = formData.get("plan");

    if (plan === PRO_PLAN || plan === ULTIMATE_PLAN) {
        await billing.request({
            plan: plan as any,
            isTest: true,
            returnUrl: `https://${process.env.SHOPIFY_APP_URL}/app/pricing`,
        });
    }
    return null;
};

export default function Pricing() {
    const { currentPlan } = useLoaderData<typeof loader>();
    const submit = useSubmit();

    const handleUpgrade = (plan: string) => {
        const formData = new FormData();
        formData.append("plan", plan);
        submit(formData, { method: "post" });
    };

    const PlanCard = ({ name, price, description, features, buttonText, planName }: any) => {
        const isActive = currentPlan === planName;
        // Logic: 
        // If plan is Free and we are on Free -> Active (disabled)
        // If plan is Pro/Ultimate and we are on it -> Active (disabled)
        // If plan is Free and we are on Paid -> "Downgrade" (not implemented fully, usually just cancelling sub)
        // Ideally:
        // Free: Active if currentPlan === "Free"
        // Pro: Active if currentPlan === "Pro Plan". Upgrade if Free. Downgrade if Ultimate.
        // Ultimate: Active if currentPlan === "Ultimate Plan". Upgrade if Free/Pro.

        let isCurrent = false;
        if (planName === "Free" && currentPlan === "Free") isCurrent = true;
        if (planName === PRO_PLAN && currentPlan === PRO_PLAN) isCurrent = true;
        if (planName === ULTIMATE_PLAN && currentPlan === ULTIMATE_PLAN) isCurrent = true;

        return (
            <Box padding="400" borderColor="border" borderWidth="025" borderRadius="200" width="30%" background={isCurrent ? "bg-surface-secondary" : "bg-surface"}>
                <BlockStack gap="400" align="center">
                    <Text as="h3" variant="headingLg">{name}</Text>
                    <Text as="p" variant="bodyMd">{description}</Text>
                    <Text as="h2" variant="heading2xl">${price}<span style={{ fontSize: '14px' }}>/mo</span></Text>
                    <ExceptionList items={features.map((f: string) => ({ icon: 'checkmark', description: f }))} />

                    {isCurrent ? (
                        <Button disabled>Current Plan</Button>
                    ) : (
                        planName !== "Free" ? (
                            <Button variant="primary" onClick={() => handleUpgrade(planName)}>Upgrade</Button>
                        ) : (
                            <Button disabled>Free</Button>
                        )
                    )}
                </BlockStack>
            </Box>
        );
    };

    return (
        <Page title="Plans & Pricing">
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="500">
                            <Text as="h2" variant="headingMd">Select a Plan</Text>

                            <InlineStack gap="500" align="center">
                                <PlanCard
                                    name="Free"
                                    price="0"
                                    description="For testing"
                                    features={['1 Custom Size Set', 'Max 3 Input Fields', 'Max 5 Active Products']}
                                    planName="Free"
                                />
                                <PlanCard
                                    name="Pro"
                                    price="50"
                                    description="For growing stores"
                                    features={['Unlimited Sets', 'Unlimited Fields', 'Max 50 Active Products']}
                                    planName={PRO_PLAN}
                                />
                                <PlanCard
                                    name="Ultimate"
                                    price="200"
                                    description="Unlimited scale"
                                    features={['Unlimited Everything', 'Priority Support']}
                                    planName={ULTIMATE_PLAN}
                                />
                            </InlineStack>

                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

function InlineStack({ children, gap, align }: any) {
    return <div style={{ display: 'flex', gap: gap === '500' ? '20px' : '10px', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>{children}</div>
}
