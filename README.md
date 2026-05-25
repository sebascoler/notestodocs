# notestodocs

Escribe a mano en el iPad con el Apple Pencil → OCR automático → Google Doc guardado al instante.

**Stack:** Next.js 14 · TypeScript · perfect-freehand · Google Cloud Vision API · Google Docs API · NextAuth · Vercel

---

## Cómo funciona

1. Abres la PWA en el iPad (instalable desde Safari → "Añadir a pantalla de inicio")
2. Entras con tu cuenta de Google
3. Escribes con el Apple Pencil en el canvas
4. Pulsas **"Guardar en Google Docs →"**
5. El canvas se envía al backend, pasa por OCR y se crea un Google Doc con el texto reconocido
6. Recibes el link directo al documento

---

## Setup

### 1. Google Cloud Project

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo (o usa uno existente)
3. Habilita estas dos APIs:
   - **Cloud Vision API**
   - **Google Docs API**
4. Ve a **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (desarrollo)
     - `https://tu-dominio.vercel.app/api/auth/callback/google` (producción)
5. Copia el **Client ID** y **Client Secret**

> ⚠️ Necesitas tener **billing habilitado** en el proyecto para usar Cloud Vision API (el tier gratuito cubre 1.000 imágenes/mes).

### 2. Variables de entorno locales

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:
```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
NEXTAUTH_SECRET=genera-con: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

### 3. Ejecutar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y entra con Google.

---

## Deploy en Vercel

```bash
# Si no tienes la CLI:
npm i -g vercel

vercel
```

O conecta el repo directamente desde [vercel.com](https://vercel.com).

**Variables de entorno en Vercel** (Settings → Environment Variables):

| Variable | Valor |
|----------|-------|
| `GOOGLE_CLIENT_ID` | tu client id |
| `GOOGLE_CLIENT_SECRET` | tu client secret |
| `NEXTAUTH_SECRET` | string aleatorio (32+ chars) |
| `NEXTAUTH_URL` | `https://tu-app.vercel.app` |

Después de hacer deploy, vuelve a Google Cloud Console y añade la URL de producción a los **Authorized redirect URIs** del OAuth client.

---

## Estructura del proyecto

```
notestodocs/
├── app/
│   ├── page.tsx                    # UI principal: login + canvas
│   ├── layout.tsx                  # Layout con PWA manifest
│   ├── providers.tsx               # SessionProvider de NextAuth
│   └── api/
│       ├── process/route.ts        # POST: recibe imagen → OCR → Google Doc
│       └── auth/[...nextauth]/     # Handler de NextAuth
├── components/
│   └── DrawingCanvas.tsx           # Canvas con soporte Apple Pencil
├── lib/
│   ├── auth.ts                     # Config de NextAuth + scopes Google
│   ├── google-vision.ts            # Cliente Google Cloud Vision API
│   └── google-docs.ts             # Cliente Google Docs API
├── types/
│   └── next-auth.d.ts              # Tipos TypeScript para la session
└── public/
    └── manifest.json               # PWA manifest (instalable en iPad)
```

---

## Notas técnicas

- **Palm rejection**: el canvas solo responde a `pointerType === 'pen'`, ignorando el dedo
- **Presión real**: `perfect-freehand` usa la presión del Apple Pencil para variar el grosor del trazo
- **OCR**: usa `DOCUMENT_TEXT_DETECTION` de Google Vision, optimizado para texto denso y manuscrito
- **Auth**: un solo OAuth2 login da acceso tanto a Vision API como a Docs API con los scopes correctos
