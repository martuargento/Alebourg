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

## Aplicación móvil

La app Expo/React Native está en `mobile/` y reutiliza el catálogo, las
categorías y los precios de la API. El carrito se guarda en el dispositivo y
los pedidos se coordinan por WhatsApp; no hay cuentas de clientes ni pedidos
persistidos en el backend. La sesión de administrador permite mostrar precio
de proveedor y ganancia, y editar los rangos de precios desde la app. Consultá
`mobile/README.md` para configurar la URL del backend y ejecutar la app en un
dispositivo o emulador.

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

## Producción

La tienda web y su API están desplegadas en Netlify (`frontend/`) y Vercel
(`backend/`), con PostgreSQL en Supabase. La app móvil usa la misma API pública;
no contiene credenciales de Supabase. No ejecutar `db:push:production`: la base
de producción se administra por separado y su esquema ya fue alineado con Prisma.

No subir credenciales al repositorio; configurarlas como variables en los
proveedores de hosting.

### Administración de productos

Los cambios administrativos, productos manuales y el orden de la tienda se
guardan en `app_settings`, separado del catálogo `productos`, para que una
reimportación del catálogo no borre esas personalizaciones. La web y la app
móvil permiten editar título, categoría, costo del proveedor, precio final y
galería; las listas de Más vendidos y Ofertas se ordenan independientemente.
En la tienda web se arrastran los productos para ordenarlos; en la app móvil se
usan las flechas de posición.

Para habilitar cargas de imágenes, creá un bucket público de Supabase Storage y
configurá `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y, opcionalmente,
`SUPABASE_STORAGE_BUCKET` en el entorno privado del backend. La clave service
role no debe llegar al frontend ni a la app. Cada foto acepta JPG, PNG o WebP,
hasta 4 MB para respetar el límite de carga del backend desplegado en Vercel.
Consultá `mobile/README.md` para los pasos y variables.
