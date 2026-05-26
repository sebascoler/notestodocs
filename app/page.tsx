"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const DrawingCanvas = dynamic(() => import("@/components/DrawingCanvas"), {
  ssr: false,
});

type Status = "idle" | "processing" | "done" | "error";

export default function Home() {
  const { data: session, status } = useSession();
  const [processStatus, setProcessStatus] = useState<Status>("idle");

  // Lock the body to full-screen while on the canvas page
  useEffect(() => {
    document.body.classList.add("canvas-page");
    return () => document.body.classList.remove("canvas-page");
  }, []);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [detectedText, setDetectedText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = async (imageBase64: string) => {
    setProcessStatus("processing");
    setDocUrl(null);
    setDetectedText(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error desconocido");
      }

      setDocUrl(data.docUrl);
      setDetectedText(data.text);
      setProcessStatus("done");
    } catch (err) {
      setErrorMsg((err as Error).message);
      setProcessStatus("error");
    }
  };

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">notestodocs</h1>
          <p className="text-gray-500 text-sm">
            Escribe a mano en el iPad → Google Doc automático
          </p>
        </div>
        <button
          onClick={() => signIn("google")}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 active:bg-gray-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar con Google
        </button>
        <p className="text-xs text-gray-400 text-center max-w-xs">
          Se pedirán permisos para crear documentos en Google Docs y usar Google Vision para el OCR.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
        <span className="text-sm font-semibold text-gray-800">notestodocs</span>
        <div className="flex items-center gap-3">
          <Link href="/setup" className="text-xs text-blue-500">
            Configurar Shortcut →
          </Link>
          <button
            onClick={() => signOut()}
            className="text-xs text-gray-400 active:text-gray-600"
          >
            {session.user?.email} · Salir
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        <DrawingCanvas
          onExport={handleExport}
          onClear={() => {
            setProcessStatus("idle");
            setDocUrl(null);
            setDetectedText(null);
          }}
        />
      </div>

      {/* Status overlay */}
      {processStatus !== "idle" && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          {processStatus === "processing" && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="animate-spin">⏳</span> Procesando OCR y creando documento...
            </div>
          )}
          {processStatus === "error" && (
            <div className="text-sm text-red-600">
              Error: {errorMsg}
            </div>
          )}
          {processStatus === "done" && docUrl && (
            <div className="flex flex-col gap-1">
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 underline"
              >
                Abrir Google Doc →
              </a>
              {detectedText && (
                <p className="text-xs text-gray-500 line-clamp-2">{detectedText}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
