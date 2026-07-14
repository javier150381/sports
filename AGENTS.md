# Contexto Permanente

KUNTUR SPORT es una plataforma web de camisetas deportivas con NFC para equipos de Ecuador, competiciones y eventos especiales.

## Convenciones

- Node.js, TypeScript, Next.js App Router y Tailwind CSS.
- Monolito modular, sin microservicios.
- Server Components por defecto.
- Client Components solo para formularios, encuestas, pronosticos y actualizacion periodica.
- Interfaz en espanol.

## Seguridad

- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al navegador.
- Validar inputs con Zod.
- Autorizar en servidor y RLS.
- No guardar geolocalizacion precisa ni datos innecesarios en escaneos NFC.
- No alojar ni retransmitir partidos.

## Supabase

- PostgreSQL, Auth y Storage.
- RLS habilitado en tablas expuestas.
- El rol del usuario se guarda en `profiles.role`.
- Activaciones NFC deben ser atomicas y server-only.

## Cache

- No llamar la API deportiva desde el navegador.
- Compartir cache de marcador entre visitantes.
- No insertar en PostgreSQL cada actualizacion del marcador.

## Definicion De Terminado

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- Rutas protegidas por rol.
- Documentacion actualizada.
