import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recognizeText } from "@/lib/google-vision";
import { createGoogleDoc } from "@/lib/google-docs";

export const maxDuration = 30;

function isAuthorized(req: NextRequest, session: Awaited<ReturnType<typeof getServerSession>>): boolean {
  // Path 1: logged-in user via the web canvas
  if (session !== null) return true;

  // Path 2: iOS Shortcut with static API key
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    const authHeader = req.headers.get("authorization") ?? "";
    const keyFromHeader = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (keyFromHeader === apiKey) return true;

    // Also accept as query param for easier Shortcut setup
    const keyFromQuery = req.nextUrl.searchParams.get("key");
    if (keyFromQuery === apiKey) return true;
  }

  return false;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!isAuthorized(req, session)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

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
    text = await recognizeText(imageBase64);
  } catch (err) {
    return NextResponse.json(
      { error: `OCR failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  if (!text.trim()) {
    return NextResponse.json(
      { error: "No se detectó texto. Asegúrate de que la escritura sea legible y con contraste." },
      { status: 422 }
    );
  }

  let docUrl: string;
  try {
    docUrl = await createGoogleDoc(title, text);
  } catch (err) {
    return NextResponse.json(
      { error: `Google Docs error: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ docUrl, text });
}
