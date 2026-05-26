import { getServiceAccountToken } from "./service-account";

export async function recognizeText(imageBase64: string): Promise<string> {
  const accessToken = await getServiceAccountToken();

  // Strip data URI prefix if present
  const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const response = await fetch(
    "https://vision.googleapis.com/v1/images:annotate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageData },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vision API error: ${error}`);
  }

  const data = await response.json();
  const fullText = data.responses?.[0]?.fullTextAnnotation?.text ?? "";
  return fullText;
}
