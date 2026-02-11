
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: any) => {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();

    // Check if we are finalizing an upload (creating the file resource)
    const mode = formData.get("mode");
    if (mode === "create") {
        const resourceUrl = formData.get("resourceUrl");
        if (!resourceUrl) return json({ error: "Missing resourceUrl" }, { status: 400 });

        // 3. File Create
        // https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/fileCreate
        const fileCreateResponse = await admin.graphql(
            `#graphql
            mutation fileCreate($files: [FileCreateInput!]!) {
                fileCreate(files: $files) {
                    files {
                        fileStatus
                        ... on GenericFile {
                            id
                            url
                        }
                        ... on MediaImage {
                            id
                            image {
                                url
                            }
                        }
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }`,
            {
                variables: {
                    files: [
                        {
                            originalSource: resourceUrl,
                            contentType: "IMAGE",
                        },
                    ],
                },
            }
        );

        const fileData = await fileCreateResponse.json();
        console.log("File Create Response:", JSON.stringify(fileData, null, 2));

        let fileObj = fileData.data?.fileCreate?.files?.[0];
        const userErrors = fileData.data?.fileCreate?.userErrors;

        if (userErrors && userErrors.length > 0) {
            console.error("File Create User Errors:", userErrors);
            return json({ error: userErrors[0].message, details: userErrors }, { status: 400 });
        }

        if (!fileObj) {
            return json({ error: "Failed to create file object", details: fileData }, { status: 500 });
        }

        // --- Polling for URL if not ready ---
        let retries = 5;
        while (!fileObj.url && !fileObj.image?.url && retries > 0) {
            await new Promise(r => setTimeout(r, 1000));
            const queryResponse = await admin.graphql(
                `#graphql
                query getFile($id: ID!) {
                    node(id: $id) {
                        ... on GenericFile {
                            id
                            url
                            fileStatus
                        }
                        ... on MediaImage {
                            id
                            fileStatus
                            image {
                                url
                            }
                        }
                    }
                }`,
                { variables: { id: fileObj.id } }
            );
            const queryData = await queryResponse.json();
            if (queryData.data?.node) {
                fileObj = queryData.data.node;
            }
            retries--;
        }

        const publicUrl = fileObj.url || fileObj.image?.url;
        console.log("Extracted URL:", publicUrl);

        if (!publicUrl) {
            return json({
                error: "File created but URL not ready. Please try again or check Files in admin.",
                file: { id: fileObj.id, status: fileObj.fileStatus }
            }, { status: 200 }); // Return success but with partial data? No, let's return error for now or handle in UI
        }

        return json({
            file: {
                id: fileObj.id,
                url: publicUrl,
                status: fileObj.fileStatus
            }
        });
    }

    const file = formData.get("file");
    const filename = formData.get("filename");
    const fileType = formData.get("fileType");

    if (!filename || !fileType) {
        return json({ error: "Missing filename or fileType" }, { status: 400 });
    }

    // 1. Stage Upload
    // https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/stagedUploadsCreate
    const stagedUploadsResponse = await admin.graphql(
        `#graphql
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }`,
        {
            variables: {
                input: [
                    {
                        filename,
                        mimeType: fileType,
                        resource: "IMAGE",
                        httpMethod: "POST",
                    },
                ],
            },
        }
    );

    const stagedData = await stagedUploadsResponse.json();
    const stagedTarget = stagedData.data?.stagedUploadsCreate?.stagedTargets?.[0];

    if (!stagedTarget) {
        return json({ error: "Failed to stage upload", details: stagedData.data?.stagedUploadsCreate?.userErrors }, { status: 500 });
    }

    // 2. Return the staging details to the client
    // The client will perform the actual POST to the 'url' with the 'parameters' and the file.
    // Then the client will call the backend again (or we handle it differently) to 'fileCreate'.
    // Actually, for a smoother experience, let's just return the staged target.
    // The Frontend will do the upload to Google Cloud (Shopify's storage).
    // Then the Frontend will send the 'resourceUrl' back to us to create the file record? 
    // OR we can try to do the upload server side if we got the file buffer?
    // Remix 'unstable_parseMultipartFormData' or similar handles files. 
    // But passing files solely through backend might accept limits. 
    // Let's try the Client-Side Upload flow which is standard for Shopify.
    // So this action is just "Get Upload Parameters".

    return json({
        target: stagedTarget,
    });
};

// We also need a mutation to "Create" the file after upload is done.
// Let's stick this in the same file but differentiate by 'action' type if needed, 
// OR just use a separate loader/action.
// Let's assume the client does:
// 1. POST /app/upload -> gets stage params
// 2. Client uploads to target.url
// 3. POST /app/upload?action=create -> creates file in Shopify

export const loader = async () => {
    return json({ ok: true });
}
