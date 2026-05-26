import Link from "next/link";
import type { ReactNode } from "react";

const API_URL = process.env.NEXTAUTH_URL || "https://notestodocs.vercel.app";
const API_KEY = process.env.API_KEY || "(no configurado - anade API_KEY en Vercel)";
const ENDPOINT = `${API_URL}/api/process`;
const SERVICE_ACCOUNT_EMAIL =
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "(email del service account)";

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            &larr; Volver al canvas
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Configurar iOS Shortcut</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Conecta <strong>Freeform</strong> o <strong>Notas de Apple</strong> con Google Docs en 5 minutos.
          </p>
        </div>

        {/* Step 0 */}
        <Section number="0" title="Que app usar en el iPad?">
          <div className="grid grid-cols-2 gap-3 mt-3">
            <AppCard
              emoji="🎨"
              name="Freeform"
              badge="Recomendado"
              desc="Ya viene en el iPad (iOS 16+). Apple Pencil excelente. Boton de compartir como imagen integrado."
            />
            <AppCard
              emoji="📝"
              name="Apple Notes"
              badge="Tambien funciona"
              desc="Usa la seccion de dibujo dentro de una nota. Luego compartir la imagen y ejecutar el Shortcut."
            />
          </div>
        </Section>

        {/* Step 1 */}
        <Section number="1" title="Configurar el Service Account (una vez)">
          <p className="text-sm text-gray-600 mt-1">
            El service account crea los Google Docs. Necesitas compartir una carpeta de tu Drive con el.
          </p>
          <ol className="mt-3 space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>
              Ve a{" "}
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                console.cloud.google.com
              </a>
              {" "}&#8594; APIs &amp; Services &#8594; Credentials
            </li>
            <li>Crea un <strong>Service Account</strong> &#8594; descarga la clave JSON</li>
            <li>Habilita <strong>Cloud Vision API</strong>, <strong>Google Docs API</strong> y <strong>Google Drive API</strong></li>
            <li>
              En Vercel, anade <code className="bg-gray-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_KEY</code>{" "}
              pegando todo el contenido del JSON
            </li>
            <li>
              Email del service account (compartelo con tu carpeta de Drive):
              <CodeBlock>{SERVICE_ACCOUNT_EMAIL}</CodeBlock>
            </li>
            <li>
              En Google Drive, crea una carpeta &quot;Notas iPad&quot; &#8594; compartir con ese email &#8594; rol <strong>Editor</strong>
            </li>
            <li>
              Copia el ID de la carpeta desde la URL{" "}
              <code className="bg-gray-100 px-1 rounded">drive.google.com/drive/folders/ESTE-ID</code>{" "}
              y ponlo en <code className="bg-gray-100 px-1 rounded">GOOGLE_DRIVE_FOLDER_ID</code> en Vercel
            </li>
          </ol>
        </Section>

        {/* Step 2 */}
        <Section number="2" title="Tu API Key para el Shortcut">
          <p className="text-sm text-gray-600 mt-1">
            Esta clave identifica las llamadas desde el iPad. Copia este valor para el siguiente paso.
          </p>
          <CodeBlock selectable>{API_KEY}</CodeBlock>
          <p className="text-xs text-gray-400 mt-1">
            Si aparece &quot;no configurado&quot;: Vercel &#8594; Settings &#8594; Environment Variables &#8594;
            anade <code>API_KEY</code> con cualquier string aleatorio &#8594; redeploy.
          </p>
        </Section>

        {/* Step 3 */}
        <Section number="3" title="Crear el iOS Shortcut">
          <p className="text-sm text-gray-600 mt-1 mb-3">
            Abre la app <strong>Atajos</strong> en el iPad y crea un nuevo Shortcut con estas acciones en orden:
          </p>
          <div className="space-y-2">
            <ShortcutAction
              step={1}
              label="Recibir: Imagenes y PDFs como entrada"
              note='Habilitar "Hoja de compartir" para que aparezca al compartir desde Freeform'
            />
            <ShortcutAction
              step={2}
              label="Si no hay entrada, Detener y responder"
              note="Manejo de error basico: accion Si + Detener"
            />
            <ShortcutAction
              step={3}
              label="Codificar [Entrada Atajo] en Base64"
              note="Accion Codificar, formato Base64, sin saltos de linea"
            />
            <ShortcutAction
              step={4}
              label="Obtener contenido de URL"
              note={
                "URL: " + ENDPOINT + "\n" +
                "Metodo: POST\n" +
                "Cabeceras: Authorization = Bearer " + API_KEY + "\n" +
                'Cuerpo: JSON > clave "image" = [resultado Base64 del paso 3]'
              }
            />
            <ShortcutAction
              step={5}
              label="Obtener valor del diccionario"
              note='Clave: "docUrl" del resultado del paso anterior'
            />
            <ShortcutAction
              step={6}
              label="Abrir URL"
              note="Pasa el docUrl del paso 5. Abrira el Google Doc en Safari."
            />
          </div>
        </Section>

        {/* Step 4 */}
        <Section number="4" title="Flujo de uso">
          <div className="mt-2 space-y-3">
            <FlowStep icon="✏️" text="Escribe a mano en Freeform con el Apple Pencil" />
            <FlowArrow />
            <FlowStep icon="&#8593;" text='Pulsa Compartir y selecciona el Shortcut "Notes to Docs"' />
            <FlowArrow />
            <FlowStep icon="⏳" text="Espera ~3 segundos mientras se procesa el OCR..." />
            <FlowArrow />
            <FlowStep icon="📄" text="Se abre el Google Doc con el texto reconocido" />
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Con Apple Notes: termina de escribir &#8594; toca el dibujo &#8594; Compartir como Imagen &#8594; selecciona el Shortcut.
          </p>
        </Section>

        <div className="text-center text-xs text-gray-400 pb-6">
          Problemas? Revisa que las APIs esten habilitadas y que el service account tenga acceso a la carpeta de Drive.
        </div>

      </div>
    </div>
  );
}

// ---- Sub-components ----

function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {number}
        </span>
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function CodeBlock({ children, selectable }: { children: ReactNode; selectable?: boolean }) {
  return (
    <pre
      className={
        "mt-2 bg-gray-900 text-green-400 text-sm rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all" +
        (selectable ? " select-all cursor-copy" : "")
      }
    >
      {children}
    </pre>
  );
}

function AppCard({ emoji, name, badge, desc }: { emoji: string; name: string; badge: string; desc: string }) {
  return (
    <div className="border border-gray-200 rounded-xl p-3">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xl">{emoji}</span>
        <span className="font-medium text-sm">{name}</span>
        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{badge}</span>
      </div>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  );
}

function ShortcutAction({ step, label, note }: { step: number; label: string; note?: string }) {
  return (
    <div className="flex gap-3 bg-gray-50 rounded-xl p-3">
      <span className="text-xs font-mono text-gray-400 mt-0.5 w-4 flex-shrink-0">{step}.</span>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {note && <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{note}</p>}
      </div>
    </div>
  );
}

function FlowStep({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
      <span className="text-lg w-8 text-center flex-shrink-0">{icon}</span>
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  );
}

function FlowArrow() {
  return <div className="text-center text-gray-300 text-lg">&#8595;</div>;
}
