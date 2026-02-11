
import { useState } from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, Form } from "@remix-run/react";
import {
    Page,
    Layout,
    Card,
    FormLayout,
    TextField,
    Button,
    BlockStack,
    Text,
    InlineStack,
    Box,
    Banner
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { PRO_PLAN } from "../constants";
import prisma from "../db.server";

export const loader = async ({ request, params }: any) => {
    const { session, billing } = await authenticate.admin(request);
    const { shop } = session;

    // Check subscription status
    const billingCheck = await billing.check({
        plans: [PRO_PLAN],
        isTest: true,
    });

    const isPro = billingCheck.hasActivePayment;

    if (params.id === "new") {
        return json({ set: null, isPro });
    }

    const set = await prisma.customSizeSet.findFirst({
        where: { id: parseInt(params.id), shop },
        include: { fields: { orderBy: { order: 'asc' } } }
    });

    if (!set) {
        throw new Response("Not Found", { status: 404 });
    }

    return json({ set, isPro });
};

export const action = async ({ request, params }: any) => {
    const { session, billing } = await authenticate.admin(request);
    const { shop } = session;
    const formData = await request.formData();

    const name = formData.get("name");
    const triggerVariant = formData.get("triggerVariant");
    const imageUrl = formData.get("imageUrl");
    const displayStyle = formData.get("displayStyle") as string || "MODAL";
    const noteTitle = formData.get("noteTitle") as string;
    const noteContent = formData.get("noteContent") as string;
    const reqNearestSize = formData.get("reqNearestSize") === "true";
    const fields = JSON.parse(formData.get("fields") as string);

    // Validation
    const billingCheck = await billing.check({
        plans: [PRO_PLAN],
        isTest: true,
    });
    const isPro = billingCheck.hasActivePayment;

    // Free Tier Limit Check
    if (!isPro) {
        // Check total sets count if creating new
        if (params.id === "new") {
            const count = await prisma.customSizeSet.count({ where: { shop } });
            if (count >= 1) return json({ error: "Free plan limited to 1 Set. Please upgrade." }, { status: 400 });
        }
        // Check fields count
        if (fields.length > 3) {
            return json({ error: "Free plan limited to 3 Fields. Please upgrade." }, { status: 400 });
        }
    }

    if (params.id === "new") {
        const set = await prisma.customSizeSet.create({
            data: {
                shop,
                name,
                triggerVariant,
                imageUrl,
                displayStyle,
                noteTitle,
                noteContent,
                reqNearestSize,
                fields: {
                    create: fields.map((f: any, index: number) => ({
                        label: f.label,
                        type: f.type,
                        required: f.required,
                        order: index
                    }))
                }
            }
        });
        return redirect(`/app`);
    } else {
        // Update logic (simplified: delete all fields and recreate)
        // For specific updates, need more complex logic or just update primitives
        const setId = parseInt(params.id);
        await prisma.$transaction([
            prisma.customSizeField.deleteMany({ where: { setId } }),
            prisma.customSizeSet.update({
                where: { id: setId },
                data: {
                    name,
                    triggerVariant,
                    imageUrl,
                    displayStyle,
                    noteTitle,
                    noteContent,
                    reqNearestSize,
                    fields: {
                        create: fields.map((f: any, index: number) => ({
                            label: f.label,
                            type: f.type,
                            required: f.required,
                            order: index
                        }))
                    }
                }
            })
        ]);
        return redirect(`/app`);
    }
};

export default function SetEditor() {
    const { set, isPro } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const nav = useNavigation();

    const [name, setName] = useState(set?.name || "");
    const [triggerVariant, setTriggerVariant] = useState(set?.triggerVariant || "Custom Size");
    const [imageUrl, setImageUrl] = useState(set?.imageUrl || "");
    const [displayStyle, setDisplayStyle] = useState(set?.displayStyle || "MODAL");
    const [noteTitle, setNoteTitle] = useState(set?.noteTitle || "");
    const [noteContent, setNoteContent] = useState(set?.noteContent || "");
    const [reqNearestSize, setReqNearestSize] = useState(set?.reqNearestSize || false);
    const [fields, setFields] = useState<any[]>(set?.fields || []);

    const [newFieldLabel, setNewFieldLabel] = useState("");
    const isSaving = nav.state === "submitting";

    const handleAddField = () => {
        if (!newFieldLabel) return;
        if (!isPro && fields.length >= 3) {
            shopify.toast.show("Free plan limited to 3 fields");
            return;
        }
        setFields([...fields, { label: newFieldLabel, type: "text", required: false }]);
        setNewFieldLabel("");
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("triggerVariant", triggerVariant);
        formData.append("imageUrl", imageUrl);
        formData.append("displayStyle", displayStyle);
        formData.append("noteTitle", noteTitle);
        formData.append("noteContent", noteContent);
        formData.append("reqNearestSize", String(reqNearestSize));
        formData.append("fields", JSON.stringify(fields));
        submit(formData, { method: "post" });
    };

    return (
        <Page>
            <TitleBar title={set ? "Edit Set" : "Create New Set"}>
                <button onClick={() => history.back()}>Cancel</button>
                <button variant="primary" onClick={handleSave} disabled={isSaving}>Save</button>
            </TitleBar>
            <BlockStack gap="500">
                {!isPro && (
                    <Banner title="Free Plan Restrictions" tone="warning">
                        <p>You are on the Free plan. Limited to 1 Set and 3 Fields per set.</p>
                        <Button url="/app/pricing">Upgrade to Pro</Button>
                    </Banner>
                )}
                <Layout>
                    <Layout.Section>
                        <Card>
                            <FormLayout>
                                <TextField label="Set Name" value={name} onChange={setName} autoComplete="off" />
                                <TextField label="Trigger Variant Handle" value={triggerVariant} onChange={setTriggerVariant} autoComplete="off" helpText="Exact handle of the variant option value (e.g., 'custom-size')" />

                                <BlockStack gap="200">
                                    <Text as="h2" variant="headingSm">Header Image</Text>
                                    <div style={{ width: 100, height: 100, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                                        {imageUrl ? (
                                            <img src={imageUrl} alt="Header" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Text as="span" tone="subdued">No Image</Text>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                try {
                                                    // 1. Get Upload Param
                                                    const formData = new FormData();
                                                    formData.append("filename", file.name);
                                                    formData.append("fileType", file.type);

                                                    const response = await fetch("/app/upload", { method: "POST", body: formData });
                                                    if (!response.ok) throw new Error("Failed to get upload params");
                                                    const data = await response.json();

                                                    if (data.target) {
                                                        // 2. Upload to Target
                                                        const { url, parameters } = data.target;
                                                        const uploadData = new FormData();
                                                        parameters.forEach((p: any) => uploadData.append(p.name, p.value));
                                                        uploadData.append("file", file);

                                                        const uploadResponse = await fetch(url, { method: "POST", body: uploadData });
                                                        if (!uploadResponse.ok) throw new Error("Failed to upload file to target");

                                                        // 3. Create File Resource
                                                        const createFormData = new FormData();
                                                        createFormData.append("mode", "create");
                                                        createFormData.append("resourceUrl", data.target.resourceUrl);

                                                        const createResponse = await fetch("/app/upload", { method: "POST", body: createFormData });
                                                        if (!createResponse.ok) throw new Error("Failed to create file record");
                                                        const createData = await createResponse.json();

                                                        if (createData.file?.url) {
                                                            setImageUrl(createData.file.url);
                                                            shopify.toast.show("Image uploaded!");
                                                        } else {
                                                            console.error("File creation failed:", createData);
                                                            shopify.toast.show("Upload failed: " + (createData.error || "Unknown error"));
                                                        }
                                                    }
                                                } catch (err) {
                                                    console.error("Upload error:", err);
                                                    shopify.toast.show("Upload failed. Check console.");
                                                }
                                            }
                                        }}
                                    />
                                    <TextField label="Image URL (Manual)" value={imageUrl} onChange={setImageUrl} autoComplete="off" helpText="Or paste a URL directly" />
                                </BlockStack>
                            </FormLayout>
                        </Card>

                        <Box paddingBlockStart="400">
                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h2" variant="headingMd">Display & Content</Text>
                                    <FormLayout>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <div className="Polaris-Labelled__LabelWrapper">
                                                    <div className="Polaris-Label"><label id="displayStyleLabel" htmlFor="displayStyle" className="Polaris-Label__Text">Display Style</label></div>
                                                </div>
                                                <select
                                                    id="displayStyle"
                                                    value={displayStyle}
                                                    onChange={(e) => setDisplayStyle(e.target.value)}
                                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="MODAL">Modal Popup</option>
                                                    <option value="INLINE">Inline (Below Option)</option>
                                                </select>
                                            </div>
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={reqNearestSize}
                                                        onChange={(e) => setReqNearestSize(e.target.checked)}
                                                    />
                                                    <span className="Polaris-Text--root Polaris-Text--bodyMd">Require "Nearest Size" Selection</span>
                                                </label>
                                            </div>
                                        </div>

                                        <TextField label="Note Title" value={noteTitle} onChange={setNoteTitle} autoComplete="off" placeholder="e.g. NOTE" />
                                        <TextField label="Note Content" value={noteContent} onChange={setNoteContent} autoComplete="off" multiline={4} placeholder="Guidelines for the customer..." />
                                    </FormLayout>
                                </BlockStack>
                            </Card>
                        </Box>

                        <Box paddingBlockStart="400">
                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h2" variant="headingMd">Input Fields</Text>
                                    {fields.map((field, index) => (
                                        <InlineStack key={index} gap="300" align="space-between">
                                            <Text as="span" variant="bodyMd">{index + 1}. {field.label} ({field.type})</Text>
                                            <Button tone="critical" onClick={() => setFields(fields.filter((_, i) => i !== index))}>Delete</Button>
                                        </InlineStack>
                                    ))}
                                    <InlineStack gap="300" align="end">
                                        <div style={{ flexGrow: 1 }}>
                                            <TextField label="Add Field" value={newFieldLabel} onChange={setNewFieldLabel} placeholder="Field Label (e.g. Bust Size)" autoComplete="off" />
                                        </div>
                                        <Button onClick={handleAddField} disabled={!newFieldLabel}>Add Field</Button>
                                    </InlineStack>
                                </BlockStack>
                            </Card>
                        </Box>
                    </Layout.Section>
                </Layout>
            </BlockStack>
        </Page>
    );
}
