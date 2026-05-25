import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// Allow up to 10 MB for image payloads (App Router segment config)
export const maxDuration = 30; // seconds
import { authOptions } from "@/lib/auth";
import { recognizeText } from "@/lib/google-vision";
import { createGoogleDoc } from "@/lib/google-docs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = session.accessToken;

  let imageBase64: string;
  let title: string;

  try {
    const body = await req.json();
    imageBase64 = body.image;
    title = body.title || `Nota ${new Date().toLocaleDateString("es-ES")}`;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!imageBase64) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  let text: string;
  try {
    text = await recognizeText(imageBase64, accessToken);
  } catch (err) {
    return NextResponse.json(
      { error: `OCR failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  if (!text.trim()) {
    return NextResponse.json(
      { error: "No se detectó texto en la imagen. Intenta escribir con más contraste." },
      { status: 422 }
    );
  }

  let docUrl: string;
  try {
    docUrl = await createGoogleDoc(title, text, accessToken);
  } catch (err) {
    return NextResponse.json(
      { error: `Google Docs error: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ docUrl, text });
}
