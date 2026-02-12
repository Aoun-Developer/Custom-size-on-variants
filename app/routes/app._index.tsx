import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useNavigate, useSubmit, useNavigation } from "@remix-run/react";
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
  Thumbnail,
  Box
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandleIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }: { request: Request }) => {
  const { session } = await authenticate.admin(request);
  const sets = await prisma.customSizeSet.findMany({
    where: { shop: session.shop },
    include: { _count: { select: { fields: true } } },
    orderBy: { order: 'asc' }
  });
  console.log("Dashboard Sets:", JSON.stringify(sets, null, 2));
  return json({ sets });
};

export const action = async ({ request }: { request: Request }) => {
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

  if (action === "reorder_all") {
    const newIds = JSON.parse(formData.get("newIds") as string);
    await prisma.$transaction(
      newIds.map((id: number, index: number) =>
        prisma.customSizeSet.update({
          where: { id },
          data: { order: index }
        })
      )
    );
    return json({ success: true });
  }

  return json({ success: false });
};

interface CustomSizeSet {
  id: number;
  name: string | null;
  triggerVariant: string | null;
  imageUrl: string | null;
  _count: {
    fields: number;
  };
}

function SortableItem({ id, item, handleDelete }: { id: string; item: CustomSizeSet; handleDelete: (id: number, name: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as const,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ResourceItem
        id={id}
        url={`/app/set/${item.id}`}
        media={
          item.imageUrl ? (
            <Thumbnail
              source={item.imageUrl}
              alt={item.name || "Set image"}
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
          <InlineStack gap="300" align="center">
            <div
              {...attributes}
              {...listeners}
              style={{ cursor: 'grab', display: 'flex', alignItems: 'center', padding: '8px', marginLeft: '-8px' }}
            >
              <svg viewBox="0 0 20 20" width="20" height="20" fill="#666">
                <path d="M7 2h2v2H7V2zm4 0h2v2h-2V2zM7 5h2v2H7V5zm4 0h2v2h-2V5zm-4 3h2v2H7V8zm4 0h2v2h-2V8zm-4 3h2v2H7v-2zm4 0h2v2h-2v-2zm-4 3h2v2H7v-2zm4 0h2v2h-2v-2z" />
              </svg>
            </div>
            <BlockStack gap="100">
              <Text variant="bodyMd" fontWeight="bold" as="h3">
                {item.name || "Untitled Set"}
              </Text>
              <div>Trigger: {item.triggerVariant}</div>
              <div style={{ fontSize: '0.8em', color: '#666' }}>ID: {item.id}</div>
              <div>{item._count.fields} fields</div>
            </BlockStack>
          </InlineStack>
          <InlineStack gap="200" align="center">
            <Button
              tone="critical"
              onClick={() => handleDelete(item.id, item.name || "Untitled Set")}
            >
              Delete
            </Button>
          </InlineStack>
        </InlineStack>
      </ResourceItem>
    </div>
  );
}

export default function Index() {
  const { sets: initialSets } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [sets, setSets] = useState<CustomSizeSet[]>(initialSets as CustomSizeSet[]);

  useEffect(() => {
    setSets(initialSets);
  }, [initialSets]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDelete = (setId: number, setName: string) => {
    if (confirm(`Are you sure you want to delete "${setName}"? This action cannot be undone.`)) {
      const formData = new FormData();
      formData.append("_action", "delete");
      formData.append("setId", String(setId));
      submit(formData, { method: "post" });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sets.findIndex((item: CustomSizeSet) => item.id.toString() === active.id);
      const newIndex = sets.findIndex((item: CustomSizeSet) => item.id.toString() === over.id);

      const newSets = arrayMove(sets, oldIndex, newIndex) as CustomSizeSet[];
      setSets(newSets);

      const formData = new FormData();
      formData.append("_action", "reorder_all");
      formData.append("newIds", JSON.stringify(newSets.map((s) => s.id)));
      submit(formData, { method: "post" });
    }
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sets.map((s: CustomSizeSet) => s.id.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  <ResourceList
                    resourceName={{ singular: "set", plural: "sets" }}
                    items={sets}
                    loading={navigation.state === "submitting"}
                    renderItem={(item: CustomSizeSet) => (
                      <SortableItem
                        key={item.id}
                        id={item.id.toString()}
                        item={item}
                        handleDelete={handleDelete}
                      />
                    )}
                  />
                </SortableContext>
              </DndContext>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
