import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, Form } from "@remix-run/react";
import {
    Page, Layout, Card, FormLayout, TextField, Button, BlockStack, Text, Box, Select
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: any) => {
    const { session } = await authenticate.admin(request);
    const design = await prisma.customSizeDesign.findUnique({
        where: { shop: session.shop }
    });
    return json({ design });
};

export const action = async ({ request }: any) => {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    // Parse borderWidth as int
    if (data.borderWidth) data.borderWidth = parseInt(data.borderWidth as string);

    await prisma.customSizeDesign.upsert({
        where: { shop: session.shop },
        update: data,
        create: {
            shop: session.shop,
            ...data
        }
    });

    return json({ status: "success" });
};

export default function DesignSettings() {
    const { design } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const nav = useNavigation();
    const shopify = useAppBridge();

    // State initialization from loader data
    const [modalBgColor, setModalBgColor] = useState(design?.modalBgColor || "#ffffff");
    const [borderWidth, setBorderWidth] = useState(design?.borderWidth?.toString() || "1");
    const [borderStyle, setBorderStyle] = useState(design?.borderStyle || "solid");
    const [borderColor, setBorderColor] = useState(design?.borderColor || "#dddddd");
    const [textColor, setTextColor] = useState(design?.textColor || "#333333");
    const [placeholderColor, setPlaceholderColor] = useState(design?.placeholderColor || "#999999");
    const [titleColor, setTitleColor] = useState(design?.titleColor || "#000000");
    const [noteColor, setNoteColor] = useState(design?.noteColor || "#666666");
    const [noteBgColor, setNoteBgColor] = useState(design?.noteBgColor || "#f9f9f9");
    const [customCss, setCustomCss] = useState(design?.customCss || "");

    const isSaving = nav.state === "submitting";

    const handleSave = () => {
        const formData = new FormData();
        formData.append("modalBgColor", modalBgColor);
        formData.append("borderWidth", borderWidth);
        formData.append("borderStyle", borderStyle);
        formData.append("borderColor", borderColor);
        formData.append("textColor", textColor);
        formData.append("placeholderColor", placeholderColor);
        formData.append("titleColor", titleColor);
        formData.append("noteColor", noteColor);
        formData.append("noteBgColor", noteBgColor);
        formData.append("customCss", customCss);

        submit(formData, { method: "post" });
    };

    useEffect(() => {
        if (nav.state === "idle" && nav.formMethod === "post") {
            shopify.toast.show("Settings saved");
        }
    }, [nav.state, nav.formMethod, shopify]);

    return (
        <Page>
            <TitleBar title="Design Settings">
                <button variant="primary" onClick={handleSave} disabled={isSaving}>Save</button>
            </TitleBar>
            <BlockStack gap="500">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <Text as="h2" variant="headingMd">General Styles</Text>
                                <FormLayout>
                                    <FormLayout.Group>
                                        <TextField label="Modal Background Color" type="color" value={modalBgColor} onChange={setModalBgColor} autoComplete="off" />
                                        <TextField label="Text Color" type="color" value={textColor} onChange={setTextColor} autoComplete="off" />
                                    </FormLayout.Group>
                                    <FormLayout.Group>
                                        <TextField label="Placeholder Color" type="color" value={placeholderColor} onChange={setPlaceholderColor} autoComplete="off" />
                                        <TextField label="Title Color" type="color" value={titleColor} onChange={setTitleColor} autoComplete="off" />
                                    </FormLayout.Group>
                                </FormLayout>
                            </BlockStack>
                        </Card>

                        <Box paddingBlockStart="400">
                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h2" variant="headingMd">Borders</Text>
                                    <FormLayout>
                                        <FormLayout.Group>
                                            <TextField label="Border Width (px)" type="number" value={borderWidth} onChange={setBorderWidth} autoComplete="off" />
                                            <Select label="Border Style" options={['solid', 'dashed', 'dotted', 'none']} value={borderStyle} onChange={setBorderStyle} />
                                            <TextField label="Border Color" type="color" value={borderColor} onChange={setBorderColor} autoComplete="off" />
                                        </FormLayout.Group>
                                    </FormLayout>
                                </BlockStack>
                            </Card>
                        </Box>

                        <Box paddingBlockStart="400">
                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h2" variant="headingMd">Note Section</Text>
                                    <FormLayout>
                                        <FormLayout.Group>
                                            <TextField label="Note Text Color" type="color" value={noteColor} onChange={setNoteColor} autoComplete="off" />
                                            <TextField label="Note Background Color" type="color" value={noteBgColor} onChange={setNoteBgColor} autoComplete="off" />
                                        </FormLayout.Group>
                                    </FormLayout>
                                </BlockStack>
                            </Card>
                        </Box>

                        <Box paddingBlockStart="400">
                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h2" variant="headingMd">Custom CSS</Text>
                                    <TextField label="Add your own CSS" value={customCss} onChange={setCustomCss} multiline={6} autoComplete="off" placeholder=".custom-size-modal { ... }" />
                                </BlockStack>
                            </Card>
                        </Box>
                    </Layout.Section>
                </Layout>
            </BlockStack>
        </Page>
    );
}
