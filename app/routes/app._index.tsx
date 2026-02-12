
import { json } from "@remix-run/node";
import { useLoaderData, Link, useNavigate, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  Text,
  EmptyState,
  ResourceList,
  ResourceItem,
  InlineStack,
  Thumbnail
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: any) => {
  const { session } = await authenticate.admin(request);
  const sets = await prisma.customSizeSet.findMany({
    where: { shop: session.shop },
    include: { _count: { select: { fields: true } } },
    orderBy: { order: 'asc' }
  });
  console.log("Dashboard Sets:", JSON.stringify(sets, null, 2));
  return json({ sets });
};

export const action = async ({ request }: any) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("_action");
  const setId = formData.get("setId");

  if (action === "delete" && setId) {
    await prisma.customSizeSet.delete({
      where: {
        id: parseInt(setId as string),
        shop: session.shop
      }
    });
    return json({ success: true });
  }

  if (action === "reorder" && setId) {
    const direction = formData.get("direction");
    const currentOrder = parseInt(formData.get("order") as string);
    const shop = session.shop;

    const allSets = await prisma.customSizeSet.findMany({
      where: { shop },
      orderBy: { order: 'asc' }
    });

    const currentIndex = allSets.findIndex(s => s.id === parseInt(setId as string));
    if (currentIndex === -1) return json({ success: false });

    if (direction === "up" && currentIndex > 0) {
      const prevSet = allSets[currentIndex - 1];
      await prisma.$transaction([
        prisma.customSizeSet.update({ where: { id: parseInt(setId as string) }, data: { order: prevSet.order } }),
        prisma.customSizeSet.update({ where: { id: prevSet.id }, data: { order: currentOrder } })
      ]);
    } else if (direction === "down" && currentIndex < allSets.length - 1) {
      const nextSet = allSets[currentIndex + 1];
      await prisma.$transaction([
        prisma.customSizeSet.update({ where: { id: parseInt(setId as string) }, data: { order: nextSet.order } }),
        prisma.customSizeSet.update({ where: { id: nextSet.id }, data: { order: currentOrder } })
      ]);
    }
    return json({ success: true });
  }

  return json({ success: false });
};

export default function Index() {
  const { sets } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();

  const handleDelete = (setId: number, setName: string) => {
    if (confirm(`Are you sure you want to delete "${setName}"? This action cannot be undone.`)) {
      const formData = new FormData();
      formData.append("_action", "delete");
      formData.append("setId", String(setId));
      submit(formData, { method: "post" });
    }
  };

  const handleReorder = (setId: number, order: number, direction: "up" | "down") => {
    const formData = new FormData();
    formData.append("_action", "reorder");
    formData.append("setId", String(setId));
    formData.append("order", String(order));
    formData.append("direction", direction);
    submit(formData, { method: "post" });
  };

  return (
    <Page>
      <TitleBar title="Custom Size Dashboard">
        <button variant="primary" onClick={() => navigate("/app/set/new")}>
          Create New Set
        </button>
      </TitleBar>
      <Layout>
        <Layout.Section>
          <Card>
            {sets.length === 0 ? (
              <EmptyState
                heading="Create your first Custom Size Set"
                action={{
                  content: "Create Set",
                  onAction: () => navigate("/app/set/new"),
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Define a trigger variant, upload an image, and add input fields.</p>
              </EmptyState>
            ) : (
              <ResourceList
                resourceName={{ singular: "set", plural: "sets" }}
                items={sets}
                renderItem={(item) => (
                  <ResourceItem
                    id={item.id.toString()}
                    url={`/app/set/${item.id}`}
                    shortcutActions={[
                      {
                        content: 'Delete',
                        onAction: () => handleDelete(item.id, item.name)
                      }
                    ]}
                    media={
                      item.imageUrl ? (
                        <Thumbnail
                          source={item.imageUrl}
                          alt={item.name}
                        />
                      ) : (
                        <Thumbnail
                          source="https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png"
                          alt="Placeholder"
                        />
                      )
                    }
                  >
                    <InlineStack align="space-between">
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="bold" as="h3">
                          {item.name || "Untitled Set"}
                        </Text>
                        <div>Trigger: {item.triggerVariant}</div>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>ID: {item.id}</div>
                        <div>{item._count.fields} fields</div>
                      </BlockStack>
                      <InlineStack gap="200">
                        <Button
                          icon={() => (
                            <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
                              <path d="M15 13l-5-5-5 5h10z" />
                            </svg>
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorder(item.id, (item as any).order || 0, "up");
                          }}
                          disabled={(sets as any).indexOf(item) === 0}
                        />
                        <Button
                          icon={() => (
                            <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
                              <path d="M5 7l5 5 5-5H5z" />
                            </svg>
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorder(item.id, (item as any).order || 0, "down");
                          }}
                          disabled={(sets as any).indexOf(item) === sets.length - 1}
                        />
                      </InlineStack>
                    </InlineStack>
                  </ResourceItem>
                )}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
