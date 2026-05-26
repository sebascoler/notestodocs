import Link from "next/link";
import type { ReactNode } from "react";

const API_URL = process.env.NEXTAUTH_URL || "https://notestodocs.vercel.app";
const API_KEY = process.env.API_KEY || "no configurado — falta API_KEY en Vercel";
const ENDPOINT = `${API_URL}/api/process`;
const SA_EMAIL =
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "(email del service account)";

export default function SetupPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-5 py-10 pb-24 space-y-6">

        {/* Nav */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium"
        >
          &larr; Volver al canvas
        </Link>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Configurar Shortcut
          </h1>
          <p className="text-base text-gray-500">
            Conecta <strong className="text-gray-700">Freeform</strong> o{" "}
            <strong className="text-gray-700">Notas de Apple</strong> con Google Docs.
          </p>
        </div>

        {/* App choice */}
        <Card>
          <SectionTitle number="0" text="Que app usar en el iPad" />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <AppTile
              emoji="🎨"
              name="Freeform"
              tag="Recomendado"
              desc="Viene con el iPad. Excelente Apple Pencil. Comparte la pagina directamente como imagen."
            />
            <AppTile
              emoji="📝"
              name="Apple Notes"
              tag="Tambien OK"
              desc="Usa el area de dibujo dentro de una nota. Manten pulsado el dibujo para compartirlo como imagen."
            />
          </div>
        </Card>

        {/* Service account */}
        <Card>
          <SectionTitle number="1" text="Configurar Service Account (una vez)" />
          <p className="text-sm text-gray-500 mt-1 mb-3">
            Es la cuenta que crea los Google Docs. La configuras una sola vez.
          </p>
          <Steps>
            <Step n={1}>
              Ve a{" "}
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline font-medium"
              >
                console.cloud.google.com
              </a>
              {" "}&#8594; APIs &amp; Services &#8594; Credentials
            </Step>
            <Step n={2}>
              Crea un <strong>Service Account</strong> &#8594; descarga la clave JSON
            </Step>
            <Step n={3}>
              Habilita las 3 APIs:{" "}
              <Pill>Cloud Vision API</Pill>{" "}
              <Pill>Google Docs API</Pill>{" "}
              <Pill>Google Drive API</Pill>
            </Step>
            <Step n={4}>
              En Vercel &#8594; Settings &#8594; Env Vars &#8594; pega el JSON completo en{" "}
              <Pill>GOOGLE_SERVICE_ACCOUNT_KEY</Pill>
            </Step>
            <Step n={5}>
              Comparte una carpeta de Google Drive con este email (rol Editor):
              <CopyBox value={SA_EMAIL} />
            </Step>
            <Step n={6}>
              Copia el ID de la carpeta desde la URL de Drive y ponlo en{" "}
              <Pill>GOOGLE_DRIVE_FOLDER_ID</Pill> en Vercel.
              <p className="text-xs text-gray-400 mt-1">
                La URL tiene este formato:{" "}
                <span className="font-mono">drive.google.com/drive/folders/&lt;ESTE-ID&gt;</span>
              </p>
            </Step>
          </Steps>
        </Card>

        {/* API Key */}
        <Card>
          <SectionTitle number="2" text="Tu API Key para el Shortcut" />
          <p className="text-sm text-gray-500 mt-1 mb-2">
            Copia esta clave. La necesitas en el Shortcut del siguiente paso.
          </p>
          <CopyBox value={API_KEY} large />
          {API_KEY.includes("falta") && (
            <p className="text-xs text-amber-600 mt-2 bg-amber-50 rounded-lg px-3 py-2">
              Anade <strong>API_KEY</strong> en Vercel &#8594; Environment Variables con cualquier
              string aleatorio (p.ej. genera uno con{" "}
              <span className="font-mono">openssl rand -hex 20</span>) y vuelve a hacer deploy.
            </p>
          )}
        </Card>

        {/* Shortcut steps */}
        <Card>
          <SectionTitle number="3" text="Crear el Shortcut en el iPad" />
          <p className="text-sm text-gray-500 mt-1 mb-3">
            Abre la app <strong className="text-gray-700">Atajos</strong> &#8594; nuevo atajo &#8594; agrega estas acciones en orden:
          </p>
          <div className="space-y-2">
            <ActionRow
              n={1}
              title="Recibir Imagenes como entrada"
              desc='Marca "Hoja de compartir" para que aparezca en el menu Compartir.'
            />
            <ActionRow
              n={2}
              title="Codificar [Entrada Atajo] en Base64"
              desc="Accion: Codificar — Formato: Base64 — sin saltos de linea."
            />
            <ActionRow
              n={3}
              title="Obtener contenido de URL"
              desc={
                "URL: " + ENDPOINT + "\n" +
                "Metodo: POST\n" +
                "Encabezados: Authorization = Bearer " + API_KEY + "\n" +
                "Cuerpo: JSON\n" +
                '  Clave: "image"\n' +
                "  Valor: [resultado Base64 del paso 2]"
              }
            />
            <ActionRow
              n={4}
              title='Obtener "docUrl" del diccionario'
              desc='Accion: Obtener valor del diccionario — Clave: docUrl'
            />
            <ActionRow
              n={5}
              title="Abrir URL"
              desc="Usa el valor del paso 4. Abre el Google Doc directamente en Safari."
            />
          </div>
        </Card>

        {/* Usage flow */}
        <Card>
          <SectionTitle number="4" text="Como usarlo" />
          <div className="mt-3 space-y-2">
            <FlowRow icon="✏️" text="Escribe a mano en Freeform con el Apple Pencil" />
            <FlowArrow />
            <FlowRow icon="&#8679;" text='Pulsa el boton Compartir y elige el Shortcut "Notes to Docs"' />
            <FlowArrow />
            <FlowRow icon="⏳" text="Espera 2-4 segundos — el OCR esta trabajando" />
            <FlowArrow />
            <FlowRow icon="📄" text="Se abre el Google Doc con el texto transcrito" />
          </div>
          <p className="text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
            Con Apple Notes: termina la nota &#8594; manten pulsado el area de dibujo &#8594;
            Compartir como Imagen &#8594; selecciona el Shortcut.
          </p>
        </Card>

        {/* Footer note */}
        <p className="text-xs text-gray-400 text-center">
          Si algo no funciona, revisa que las 3 APIs esten habilitadas en Google Cloud y
          que el service account tenga acceso Editor a la carpeta de Drive.
        </p>

      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-1">
      {children}
    </div>
  );
}

function SectionTitle({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {number}
      </span>
      <h2 className="text-base font-semibold text-gray-900">{text}</h2>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <code className="inline-block bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded-md font-mono">
      {children}
    </code>
  );
}

function CopyBox({ value, large }: { value: string; large?: boolean }) {
  return (
    <pre
      className={
        "mt-2 bg-gray-900 text-green-400 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all select-all cursor-copy " +
        (large ? "text-sm font-semibold" : "text-xs")
      }
    >
      {value}
    </pre>
  );
}

function AppTile({ emoji, name, tag, desc }: { emoji: string; name: string; tag: string; desc: string }) {
  return (
    <div className="border border-gray-200 rounded-xl p-3 space-y-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xl leading-none">{emoji}</span>
        <span className="text-sm font-semibold text-gray-800">{name}</span>
        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
          {tag}
        </span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="space-y-3 mt-1">{children}</ol>;
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3 text-sm text-gray-700">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <div className="flex-1 leading-relaxed">{children}</div>
    </li>
  );
}

function ActionRow({ n, title, desc }: { n: number; title: string; desc?: string }) {
  return (
    <div className="flex gap-3 bg-gray-50 rounded-xl px-4 py-3">
      <span className="text-sm font-mono text-gray-400 flex-shrink-0 w-5 text-right mt-0.5">
        {n}.
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        {desc && (
          <p className="text-xs text-gray-500 mt-1 whitespace-pre-line leading-relaxed">{desc}</p>
        )}
      </div>
    </div>
  );
}

function FlowRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
      <span className="text-base w-6 text-center flex-shrink-0 leading-relaxed">{icon}</span>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="text-center text-gray-300 text-lg leading-none py-1">&#8595;</div>
  );
}
