# Arquitectura KUNTUR SPORT

## Modulos

- `src/app`: rutas publicas, cuenta, admin y Route Handlers.
- `src/features`: componentes por dominio.
- `src/server`: logica server-only, autenticacion, autorizacion, Supabase y respuestas API.
- `src/lib`: utilidades compartidas sin secretos.
- `supabase/migrations`: esquema PostgreSQL, indices, triggers y RLS.

## Flujo NFC

1. El chip NFC abre `/nfc/[code]`.
2. La pagina llama a `GET /api/nfc/[code]`.
3. El servidor valida el codigo y registra escaneo sin datos personales innecesarios.
4. Si esta disponible, el usuario autenticado puede activar con `POST /api/nfc/activate`.
5. La activacion se ejecuta en servidor con operacion atomica.

## Flujo Del Marcador En Vivo

Navegador -> Route Handler de Next.js -> servicio interno -> `FootballProvider` -> API externa.

La respuesta se comparte mediante cache del servidor. Si el proveedor falla, se devuelve el ultimo dato valido con marca de desactualizacion.

## Permisos

Los roles viven en `profiles.role`:

- `VISITOR`: lectura publica.
- `FAN`: perfil propio, camisetas activadas, pronosticos y votos.
- `EDITOR`: gestion de contenido.
- `ADMIN`: acceso completo.

La UI puede ocultar controles, pero la autorizacion real vive en RLS, Server Components, Server Actions y Route Handlers.

## Cache Y Costos

- Server Components por defecto.
- ISR/revalidacion para paginas publicas cuando se conecten datos.
- Sin Realtime ni Redis.
- Videos como enlaces externos.
- Consultas paginadas y columnas explicitas.
- Indices en slugs, fechas, codigos NFC y relaciones frecuentes.

