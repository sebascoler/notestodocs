import { getServiceAccountToken } from "./service-account";

/**
 * Creates a Google Doc with the given text and shares it with the owner's email.
 *
 * If GOOGLE_DRIVE_FOLDER_ID is set, the doc is created inside that folder
 * (the owner must have shared that folder with the service account email once).
 *
 * Otherwise, the doc is shared directly with OWNER_EMAIL via Drive permissions.
 */
export async function createGoogleDoc(
  title: string,
  text: string
): Promise<string> {
  const accessToken = await getServiceAccountToken();
  const ownerEmail = process.env.OWNER_EMAIL;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  let documentId: string;

  if (folderId) {
    // Create the doc via Drive API so we can set the parent folder
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: title,
        mimeType: "application/vnd.google-apps.document",
        parents: [folderId],
      }),
    });

    if (!createRes.ok) {
      const error = await createRes.text();
      throw new Error(`Drive file create error: ${error}`);
    }

    const file = await createRes.json();
    documentId = file.id;
  } else {
    // Create via Docs API (goes into service account's Drive)
    const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (!createRes.ok) {
      const error = await createRes.text();
      throw new Error(`Docs create error: ${error}`);
    }

    const doc = await createRes.json();
    documentId = doc.documentId;
  }

  // Insert text content
  const updateRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: text,
            },
          },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    const error = await updateRes.text();
    throw new Error(`Docs update error: ${error}`);
  }

  // Share with the owner if no folder was used (or always, if email is set)
  if (ownerEmail) {
    await shareDocWithOwner(documentId, ownerEmail, accessToken);
  }

  return `https://docs.google.com/document/d/${documentId}/edit`;
}

async function shareDocWithOwner(
  documentId: string,
  email: string,
  accessToken: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${documentId}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "user",
        role: "writer",
        emailAddress: email,
      }),
    }
  );

  // Non-fatal: if sharing fails, the doc still exists
  if (!res.ok) {
    console.error("Failed to share doc with owner:", await res.text());
  }
}
