# Alebourg Mobile

Aplicación nativa de Alebourg con Expo y React Native. Mantiene la estructura y
los patrones de `Molde/mobile`: navegación inferior y stack, Context API,
AsyncStorage, cliente Axios y nombres en español.

El catálogo y los precios se consultan en la API de Alebourg. El carrito se
guarda en el dispositivo y los pedidos se preparan en WhatsApp, igual que en la
tienda web. Alebourg no tiene cuentas de clientes ni un endpoint para registrar
pedidos; la app no simula esas funciones.

La tienda permite ordenar por precio final (menor, mayor o el orden original
del catálogo) y elegir una o dos columnas. Estas preferencias se guardan en el
dispositivo; no se sincronizan entre teléfonos ni con una cuenta.
Al desplazarse por el catálogo aparece un botón discreto para volver arriba;
también se puede tocar nuevamente la pestaña Tienda. Ambos atajos llevan el
buscador al borde superior sin modificar ni ocultar el encabezado de bienvenida.

La interfaz mantiene la paleta clara de Alebourg. En **Cuenta**, el acceso de
administrador se realiza dentro de la app contra la API; el token se guarda en
el almacenamiento seguro del dispositivo. Una vez autenticado, se puede activar
**Mostrar precios admin** para ver precio de proveedor y ganancia como en la web,
y entrar a **Cambiar rangos de precios** para editar y guardar los ajustes,
incluyendo la regla especial por prefijo y el mínimo de auriculares.
La administración también permite editar productos y precios, gestionar fotos,
productos manuales y las listas de más vendidos/ofertas. Los productos
administrados se guardan como filas en `productos_admin` (y sus fotos como
filas en `productos_admin_imagenes`) para que sean editables en Supabase y no
se pierdan al reimportar el catálogo. Los precios aceptan el formato del
proveedor, por ejemplo `4,053`. En **Tienda**, al activar **Orden
personalizado**, se puede mover con las flechas y cada cambio se guarda
automáticamente. Desactivar la opción solo bloquea el reordenamiento; conserva
el orden guardado.
Al eliminar un producto desde la app se borran sus filas actuales; si aparece
en un scraping futuro, se puede importar nuevamente.

## Requisitos

- Node.js y npm.
- Expo Go en un teléfono Android/iOS, o un emulador Android configurado.
- La API desplegada en Vercel o el backend local.

## Conectar con la API

Copiá `.env.example` como `.env` en esta carpeta. Para producción, dejá:

```env
EXPO_PUBLIC_API_URL=https://alebourg-mu.vercel.app
```

Para desarrollo local, reemplazá la URL según dónde se ejecute la app:

| Dispositivo | URL |
| --- | --- |
| Emulador Android | `http://10.0.2.2:8000` |
| Simulador iOS | `http://localhost:8000` |
| Teléfono físico | `http://IP_LOCAL_DE_TU_PC:8000` |

La URL es la raíz del backend; la app agrega `/api`. No uses `localhost` en un
teléfono físico. Si cambiás `.env`, reiniciá Expo con `npx expo start --clear`.

## Administración de fotos

Las imágenes se cargan desde la app o la web a un bucket público de Supabase
Storage. Creá el bucket `productos` (o definí otro nombre en
`SUPABASE_STORAGE_BUCKET`) y configurá en el entorno privado del backend:

```env
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<clave privada del proyecto>
SUPABASE_STORAGE_BUCKET=productos
```

La clave `SUPABASE_SERVICE_ROLE_KEY` solo debe existir en el proveedor del
backend (por ejemplo, Vercel); nunca se agrega a Expo, Netlify, archivos `.env`
del frontend ni al repositorio. La API solo acepta JPG, PNG y WebP de hasta
4 MB por imagen y exige sesión de administrador. El límite permite que la
carga pase por la función de Vercel sin exceder su tamaño máximo de solicitud.

Antes de desplegar una versión del backend que use las tablas administrativas,
ejecutá una sola vez `backend/prisma/migrate-productos-admin.sql` en el SQL
Editor de Supabase. El script migra los datos actuales sin borrar las fuentes.

## Ejecutar

Desde esta carpeta:

```powershell
npm install
npm start
```

Escaneá el QR con Expo Go. Para iniciar un emulador Android:

```powershell
npm run android
```

Para una compilación de producción, mantené la URL HTTPS de Vercel en
`EXPO_PUBLIC_API_URL` y generá una nueva build; la dirección queda incorporada
en la aplicación.

## Generar una APK instalable

En Windows, para compilar localmente y copiar la APK a Descargas como
`alebourg.apk`, abrí PowerShell en esta carpeta y ejecutá:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\generar-apk.ps1
```

El script detecta el Android SDK, usa una unidad temporal para evitar el límite
de rutas largas de Windows y quita esa unidad al terminar.

El perfil `preview` de `eas.json` genera una APK de distribución interna.
Desde esta carpeta, iniciá sesión con tu cuenta de Expo y ejecutá:

```powershell
npx eas-cli login
npx eas-cli whoami
npx eas-cli build --platform android --profile preview
```

En la primera ejecución, EAS puede pedir vincular o crear el proyecto Expo y
configurar la firma de Android. Si querés instalar la APK como actualización
sobre otra Alebourg ya instalada, elegí la misma cuenta/proyecto y conservá el
mismo keystore de Android de la APK anterior; una firma distinta no puede
actualizar esa instalación. Al terminar, EAS muestra el enlace para descargar
la APK. Incrementá `versionCode` para cada nueva build; esta versión es
`1.0.5` (`versionCode` 6).
