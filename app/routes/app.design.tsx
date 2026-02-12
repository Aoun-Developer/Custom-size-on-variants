import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, Form } from "@remix-run/react";
import {
    Page, Layout, Card, FormLayout, TextField, Button, BlockStack, Text, Box, Select
} from "@shopify/polaris";
import { TitleBar, useAppBridge, SaveBar } from "@shopify/app-bridge-react";
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
    const [displayStyle, setDisplayStyle] = useState(design?.displayStyle || "INLINE");

    // Font Sizes - Desktop
    const [noteTitleFontSizeDesktop, setNoteTitleFontSizeDesktop] = useState(design?.noteTitleFontSizeDesktop || "18px");
    const [noteContentFontSizeDesktop, setNoteContentFontSizeDesktop] = useState(design?.noteContentFontSizeDesktop || "14px");
    const [fieldTitleFontSizeDesktop, setFieldTitleFontSizeDesktop] = useState(design?.fieldTitleFontSizeDesktop || "14px");
    const [fieldPlaceholderFontSizeDesktop, setFieldPlaceholderFontSizeDesktop] = useState(design?.fieldPlaceholderFontSizeDesktop || "13px");

    // Font Sizes - Mobile
    const [noteTitleFontSizeMobile, setNoteTitleFontSizeMobile] = useState(design?.noteTitleFontSizeMobile || "16px");
    const [noteContentFontSizeMobile, setNoteContentFontSizeMobile] = useState(design?.noteContentFontSizeMobile || "13px");
    const [fieldTitleFontSizeMobile, setFieldTitleFontSizeMobile] = useState(design?.fieldTitleFontSizeMobile || "13px");
    const [fieldPlaceholderFontSizeMobile, setFieldPlaceholderFontSizeMobile] = useState(design?.fieldPlaceholderFontSizeMobile || "12px");

    // Nearest Size Styling - Desktop
    const [nsTitleFontSizeDesktop, setNsTitleFontSizeDesktop] = useState(design?.nsTitleFontSizeDesktop || "1.1rem");
    const [nsSubtitleFontSizeDesktop, setNsSubtitleFontSizeDesktop] = useState(design?.nsSubtitleFontSizeDesktop || "0.95rem");
    const [nsVariantFontSizeDesktop, setNsVariantFontSizeDesktop] = useState(design?.nsVariantFontSizeDesktop || "14px");
    const [nsVariantPaddingDesktop, setNsVariantPaddingDesktop] = useState(design?.nsVariantPaddingDesktop || "8px 12px");
    const [nsVariantBorderRadiusDesktop, setNsVariantBorderRadiusDesktop] = useState(design?.nsVariantBorderRadiusDesktop || "4px");

    // Nearest Size Styling - Mobile
    const [nsTitleFontSizeMobile, setNsTitleFontSizeMobile] = useState(design?.nsTitleFontSizeMobile || "1rem");
    const [nsSubtitleFontSizeMobile, setNsSubtitleFontSizeMobile] = useState(design?.nsSubtitleFontSizeMobile || "0.9rem");
    const [nsVariantFontSizeMobile, setNsVariantFontSizeMobile] = useState(design?.nsVariantFontSizeMobile || "13px");
    const [nsVariantPaddingMobile, setNsVariantPaddingMobile] = useState(design?.nsVariantPaddingMobile || "6px 10px");
    const [nsVariantBorderRadiusMobile, setNsVariantBorderRadiusMobile] = useState(design?.nsVariantBorderRadiusMobile || "4px");

    const isSaving = nav.state === "submitting";
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const initialState = {
            modalBgColor: design?.modalBgColor || "#ffffff",
            borderWidth: design?.borderWidth?.toString() || "1",
            borderStyle: design?.borderStyle || "solid",
            borderColor: design?.borderColor || "#dddddd",
            textColor: design?.textColor || "#333333",
            placeholderColor: design?.placeholderColor || "#999999",
            titleColor: design?.titleColor || "#000000",
            noteColor: design?.noteColor || "#666666",
            noteBgColor: design?.noteBgColor || "#f9f9f9",
            customCss: design?.customCss || "",
            noteTitleFontSizeDesktop: design?.noteTitleFontSizeDesktop || "18px",
            noteContentFontSizeDesktop: design?.noteContentFontSizeDesktop || "14px",
            fieldTitleFontSizeDesktop: design?.fieldTitleFontSizeDesktop || "14px",
            fieldPlaceholderFontSizeDesktop: design?.fieldPlaceholderFontSizeDesktop || "13px",
            noteTitleFontSizeMobile: design?.noteTitleFontSizeMobile || "16px",
            noteContentFontSizeMobile: design?.noteContentFontSizeMobile || "13px",
            fieldTitleFontSizeMobile: design?.fieldTitleFontSizeMobile || "13px",
            fieldPlaceholderFontSizeMobile: design?.fieldPlaceholderFontSizeMobile || "12px",
            nsTitleFontSizeDesktop: design?.nsTitleFontSizeDesktop || "1.1rem",
            nsSubtitleFontSizeDesktop: design?.nsSubtitleFontSizeDesktop || "0.95rem",
            nsVariantFontSizeDesktop: design?.nsVariantFontSizeDesktop || "14px",
            nsVariantPaddingDesktop: design?.nsVariantPaddingDesktop || "8px 12px",
            nsVariantBorderRadiusDesktop: design?.nsVariantBorderRadiusDesktop || "4px",
            nsTitleFontSizeMobile: design?.nsTitleFontSizeMobile || "1rem",
            nsSubtitleFontSizeMobile: design?.nsSubtitleFontSizeMobile || "0.9rem",
            nsVariantFontSizeMobile: design?.nsVariantFontSizeMobile || "13px",
            nsVariantPaddingMobile: design?.nsVariantPaddingMobile || "6px 10px",
            nsVariantBorderRadiusMobile: design?.nsVariantBorderRadiusMobile || "4px",
            displayStyle: design?.displayStyle || "INLINE",
        };

        const currentState = {
            modalBgColor,
            borderWidth,
            borderStyle,
            borderColor,
            textColor,
            placeholderColor,
            titleColor,
            noteColor,
            noteBgColor,
            customCss,
            noteTitleFontSizeDesktop,
            noteContentFontSizeDesktop,
            fieldTitleFontSizeDesktop,
            fieldPlaceholderFontSizeDesktop,
            noteTitleFontSizeMobile,
            noteContentFontSizeMobile,
            fieldTitleFontSizeMobile,
            fieldPlaceholderFontSizeMobile,
            nsTitleFontSizeDesktop,
            nsSubtitleFontSizeDesktop,
            nsVariantFontSizeDesktop,
            nsVariantPaddingDesktop,
            nsVariantBorderRadiusDesktop,
            nsTitleFontSizeMobile,
            nsSubtitleFontSizeMobile,
            nsVariantFontSizeMobile,
            nsVariantPaddingMobile,
            nsVariantBorderRadiusMobile,
            displayStyle,
        };

        setIsDirty(JSON.stringify(initialState) !== JSON.stringify(currentState));
    }, [
        modalBgColor, borderWidth, borderStyle, borderColor,
        textColor, placeholderColor, titleColor, noteColor, noteBgColor,
        customCss, design, displayStyle,
        noteTitleFontSizeDesktop, noteContentFontSizeDesktop,
        fieldTitleFontSizeDesktop, fieldPlaceholderFontSizeDesktop,
        noteTitleFontSizeMobile, noteContentFontSizeMobile,
        fieldTitleFontSizeMobile, fieldPlaceholderFontSizeMobile,
        nsTitleFontSizeDesktop, nsSubtitleFontSizeDesktop, nsVariantFontSizeDesktop, nsVariantPaddingDesktop, nsVariantBorderRadiusDesktop,
        nsTitleFontSizeMobile, nsSubtitleFontSizeMobile, nsVariantFontSizeMobile, nsVariantPaddingMobile, nsVariantBorderRadiusMobile
    ]);

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
        formData.append("noteTitleFontSizeDesktop", noteTitleFontSizeDesktop);
        formData.append("noteContentFontSizeDesktop", noteContentFontSizeDesktop);
        formData.append("fieldTitleFontSizeDesktop", fieldTitleFontSizeDesktop);
        formData.append("fieldPlaceholderFontSizeDesktop", fieldPlaceholderFontSizeDesktop);
        formData.append("noteTitleFontSizeMobile", noteTitleFontSizeMobile);
        formData.append("noteContentFontSizeMobile", noteContentFontSizeMobile);
        formData.append("fieldTitleFontSizeMobile", fieldTitleFontSizeMobile);
        formData.append("fieldPlaceholderFontSizeMobile", fieldPlaceholderFontSizeMobile);
        formData.append("nsTitleFontSizeDesktop", nsTitleFontSizeDesktop);
        formData.append("nsSubtitleFontSizeDesktop", nsSubtitleFontSizeDesktop);
        formData.append("nsVariantFontSizeDesktop", nsVariantFontSizeDesktop);
        formData.append("nsVariantPaddingDesktop", nsVariantPaddingDesktop);
        formData.append("nsVariantBorderRadiusDesktop", nsVariantBorderRadiusDesktop);
        formData.append("nsTitleFontSizeMobile", nsTitleFontSizeMobile);
        formData.append("nsSubtitleFontSizeMobile", nsSubtitleFontSizeMobile);
        formData.append("nsVariantFontSizeMobile", nsVariantFontSizeMobile);
        formData.append("nsVariantPaddingMobile", nsVariantPaddingMobile);
        formData.append("nsVariantBorderRadiusMobile", nsVariantBorderRadiusMobile);
        formData.append("displayStyle", displayStyle);
        submit(formData, { method: "post" });
    };

    useEffect(() => {
        if (nav.state === "idle" && nav.formMethod === "post") {
            shopify.toast.show("Settings saved");
        }
    }, [nav.state, nav.formMethod, shopify]);

    const handleDiscard = () => {
        // Reset states to original design values
        setModalBgColor(design?.modalBgColor || "#ffffff");
        setBorderWidth(design?.borderWidth?.toString() || "1");
        setBorderStyle(design?.borderStyle || "solid");
        setBorderColor(design?.borderColor || "#dddddd");
        setTextColor(design?.textColor || "#333333");
        setPlaceholderColor(design?.placeholderColor || "#999999");
        setTitleColor(design?.titleColor || "#000000");
        setNoteColor(design?.noteColor || "#666666");
        setNoteBgColor(design?.noteBgColor || "#f9f9f9");
        setCustomCss(design?.customCss || "");
        setDisplayStyle(design?.displayStyle || "INLINE");
        setNoteTitleFontSizeDesktop(design?.noteTitleFontSizeDesktop || "18px");
        setNoteContentFontSizeDesktop(design?.noteContentFontSizeDesktop || "14px");
        setFieldTitleFontSizeDesktop(design?.fieldTitleFontSizeDesktop || "14px");
        setFieldPlaceholderFontSizeDesktop(design?.fieldPlaceholderFontSizeDesktop || "13px");
        setNoteTitleFontSizeMobile(design?.noteTitleFontSizeMobile || "16px");
        setNoteContentFontSizeMobile(design?.noteContentFontSizeMobile || "13px");
        setFieldTitleFontSizeMobile(design?.fieldTitleFontSizeMobile || "13px");
        setFieldPlaceholderFontSizeMobile(design?.fieldPlaceholderFontSizeMobile || "12px");
        setNsTitleFontSizeDesktop(design?.nsTitleFontSizeDesktop || "1.1rem");
        setNsSubtitleFontSizeDesktop(design?.nsSubtitleFontSizeDesktop || "0.95rem");
        setNsVariantFontSizeDesktop(design?.nsVariantFontSizeDesktop || "14px");
        setNsVariantPaddingDesktop(design?.nsVariantPaddingDesktop || "8px 12px");
        setNsVariantBorderRadiusDesktop(design?.nsVariantBorderRadiusDesktop || "4px");
        setNsTitleFontSizeMobile(design?.nsTitleFontSizeMobile || "1rem");
        setNsSubtitleFontSizeMobile(design?.nsSubtitleFontSizeMobile || "0.9rem");
        setNsVariantFontSizeMobile(design?.nsVariantFontSizeMobile || "13px");
        setNsVariantPaddingMobile(design?.nsVariantPaddingMobile || "6px 10px");
        setNsVariantBorderRadiusMobile(design?.nsVariantBorderRadiusMobile || "4px");
    };

    return (
        <Page>
            <TitleBar title="Design Settings">
                <button variant="primary" onClick={handleSave} disabled={isSaving || !isDirty}>Save</button>
            </TitleBar>
            <SaveBar open={isDirty}>
                <button variant="primary" onClick={handleSave} loading={isSaving ? "" : undefined} disabled={isSaving}>Save</button>
                <button onClick={handleDiscard}>Discard</button>
            </SaveBar>
            <BlockStack gap="500">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <Text as="h2" variant="headingMd">Display Selection</Text>
                                <Select
                                    label="Display Style"
                                    options={[
                                        { label: 'Inline (Inside Product Page)', value: 'INLINE' },
                                        { label: 'Modal Popup', value: 'MODAL' }
                                    ]}
                                    value={displayStyle}
                                    onChange={setDisplayStyle}
                                    helpText="Choose how the custom size fields should appear on your product page."
                                />
                            </BlockStack>
                        </Card>

                        <Box paddingBlockStart="400">
                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h2" variant="headingMd">General Styles</Text>
                                    <FormLayout>
                                        <FormLayout.Group>
                                            <TextField label="Modal Background Color" value={modalBgColor} onChange={setModalBgColor} autoComplete="off" />
                                            <TextField label="Text Color" value={textColor} onChange={setTextColor} autoComplete="off" />
                                        </FormLayout.Group>
                                        <FormLayout.Group>
                                            <TextField label="Placeholder Color" value={placeholderColor} onChange={setPlaceholderColor} autoComplete="off" />
                                            <TextField label="Title Color" value={titleColor} onChange={setTitleColor} autoComplete="off" />
                                        </FormLayout.Group>
                                    </FormLayout>
                                </BlockStack>
                            </Card>
                        </Box>

                        <Box paddingBlockStart="400">
                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h2" variant="headingMd">Borders</Text>
                                    <Text as="h5" variant="headingMd">Input Fields</Text>
                                    <FormLayout>
                                        <FormLayout.Group>
                                            <TextField label="Border Width (px)" type="number" value={borderWidth} onChange={setBorderWidth} autoComplete="off" />
                                            <Select label="Border Style" options={['solid', 'dashed', 'dotted', 'none']} value={borderStyle} onChange={setBorderStyle} />
                                            <TextField label="Border Color" value={borderColor} onChange={setBorderColor} autoComplete="off" />
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
                                            <TextField label="Note Text Color" value={noteColor} onChange={setNoteColor} autoComplete="off" />
                                            <TextField label="Note Background Color" value={noteBgColor} onChange={setNoteBgColor} autoComplete="off" />
                                        </FormLayout.Group>
                                        <Text as="h3" variant="headingSm">Note Font Sizes (Desktop)</Text>
                                        <FormLayout.Group>
                                            <TextField label="Note Title Font Size" value={noteTitleFontSizeDesktop} onChange={setNoteTitleFontSizeDesktop} autoComplete="off" placeholder="18px" />
                                            <TextField label="Note Content Font Size" value={noteContentFontSizeDesktop} onChange={setNoteContentFontSizeDesktop} autoComplete="off" placeholder="14px" />
                                        </FormLayout.Group>
                                        <Text as="h3" variant="headingSm">Note Font Sizes (Mobile)</Text>
                                        <FormLayout.Group>
                                            <TextField label="Note Title Font Size (Mobile)" value={noteTitleFontSizeMobile} onChange={setNoteTitleFontSizeMobile} autoComplete="off" placeholder="16px" />
                                            <TextField label="Note Content Font Size (Mobile)" value={noteContentFontSizeMobile} onChange={setNoteContentFontSizeMobile} autoComplete="off" placeholder="13px" />
                                        </FormLayout.Group>
                                    </FormLayout>
                                </BlockStack>
                            </Card>
                        </Box>

                        <Box paddingBlockStart="400">
                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h2" variant="headingMd">Nearest Size Styling (Desktop)</Text>
                                    <FormLayout>
                                        <FormLayout.Group>
                                            <TextField label="Title Font Size" value={nsTitleFontSizeDesktop} onChange={setNsTitleFontSizeDesktop} autoComplete="off" placeholder="1.1rem" />
                                            <TextField label="Subtitle Font Size" value={nsSubtitleFontSizeDesktop} onChange={setNsSubtitleFontSizeDesktop} autoComplete="off" placeholder="0.95rem" />
                                        </FormLayout.Group>
                                        <FormLayout.Group>
                                            <TextField label="Variant Font Size" value={nsVariantFontSizeDesktop} onChange={setNsVariantFontSizeDesktop} autoComplete="off" placeholder="14px" />
                                            <TextField label="Variant Padding" value={nsVariantPaddingDesktop} onChange={setNsVariantPaddingDesktop} autoComplete="off" placeholder="8px 12px" />
                                            <TextField label="Variant Border Radius" value={nsVariantBorderRadiusDesktop} onChange={setNsVariantBorderRadiusDesktop} autoComplete="off" placeholder="4px" />
                                        </FormLayout.Group>
                                    </FormLayout>
                                    <Box paddingBlockStart="200">
                                        <Text as="h2" variant="headingMd">Nearest Size Styling (Mobile)</Text>
                                        <FormLayout>
                                            <FormLayout.Group>
                                                <TextField label="Title Font Size (Mobile)" value={nsTitleFontSizeMobile} onChange={setNsTitleFontSizeMobile} autoComplete="off" placeholder="1rem" />
                                                <TextField label="Subtitle Font Size (Mobile)" value={nsSubtitleFontSizeMobile} onChange={setNsSubtitleFontSizeMobile} autoComplete="off" placeholder="0.9rem" />
                                            </FormLayout.Group>
                                            <FormLayout.Group>
                                                <TextField label="Variant Font Size (Mobile)" value={nsVariantFontSizeMobile} onChange={setNsVariantFontSizeMobile} autoComplete="off" placeholder="13px" />
                                                <TextField label="Variant Padding (Mobile)" value={nsVariantPaddingMobile} onChange={setNsVariantPaddingMobile} autoComplete="off" placeholder="6px 10px" />
                                                <TextField label="Variant Border Radius (Mobile)" value={nsVariantBorderRadiusMobile} onChange={setNsVariantBorderRadiusMobile} autoComplete="off" placeholder="4px" />
                                            </FormLayout.Group>
                                        </FormLayout>
                                    </Box>
                                </BlockStack>
                            </Card>
                        </Box>

                        <Box paddingBlockStart="400">
                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h2" variant="headingMd">Fields Typography</Text>
                                    <FormLayout>
                                        <Text as="h3" variant="headingSm">Desktop</Text>
                                        <FormLayout.Group>
                                            <TextField label="Field Title Font Size" value={fieldTitleFontSizeDesktop} onChange={setFieldTitleFontSizeDesktop} autoComplete="off" placeholder="14px" />
                                            <TextField label="Field Placeholder Font Size" value={fieldPlaceholderFontSizeDesktop} onChange={setFieldPlaceholderFontSizeDesktop} autoComplete="off" placeholder="13px" />
                                        </FormLayout.Group>
                                        <Text as="h3" variant="headingSm">Mobile</Text>
                                        <FormLayout.Group>
                                            <TextField label="Field Title Font Size (Mobile)" value={fieldTitleFontSizeMobile} onChange={setFieldTitleFontSizeMobile} autoComplete="off" placeholder="13px" />
                                            <TextField label="Field Placeholder Font Size (Mobile)" value={fieldPlaceholderFontSizeMobile} onChange={setFieldPlaceholderFontSizeMobile} autoComplete="off" placeholder="12px" />
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
