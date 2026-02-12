
import { useState, useEffect } from "react";
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
    Banner,
    Tabs
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
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

    const isPro = true; // billingCheck.hasActivePayment;

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
    const noteTitle = formData.get("noteTitle") as string;
    const noteContent = formData.get("noteContent") as string;
    const reqNearestSize = formData.get("reqNearestSize") === "true";
    const imagePosition = formData.get("imagePosition") as string || "top";
    const imageWidth = formData.get("imageWidth") as string || "auto";
    const imageHeight = formData.get("imageHeight") as string || "auto";
    const imageContainerWidth = formData.get("imageContainerWidth") as string || "auto";
    const fieldsContainerWidth = formData.get("fieldsContainerWidth") as string || "auto";

    const mobileImagePosition = formData.get("mobileImagePosition") as string || "top";
    const mobileImageWidth = formData.get("mobileImageWidth") as string || "auto";
    const mobileImageHeight = formData.get("mobileImageHeight") as string || "auto";
    const mobileImageContainerWidth = formData.get("mobileImageContainerWidth") as string || "auto";
    const mobileFieldsContainerWidth = formData.get("mobileFieldsContainerWidth") as string || "auto";

    const fields = JSON.parse(formData.get("fields") as string);

    // Validation
    const billingCheck = await billing.check({
        plans: [PRO_PLAN],
        isTest: true,
    });
    const isPro = true; // billingCheck.hasActivePayment;

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
                noteTitle,
                noteContent,
                reqNearestSize,
                imagePosition,
                imageWidth,
                imageHeight,
                imageContainerWidth,
                fieldsContainerWidth,
                mobileImagePosition,
                mobileImageWidth,
                mobileImageHeight,
                mobileImageContainerWidth,
                mobileFieldsContainerWidth,
                fields: {
                    create: fields.map((f: any, index: number) => ({
                        label: f.label,
                        type: f.type,
                        required: f.required,
                        placeholder: f.placeholder,
                        order: index
                    }))
                }
            } as any
        });
        return redirect(`/app`);
    } else {
        // Update logic (simplified: delete all fields and recreate)
        const setId = parseInt(params.id);
        await prisma.$transaction([
            prisma.customSizeField.deleteMany({ where: { setId } }),
            prisma.customSizeSet.update({
                where: { id: setId },
                data: {
                    name,
                    triggerVariant,
                    imageUrl,
                    noteTitle,
                    noteContent,
                    reqNearestSize,
                    imagePosition,
                    imageWidth,
                    imageHeight,
                    imageContainerWidth,
                    fieldsContainerWidth,
                    mobileImagePosition,
                    mobileImageWidth,
                    mobileImageHeight,
                    mobileImageContainerWidth,
                    mobileFieldsContainerWidth,
                    fields: {
                        create: fields.map((f: any, index: number) => ({
                            label: f.label,
                            type: f.type,
                            required: f.required,
                            placeholder: f.placeholder,
                            order: index
                        }))
                    }
                } as any
            })
        ]);
        return redirect(`/app`);
    }
};

export default function SetEditor() {
    const { set, isPro } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const nav = useNavigation();
    const shopify = useAppBridge();

    const [name, setName] = useState(set?.name || "");
    const [triggerVariant, setTriggerVariant] = useState(set?.triggerVariant || "Custom Size");
    const [imageUrl, setImageUrl] = useState(set?.imageUrl || "");
    const [noteTitle, setNoteTitle] = useState(set?.noteTitle || "");
    const [noteContent, setNoteContent] = useState(set?.noteContent || "");
    const [reqNearestSize, setReqNearestSize] = useState((set as any)?.reqNearestSize || false);
    const [imagePosition, setImagePosition] = useState((set as any)?.imagePosition || "top");
    const [imageWidth, setImageWidth] = useState((set as any)?.imageWidth || "auto");
    const [imageHeight, setImageHeight] = useState((set as any)?.imageHeight || "auto");
    const [imageContainerWidth, setImageContainerWidth] = useState((set as any)?.imageContainerWidth || "auto");
    const [fieldsContainerWidth, setFieldsContainerWidth] = useState((set as any)?.fieldsContainerWidth || "auto");

    const [mobileImagePosition, setMobileImagePosition] = useState((set as any)?.mobileImagePosition || "top");
    const [mobileImageWidth, setMobileImageWidth] = useState((set as any)?.mobileImageWidth || "auto");
    const [mobileImageHeight, setMobileImageHeight] = useState((set as any)?.mobileImageHeight || "auto");
    const [mobileImageContainerWidth, setMobileImageContainerWidth] = useState((set as any)?.mobileImageContainerWidth || "auto");
    const [mobileFieldsContainerWidth, setMobileFieldsContainerWidth] = useState((set as any)?.mobileFieldsContainerWidth || "auto");

    const [fields, setFields] = useState<any[]>((set as any)?.fields || []);

    const [selectedTab, setSelectedTab] = useState(0);

    const [newFieldLabel, setNewFieldLabel] = useState("");
    const isSaving = nav.state === "submitting";

    // Dirty state tracking
    const [isDirty, setIsDirty] = useState(false);

    // Effect to check for changes
    useEffect(() => {
        const normalizeFields = (fs: any[]) => fs.map(f => ({
            label: f.label,
            type: f.type || "text",
            required: !!f.required,
            placeholder: f.placeholder || ""
        }));

        const initialState = {
            name: set?.name || "",
            triggerVariant: set?.triggerVariant || "Custom Size",
            imageUrl: set?.imageUrl || "",
            noteTitle: set?.noteTitle || "",
            noteContent: set?.noteContent || "",
            reqNearestSize: !!(set as any)?.reqNearestSize,
            imagePosition: (set as any)?.imagePosition || "top",
            imageWidth: (set as any)?.imageWidth || "auto",
            imageHeight: (set as any)?.imageHeight || "auto",
            imageContainerWidth: (set as any)?.imageContainerWidth || "auto",
            fieldsContainerWidth: (set as any)?.fieldsContainerWidth || "auto",
            mobileImagePosition: (set as any)?.mobileImagePosition || "top",
            mobileImageWidth: (set as any)?.mobileImageWidth || "auto",
            mobileImageHeight: (set as any)?.mobileImageHeight || "auto",
            mobileImageContainerWidth: (set as any)?.mobileImageContainerWidth || "auto",
            mobileFieldsContainerWidth: (set as any)?.mobileFieldsContainerWidth || "auto",
            fields: normalizeFields((set as any)?.fields || [])
        };

        const currentState = {
            name,
            triggerVariant,
            imageUrl,
            noteTitle,
            noteContent,
            reqNearestSize: !!reqNearestSize,
            imagePosition,
            imageWidth,
            imageHeight,
            imageContainerWidth,
            fieldsContainerWidth,
            mobileImagePosition,
            mobileImageWidth,
            mobileImageHeight,
            mobileImageContainerWidth,
            mobileFieldsContainerWidth,
            fields: normalizeFields(fields)
        };

        // Simple deep comparison (sufficient for this data structure)
        const hasChanged = JSON.stringify(initialState) !== JSON.stringify(currentState);
        setIsDirty(hasChanged);
    }, [name, triggerVariant, imageUrl, noteTitle, noteContent, reqNearestSize, imagePosition, imageWidth, imageHeight, imageContainerWidth, fieldsContainerWidth, mobileImagePosition, mobileImageWidth, mobileImageHeight, mobileImageContainerWidth, mobileFieldsContainerWidth, fields, set]);


    const handleAddField = () => {
        if (!newFieldLabel) return;
        if (!isPro && fields.length >= 3) {
            shopify.toast.show("Free plan limited to 3 fields");
            return;
        }
        setFields([...fields, { label: newFieldLabel, type: "text", required: false, placeholder: "" }]);
        setNewFieldLabel("");
    };

    const handleMoveField = (index: number, direction: "up" | "down") => {
        const newFields = [...fields];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newFields.length) return;
        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
        setFields(newFields);
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("triggerVariant", triggerVariant);
        formData.append("imageUrl", imageUrl);
        formData.append("noteTitle", noteTitle);
        formData.append("noteContent", noteContent);
        formData.append("reqNearestSize", String(reqNearestSize));
        formData.append("imagePosition", imagePosition);
        formData.append("imageWidth", imageWidth);
        formData.append("imageHeight", imageHeight);
        formData.append("imageContainerWidth", imageContainerWidth);
        formData.append("fieldsContainerWidth", fieldsContainerWidth);
        formData.append("mobileImagePosition", mobileImagePosition);
        formData.append("mobileImageWidth", mobileImageWidth);
        formData.append("mobileImageHeight", mobileImageHeight);
        formData.append("mobileImageContainerWidth", mobileImageContainerWidth);
        formData.append("mobileFieldsContainerWidth", mobileFieldsContainerWidth);
        formData.append("fields", JSON.stringify(fields));
        submit(formData, { method: "post" });
    };

    return (
        <Page>
            <TitleBar title={set ? "Edit Set" : "Create New Set"}>
                <button onClick={() => history.back()}>Cancel</button>
                <button variant="primary" onClick={handleSave} disabled={isSaving || !isDirty}>Save</button>
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
                                                    // 0. Get Token
                                                    const token = await shopify.idToken();
                                                    const authHeaders = { "Authorization": `Bearer ${token}` };

                                                    // 1. Get Upload Param
                                                    const formData = new FormData();
                                                    formData.append("filename", file.name);
                                                    formData.append("fileType", file.type);

                                                    const response = await fetch("/app/upload", {
                                                        method: "POST",
                                                        body: formData,
                                                        headers: authHeaders
                                                    });

                                                    if (!response.ok) {
                                                        const errText = await response.text();
                                                        throw new Error(`Failed to get upload params: ${response.status} ${errText}`);
                                                    }
                                                    const data = await response.json();

                                                    if (data.target) {
                                                        // 2. Upload to Target (No Auth Header needed for external URL)
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

                                                        const createResponse = await fetch("/app/upload", {
                                                            method: "POST",
                                                            body: createFormData,
                                                            headers: authHeaders
                                                        });

                                                        if (!createResponse.ok) {
                                                            const errText = await createResponse.text();
                                                            throw new Error(`Failed to create file record: ${createResponse.status} ${errText}`);
                                                        }
                                                        const createData = await createResponse.json();

                                                        if (createData.file?.url) {
                                                            setImageUrl(createData.file.url);
                                                            shopify.toast.show("Image uploaded!");
                                                        } else {
                                                            console.error("File creation failed:", createData);
                                                            shopify.toast.show("Upload failed: " + (createData.error || "Unknown error"));
                                                        }
                                                    }
                                                } catch (err: any) {
                                                    console.error("Upload error:", err);
                                                    shopify.toast.show(`Upload failed: ${err.message}`);
                                                }
                                            }
                                        }}
                                    />
                                    <TextField label="Image URL (Manual)" value={imageUrl} onChange={setImageUrl} autoComplete="off" helpText="Or paste a URL directly" />

                                    <Tabs
                                        tabs={[
                                            { id: 'desktop', content: 'Desktop', panelID: 'desktop-panel' },
                                            { id: 'mobile', content: 'Mobile', panelID: 'mobile-panel' }
                                        ]}
                                        selected={selectedTab}
                                        onSelect={setSelectedTab}
                                    />

                                    {selectedTab === 0 ? (
                                        <>
                                            <InlineStack gap="400">
                                                <div style={{ flex: 1 }}>
                                                    <div className="Polaris-Labelled__LabelWrapper">
                                                        <div className="Polaris-Label"><label id="imagePositionLabel" htmlFor="imagePosition" className="Polaris-Label__Text">Image Position</label></div>
                                                    </div>
                                                    <select
                                                        id="imagePosition"
                                                        value={imagePosition}
                                                        onChange={(e) => setImagePosition(e.target.value)}
                                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                    >
                                                        <option value="top">Top</option>
                                                        <option value="left">Left</option>
                                                        <option value="right">Right</option>
                                                        <option value="bottom">Bottom</option>
                                                    </select>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <TextField label="Image Width" value={imageWidth} onChange={setImageWidth} autoComplete="off" placeholder="e.g. 100px or 100%" helpText="Leave empty for auto" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <TextField label="Image Height" value={imageHeight} onChange={setImageHeight} autoComplete="off" placeholder="e.g. 100px" helpText="Leave empty for auto" />
                                                </div>
                                            </InlineStack>

                                            <InlineStack gap="400">
                                                <div style={{ flex: 1 }}>
                                                    <TextField label="Image Container Width" value={imageContainerWidth} onChange={setImageContainerWidth} autoComplete="off" placeholder="e.g. 50%" helpText="Width of the image column" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <TextField label="Fields Container Width" value={fieldsContainerWidth} onChange={setFieldsContainerWidth} autoComplete="off" placeholder="e.g. 50%" helpText="Width of the input fields column" />
                                                </div>
                                            </InlineStack>
                                        </>
                                    ) : (
                                        <>
                                            <InlineStack gap="400">
                                                <div style={{ flex: 1 }}>
                                                    <div className="Polaris-Labelled__LabelWrapper">
                                                        <div className="Polaris-Label"><label id="mobileImagePositionLabel" htmlFor="mobileImagePosition" className="Polaris-Label__Text">Mobile Image Position</label></div>
                                                    </div>
                                                    <select
                                                        id="mobileImagePosition"
                                                        value={mobileImagePosition}
                                                        onChange={(e) => setMobileImagePosition(e.target.value)}
                                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                    >
                                                        <option value="top">Top</option>
                                                        <option value="left">Left</option>
                                                        <option value="right">Right</option>
                                                        <option value="bottom">Bottom</option>
                                                    </select>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <TextField label="Mobile Image Width" value={mobileImageWidth} onChange={setMobileImageWidth} autoComplete="off" placeholder="e.g. 100px or 100%" helpText="Leave empty for auto" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <TextField label="Mobile Image Height" value={mobileImageHeight} onChange={setMobileImageHeight} autoComplete="off" placeholder="e.g. 100px" helpText="Leave empty for auto" />
                                                </div>
                                            </InlineStack>

                                            <InlineStack gap="400">
                                                <div style={{ flex: 1 }}>
                                                    <TextField label="Mobile Image Container Width" value={mobileImageContainerWidth} onChange={setMobileImageContainerWidth} autoComplete="off" placeholder="e.g. 50%" helpText="Width of the image column" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <TextField label="Mobile Fields Container Width" value={mobileFieldsContainerWidth} onChange={setMobileFieldsContainerWidth} autoComplete="off" placeholder="e.g. 50%" helpText="Width of the input fields column" />
                                                </div>
                                            </InlineStack>
                                        </>
                                    )}
                                </BlockStack>
                            </FormLayout>
                        </Card>

                        <Box paddingBlockStart="400">
                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h2" variant="headingMd">Display & Content</Text>
                                    <FormLayout>
                                        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '16px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={reqNearestSize}
                                                    onChange={(e) => setReqNearestSize(e.target.checked)}
                                                />
                                                <span className="Polaris-Text--root Polaris-Text--bodyMd">Require "Nearest Size" Selection</span>
                                            </label>
                                        </div>

                                        <TextField label="Note Title" value={noteTitle} onChange={setNoteTitle} autoComplete="off" placeholder="e.g. NOTE" />
                                        <TextField label="Guidelines" value={noteContent} onChange={setNoteContent} autoComplete="off" multiline={4} placeholder="Guidelines for the customer..." />
                                    </FormLayout>
                                </BlockStack>
                            </Card>
                        </Box>

                        <Box paddingBlockStart="400">
                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h2" variant="headingMd">Input Fields</Text>
                                    {fields.map((field, index) => (
                                        <div key={index} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                                            <InlineStack gap="300" align="space-between">
                                                <div style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'center' }}>
                                                    <Text as="span" variant="bodyMd" fontWeight="bold">{index + 1}.</Text>
                                                    <div style={{ flex: 1 }}>
                                                        <TextField
                                                            label="Label"
                                                            labelHidden
                                                            value={field.label}
                                                            onChange={(val) => {
                                                                const newFields = [...fields];
                                                                newFields[index].label = val;
                                                                setFields(newFields);
                                                            }}
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <TextField
                                                            label="Placeholder"
                                                            labelHidden
                                                            value={field.placeholder || ""}
                                                            placeholder="Placeholder (e.g. IN INCHES)"
                                                            onChange={(val) => {
                                                                const newFields = [...fields];
                                                                newFields[index].placeholder = val;
                                                                setFields(newFields);
                                                            }}
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                    <InlineStack gap="100">
                                                        <Button
                                                            size="slim"
                                                            icon={() => (
                                                                <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                                                                    <path d="M15 13l-5-5-5 5h10z" />
                                                                </svg>
                                                            )}
                                                            onClick={() => handleMoveField(index, "up")}
                                                            disabled={index === 0}
                                                        />
                                                        <Button
                                                            size="slim"
                                                            icon={() => (
                                                                <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                                                                    <path d="M5 7l5 5 5-5H5z" />
                                                                </svg>
                                                            )}
                                                            onClick={() => handleMoveField(index, "down")}
                                                            disabled={index === fields.length - 1}
                                                        />
                                                    </InlineStack>
                                                    <Button tone="critical" onClick={() => setFields(fields.filter((_, i) => i !== index))}>Delete</Button>
                                                </div>
                                            </InlineStack>
                                        </div>
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
