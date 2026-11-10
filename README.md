# Alebourg

Tienda Alebourg organizada con la arquitectura del molde de estudio:
frontend React/Vite separado de una API Node/Express/Prisma.

## Estructura

- `frontend/src/api`: cliente Axios y módulos de comunicación con la API.
- `frontend/src/components`: componentes reutilizables de la tienda.
- `frontend/src/hooks`: consultas React Query y hooks de aplicación.
- `frontend/src/pages`: páginas y pantallas de rutas.
- `frontend/src/App.jsx`: rutas de navegación; `frontend/src/routes`: protección de administración.
- `frontend/src/store`: estado persistente del carrito y preferencias con Zustand.
- `frontend/src/context`: sesión administrativa compartida mediante Context API.
- `backend/src/data`: utilidades de autenticación JWT.
- `backend/src/config`: configuración de Express y middleware global.
- `backend/src/controllers`: lógica de endpoints.
- `backend/src/routes`: definición de rutas HTTP.
- `backend/src/middleware`: autenticación JWT y manejo de errores async.
- `backend/src/lib`: cliente Prisma.
- `backend/prisma/schema.prisma`: SQLite para desarrollo local.
- `backend/prisma/schema.production.prisma`: PostgreSQL para producción.

El frontend conserva las dependencias de interfaz y PDF necesarias para replicar
la tienda; sobre ellas usa las librerías del molde: Axios, TanStack Query,
React Hook Form, Zod y Zustand. El backend sigue el stack del molde: Express,
Prisma, JWT y SQLite local/PostgreSQL en producción.
El catálogo y los ajustes de precios se leen de la base de datos. No hay
catálogo ni configuración predeterminada de respaldo en archivos.

## Desarrollo local

La base aislada está en `backend/prisma/dev.db`; no conecta con Supabase. Los
archivos `.env` y la base local no se versionan.

1. En una terminal, desde `backend`:

   ```powershell
   Copy-Item .env.example .env
   # Completa ADMIN_EMAIL, ADMIN_PASSWORD y JWT_SECRET_KEY en .env
   npm install
   npm run db:push
   npm run dev
   ```

   La API queda disponible en `http://localhost:8000`; salud:
   `http://localhost:8000/api/health`. `db:push` crea el esquema, no carga datos.
   Administrá los datos directamente en SQLite con `npm run db:studio`. Si no
   hay productos, la tienda muestra el catálogo vacío; si no hay configuración
   de precios, la tienda informa el error y se puede crear desde administración.
2. En otra terminal, desde `frontend`:

   ```powershell
   Copy-Item .env.example .env.local
   npm install
   npm run lint
   npm run dev
   ```

   Abrí la dirección que indique Vite, normalmente `http://localhost:5173`.
   Los cambios administrativos se guardan en la base SQLite local.

## Producción, etapa posterior

No hacer push ni desplegar esta migración hasta validar la versión local. El
despliegue futuro previsto es Netlify (`frontend/`), Vercel (`backend/`) y
Supabase PostgreSQL. Antes habrá que verificar el esquema real de Supabase,
planificar la migración de catálogo y configuración y cargar secretos nuevos
directamente en los paneles de hosting. No ejecutar `db:push:production` todavía.

Las credenciales que estuvieron en Git deben rotarse antes de publicar.
