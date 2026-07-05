# Linko Agent — plataforma de agentes de IA

Proyecto único (landing comercial + aplicación) pensado para vivir en `https://linkoagent.com`.
Web app SaaS multiempresa: cada empresa inicia sesión, conecta WhatsApp, crea y entrena agentes
de IA, ve el inbox de conversaciones, y consulta métricas y uso del plan. Ver el plan completo en
`C:\Users\Pepper2020\.claude\plans\sorted-soaring-snowflake.md`.

## Rutas

| Ruta | Contenido |
|---|---|
| `/` | Landing comercial (o redirige a `/dashboard` si ya hay sesión iniciada) |
| `/login`, `/signup` | Autenticación |
| `/dashboard`, `/inbox`, `/agents`, `/knowledge`, `/channels`, `/customers`, `/metrics`, `/usage`, `/settings` | Producto (requiere sesión) |
| `/admin` | Panel Super Admin |

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind · Prisma + PostgreSQL (pgvector) · NextAuth
(Credentials + JWT) · OpenAI (con modo mock) · WhatsApp Cloud API (con modo mock) · Recharts.

## Correr en local

Requisitos: Node 18+, Docker Desktop.

```bash
npm install
cp .env.example .env          # generar NEXTAUTH_SECRET: openssl rand -base64 32
docker compose up -d          # levanta Postgres con pgvector en localhost:5432
npx prisma migrate dev        # crea las tablas
npm run db:seed               # carga planes + empresa demo + usuarios de prueba
npm run dev
```

Abrir `http://localhost:3000` (o el puerto que indique la consola si el 3000 está ocupado).

### Usuarios de prueba (contraseña: `linko1234`)

| Rol | Email |
|---|---|
| Super Admin | `superadmin@linko.ai` |
| Admin de empresa (Café Aurora) | `admin@cafeaurora.com` |
| Agente humano (Café Aurora) | `equipo@cafeaurora.com` |

### Probar el flujo completo sin cuenta de Meta ni de OpenAI

1. Iniciar sesión como `admin@cafeaurora.com`.
2. Ir a **Canales** → ya hay un WhatsApp "conectado" en modo simulado (creado por el seed).
3. Usar el formulario **Simular mensaje entrante** con una pregunta (ej. "¿tienen wifi?").
4. Ver la conversación aparecer en **Inbox** con la respuesta generada por el agente demo
   ("Sofía"), usando la base de conocimiento FAQ cargada.
5. Ver **Dashboard** y **Métricas** reflejar la conversación.

También se puede probar un agente antes de activarlo desde **Agentes → Probar agente**, sin que
cuente como uso del plan.

## Modo mock (IA y WhatsApp)

Mientras `OPENAI_API_KEY` esté vacía o `AI_MOCK_MODE=true`, las respuestas de IA son simuladas
(usan la base de conocimiento cargada, pero sin llamar a OpenAI) y los embeddings son
determinísticos — sirven para probar el pipeline, no para relevancia semántica real. Ídem con
WhatsApp: mientras el canal no tenga `accessToken` real o `WHATSAPP_MOCK_MODE=true`, los envíos
quedan simulados (se guardan igual, no llaman a la Graph API de Meta).

Para pasar a modo real:

- **OpenAI**: cargar `OPENAI_API_KEY` en `.env` (y opcionalmente `OPENAI_MODEL`).
- **WhatsApp**: en Meta for Developers, crear una app con el producto *WhatsApp Business
  Platform*, obtener `phoneNumberId`, `wabaId` y un `accessToken`, cargarlos en **Canales**, y
  configurar el webhook de la app apuntando a `https://tu-dominio/api/webhooks/whatsapp` con el
  verify token definido en `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

## Variables de entorno

Ver `.env.example`. Resumen:

- `NEXT_PUBLIC_APP_URL` — dominio público (usado en metadata/OG, robots.txt y sitemap.xml).
- `DATABASE_URL` — conexión a Postgres (la de `docker-compose.yml` sirve para local).
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET` — requeridas por NextAuth.
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`, `AI_MOCK_MODE`.
- `WHATSAPP_MOCK_MODE`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_GRAPH_API_VERSION`.
- `RESEND_API_KEY`, `EMAIL_FROM` — todavía sin usar en el código (ver "Dominio y producción").

## Dominio y producción (linkoagent.com)

El dominio `linkoagent.com` y el correo `hola@linkoagent.com` ya están comprados/configurados
por el usuario. Para pasar de local a producción:

1. **Variables de entorno** en el hosting: `NEXT_PUBLIC_APP_URL="https://linkoagent.com"`,
   `NEXTAUTH_URL="https://linkoagent.com"`, y un `NEXTAUTH_SECRET` **nuevo** (no reusar el de
   local — generar con `openssl rand -base64 32`).
2. **Base de datos**: cualquier Postgres con extensión `pgvector` (Railway, Render o Neon la
   soportan) — correr `npx prisma migrate deploy` contra esa base antes del primer deploy.
3. **Email (Resend)**: crear cuenta en Resend, verificar el dominio `linkoagent.com` (registros
   DNS que da Resend), generar un `RESEND_API_KEY` y cargarlo. Hasta que esto exista, el
   formulario de contacto sigue guardando los leads en la tabla `ContactRequest` sin notificar
   por email — no se pierde nada, solo falta el aviso automático (próxima etapa).
4. **WhatsApp real**: cuenta de Meta for Developers con el producto *WhatsApp Business
   Platform*, apuntando el webhook a `https://linkoagent.com/api/webhooks/whatsapp`.
5. **OpenAI real**: cargar `OPENAI_API_KEY` cuando se quiera dejar de usar el modo simulado.
6. **DNS**: apuntar `linkoagent.com` al hosting elegido (p. ej. Vercel: registros A/CNAME que
   indica el propio panel de Vercel al agregar el dominio al proyecto).

Nada de esto lo puede hacer el asistente por su cuenta — son cuentas y accesos que solo tiene el
usuario. El código ya está preparado para leer estas variables apenas existan.

## Roles y permisos

- **Super Admin**: panel `/admin` (todas las empresas, activar/pausar, cambiar plan).
- **Admin de empresa**: todo el producto de su empresa (agentes, conocimiento, canales, métricas,
  uso, configuración, equipo).
- **Agente humano**: `/dashboard`, `/inbox` y `/customers` únicamente — responder, tomar y cerrar
  conversaciones. El resto de las secciones redirige a `/dashboard` (verificado con las 3 cuentas
  de prueba).

## Qué falta a propósito (siguiente etapa)

Instagram y Messenger, carga de PDF a la base de conocimiento, CRM de leads con kanban de etapas,
motor de automatizaciones con reglas, múltiples proveedores de IA, voz, e integraciones externas
(Tiendanube, Calendly, etc.) — los modelos de datos ya existen en el schema, falta la UI/flujo.

## Deploy sugerido

Vercel para la app (Next.js) + Railway/Render/Neon para Postgres con pgvector — cualquiera de los
tres soporta la extensión. Configurar las mismas variables de entorno que en local, con
`NEXTAUTH_URL` apuntando al dominio de producción.
