# KUNTUR SPORT

Mas que una camiseta, una experiencia.

KUNTUR SPORT es un MVP web para camisetas deportivas con tecnologia NFC. Cada camiseta contiene una URL HTTPS unica que permite validar autenticidad, activar la prenda para un hincha y abrir experiencias digitales de equipos, competiciones o eventos especiales.

## Arquitectura

- Next.js App Router con TypeScript.
- Monolito modular desplegable en Vercel.
- Supabase para PostgreSQL, Auth y Storage.
- Server Components por defecto.
- Client Components solo para formularios e interacciones.
- Route Handlers para APIs internas.
- Proveedor deportivo desacoplado mediante `FootballProvider`.
- Sin Supabase Realtime, Redis, microservicios, app movil ni realidad aumentada en esta version.

## Requisitos

- Node.js 20.9 o superior.
- npm.
- Proyecto Supabase.
- Proyecto Vercel para despliegue.

## Instalacion

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Variables de entorno

Ver [.env.example](.env.example). Las claves privadas como `SUPABASE_SERVICE_ROLE_KEY` solo deben existir en el servidor y nunca usarse en Client Components.

## Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta las migraciones SQL de `supabase/migrations`.
3. Configura las variables de entorno.
4. Crea buckets de Storage para imagenes cuando se implemente la gestion de contenidos.

## Automatizacion Deportiva

- En `/admin/partidos`, el boton **Sincronizar todos los equipos** usa TheSportsDB para traer proximos partidos, ultimos resultados, detalles, highlights y rivales.
- La sincronizacion crea contenido automatico de previa y highlights post-partido cuando la API entrega videos.
- Los pronosticos de marcador se cargan en `/partidos/[id]`; al sincronizar un partido terminado se asignan puntos automaticamente.
- Las paginas de equipos muestran tabla de posiciones, plantilla y camisetas historicas si TheSportsDB tiene esos datos.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Estado

Fase 1 en construccion: configuracion base, diseno inicial, Supabase, autenticacion, migraciones y RLS.
