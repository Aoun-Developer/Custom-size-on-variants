import { Page, Layout, Card, Text, BlockStack, List } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function Guidelines() {
    return (
        <Page>
            <TitleBar title="Guidelines" />
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text as="h2" variant="headingLg">How to Use Custom Size App</Text>

                            <BlockStack gap="300">
                                <Text as="h3" variant="headingMd">1. Create a Custom Size Set</Text>
                                <Text as="p" variant="bodyMd">
                                    Go to the dashboard and click "Create New Set". Configure your set with:
                                </Text>
                                <List type="bullet">
                                    <List.Item>Set Name (e.g., "Custom Dress Measurements")</List.Item>
                                    <List.Item>Trigger Variant Handle (e.g., "custom-size")</List.Item>
                                    <List.Item>Display Style: Choose "Modal" for a popup or "Inline" to show fields directly on the product page</List.Item>
                                    <List.Item>Optional: Add a header image, note title, and note content for customer guidance</List.Item>
                                    <List.Item>Optional: Enable "Require Nearest Size" to ask customers to select their closest standard size</List.Item>
                                </List>
                            </BlockStack>

                            <BlockStack gap="300">
                                <Text as="h3" variant="headingMd">2. Add Input Fields</Text>
                                <Text as="p" variant="bodyMd">
                                    Add the measurement fields you need (e.g., Bust, Waist, Hip, Length). Each field can be:
                                </Text>
                                <List type="bullet">
                                    <List.Item>Text or Number input</List.Item>
                                    <List.Item>Required or Optional</List.Item>
                                </List>
                                <Text as="p" variant="bodyMd" tone="subdued">
                                    Note: Free plan is limited to 3 fields. Upgrade to Pro for unlimited fields.
                                </Text>
                            </BlockStack>

                            <BlockStack gap="300">
                                <Text as="h3" variant="headingMd">3. Set Up Your Product Variants</Text>
                                <Text as="p" variant="bodyMd">
                                    In your Shopify admin, create a product variant with a handle that matches your trigger (e.g., "custom-size").
                                    The app will automatically detect when customers select this variant and display your custom size form.
                                </Text>
                            </BlockStack>

                            <BlockStack gap="300">
                                <Text as="h3" variant="headingMd">4. Customer Experience</Text>
                                <Text as="p" variant="bodyMd">
                                    When a customer selects the custom size variant:
                                </Text>
                                <List type="bullet">
                                    <List.Item><strong>Modal Mode:</strong> A popup will appear with your measurement form</List.Item>
                                    <List.Item><strong>Inline Mode:</strong> The form will appear directly below the variant selector</List.Item>
                                    <List.Item>If "Nearest Size" is enabled, customers must select their closest standard size</List.Item>
                                    <List.Item>Add to Cart button will be disabled until all required fields are filled</List.Item>
                                    <List.Item>All measurements will be saved as line item properties in the cart</List.Item>
                                </List>
                            </BlockStack>

                            <BlockStack gap="300">
                                <Text as="h3" variant="headingMd">5. Viewing Orders</Text>
                                <Text as="p" variant="bodyMd">
                                    Custom measurements will appear in your order details as line item properties, making it easy to fulfill custom orders.
                                </Text>
                            </BlockStack>

                            <BlockStack gap="300">
                                <Text as="h3" variant="headingMd">Tips for Best Results</Text>
                                <List type="bullet">
                                    <List.Item>Use clear, descriptive field labels (e.g., "Bust (in inches)" instead of just "Bust")</List.Item>
                                    <List.Item>Add helpful notes to guide customers on how to measure correctly</List.Item>
                                    <List.Item>Upload a measurement guide image for visual reference</List.Item>
                                    <List.Item>Test your setup on your storefront before going live</List.Item>
                                    <List.Item>Use "Inline" mode for a seamless checkout experience</List.Item>
                                </List>
                            </BlockStack>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
