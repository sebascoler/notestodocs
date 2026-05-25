export async function createGoogleDoc(
  title: string,
  text: string,
  accessToken: string
): Promise<string> {
  // 1. Create empty document
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
  const documentId: string = doc.documentId;

  // 2. Insert text content
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

  return `https://docs.google.com/document/d/${documentId}/edit`;
}
