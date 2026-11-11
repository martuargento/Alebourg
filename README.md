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

El catálogo del proveedor sigue en `productos`. Los productos manuales y las
personalizaciones administrativas se guardan como filas en `productos_admin`;
las fotos adicionales se guardan como filas en `productos_admin_imagenes`.
Así, una reimportación de `productos` no borra los cambios. La web y la app
móvil permiten editar título, categoría, costo, precio final y galería. El
orden y las listas destacadas también tienen columnas editables en Supabase:
`orden_personalizado`, `mas_vendido`, `orden_mas_vendidos`, `en_oferta` y
`orden_ofertas`. La preferencia que activa el orden manual se guarda como
configuración global en `app_settings`. Arrastrar productos guarda cada cambio
en Supabase automáticamente; apagar la opción solo desactiva el reordenamiento
y no restaura el orden anterior.

En cada actualización del proveedor, reemplazá únicamente las filas de
`productos` usando como `id` el código estable del proveedor. En el archivo del
scraping, `id: 10734` debe corresponder a `Cod.: 10734` y al código de la URL de
la foto, por ejemplo `/fotos/10734.jpg`; conservá ese mismo valor al convertir
el JSON a CSV e importarlo. No borres la base completa ni las tablas
`productos_admin`, `productos_admin_imagenes` o `app_settings`. Las ediciones y
los productos manuales se administran desde `productos_admin`; la tienda los
combina con el catálogo importado.

Eliminar un producto desde la web o la app borra sus filas actuales de
`productos` y `productos_admin`, junto con las filas de su galería. Una
importación futura puede volver a insertarlo si el proveedor lo publica otra
vez. Las imágenes originales del proveedor pueden seguir usando su URL externa;
Storage se usa para fotos propias o adicionales. No reemplaces ni borres
`productos_admin` al importar el catálogo.

Antes de desplegar esta versión del backend, ejecutá una sola vez
`backend/prisma/migrate-productos-admin.sql` desde el SQL Editor de Supabase.
La migración crea las tablas nuevas y copia de forma no destructiva las
personalizaciones JSON actuales y los registros de `productos_agregados_a_mano`;
no borra las tablas ni claves de origen.

Para habilitar cargas de imágenes, creá un bucket público de Supabase Storage y
configurá `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y, opcionalmente,
`SUPABASE_STORAGE_BUCKET` en el entorno privado del backend. La clave service
role no debe llegar al frontend ni a la app. Cada foto acepta JPG, PNG o WebP,
hasta 4 MB para respetar el límite de carga del backend desplegado en Vercel.
Consultá `mobile/README.md` para los pasos y variables.
