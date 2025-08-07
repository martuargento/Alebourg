# Solución para el problema de carga de productos

## Problema identificado
- Error 429 (Too Many Requests) de GitHub al acceder a `raw.githubusercontent.com`
- Múltiples llamadas directas a GitHub desde el frontend
- Sin sistema de caché

## Solución implementada

### 1. Backend en Railway
El proyecto ya tiene un backend configurado en Railway que sirve los productos desde endpoints locales en lugar de GitHub.

### 2. Nuevos endpoints agregados
- `GET /api/productos` - Obtiene todos los productos
- `GET /api/productos/:id` - Obtiene un producto específico
- `GET /api/categorias` - Obtiene las categorías

### 3. Servicio de API centralizado
Se creó `src/services/apiService.js` que:
- Usa el backend de Railway como fuente principal
- Tiene sistema de caché (5 minutos)
- Incluye fallback al archivo local si falla el backend

### 4. Componentes actualizados
- `ProductosLista.jsx` - Usa el nuevo servicio
- `DetalleProducto.jsx` - Usa el nuevo servicio
- `Header.jsx` - Usa el nuevo servicio
- `ProductosPorCategoria.jsx` - Usa el nuevo servicio

## Pasos para desplegar

### 1. Desplegar el backend en Railway
```bash
# Asegúrate de que el archivo JSON esté en el directorio raíz
cp public/productosalebourgactulizados.json .

# El backend ya está configurado para Railway
# Solo necesitas hacer push a tu repositorio
```

### 2. Verificar que el backend esté funcionando
- URL del backend: `https://alebourg-production.up.railway.app`
- Endpoints disponibles:
  - `GET /api/productos`
  - `GET /api/productos/:id`
  - `GET /api/categorias`
  - `GET /api/descuentos`
  - `POST /api/descuentos`

### 3. Desplegar el frontend en Netlify
El frontend ahora usará el backend de Railway en lugar de GitHub directamente.

## Beneficios de la solución
1. **Sin límites de rate limiting** - No más errores 429
2. **Mejor rendimiento** - Sistema de caché implementado
3. **Mayor confiabilidad** - Fallback a archivo local
4. **Centralización** - Un solo punto de acceso a los datos
5. **Escalabilidad** - Fácil agregar más funcionalidades al backend

## Verificación
Después del despliegue, verifica que:
1. Los productos se cargan correctamente
2. No hay errores 429 en la consola
3. Las categorías se muestran correctamente
4. Los detalles de producto funcionan
