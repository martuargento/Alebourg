# 🚀 Migración de Neon a Supabase

Este documento describe el proceso para migrar tu proyecto de Neon a Supabase, manteniendo la arquitectura: **Supabase → Vercel → Netlify**.

## 📋 Prerrequisitos

- ✅ Proyecto configurado con Supabase
- ✅ Credenciales de Supabase (anon key y service role)
- ✅ Node.js y npm instalados
- ✅ Acceso al dashboard de Supabase

## 🔑 Credenciales de Supabase

**URL:** `https://ihlhkpmzqhbedixiwdrb.supabase.co`

**Anon Public Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGhrcG16cWhiZWRpeGl3ZHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDI5OTMsImV4cCI6MjA3MTExODk5M30.kxcgi7ws-m_M7GzAiwSVyGUPRTZqpdjMnJYJ-2xLcfA
```

**Service Role Secret:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGhrcG16cWhiZWRpeGl3ZHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0Mjk5MywiZXhwIjoyMDcxMTE4OTkzfQ.Blixh0ykJ9F7lNxgle6dFzNzzx3OF_f3mfg5paOTsx8
```

## 🗄️ Estructura de la Base de Datos

### Tabla `productos` (Estructura Simple)

```sql
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  titulo TEXT,
  imagen TEXT,
  precio TEXT,
  categoria TEXT
);
```

**Nota:** Esta es una estructura simplificada que solo incluye los campos esenciales. Los campos como `descripcion`, `stock`, `destacado`, `created_at`, y `updated_at` no se incluyen para mantener la simplicidad.

## 📁 Archivos de Migración

### 1. `api/crear-tabla-supabase.js`
- Verifica si la tabla existe
- Proporciona instrucciones para crear la tabla manualmente
- Inserta productos de ejemplo para pruebas

### 2. `api/migrar-json-a-supabase.js`
- Lee productos desde `src/assets/productosalebourgactulizados.json`
- Migra solo los campos esenciales: id, titulo, imagen, precio, categoria
- Migra los datos a Supabase en lotes
- Maneja errores y proporciona feedback

### 3. `api/migrar-neon-a-supabase.js`
- Migra directamente desde Neon (requiere configuración de Neon)
- Útil si quieres migrar desde la base de datos Neon existente

### 4. `migrar-a-supabase.ps1`
- Script de PowerShell que automatiza todo el proceso
- Verifica dependencias y ejecuta los pasos en orden

## 🚀 Proceso de Migración

### Opción 1: Script Automatizado (Recomendado)

```powershell
# Ejecutar desde la raíz del proyecto
.\migrar-a-supabase.ps1
```

### Opción 2: Pasos Manuales

#### Paso 1: Crear Tabla en Supabase

1. Ve al [Dashboard de Supabase](https://ihlhkpmzqhbedixiwdrb.supabase.co)
2. Inicia sesión
3. Ve a **SQL Editor** (en el menú izquierdo)
4. Ejecuta este SQL simple:

```sql
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  titulo TEXT,
  imagen TEXT,
  precio TEXT,
  categoria TEXT
);
```

#### Paso 2: Verificar Conexión

```bash
cd api
node crear-tabla-supabase.js
```

#### Paso 3: Migrar Productos

```bash
node migrar-json-a-supabase.js
```

#### Paso 4: Verificar Migración

```bash
node test-supabase.js
```

## 🔧 Configuración del Proyecto

### Variables de Entorno

Crea un archivo `.env` en el directorio `api/` con:

```env
SUPABASE_URL=https://ihlhkpmzqhbedixiwdrb.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_KEY=tu_service_key_aqui
BACKEND_URL=https://alebourg-tau.vercel.app
```

### Actualización de Configuración

Los archivos ya están configurados para usar Supabase:

- ✅ `api/_supabaseClient.js` - Cliente de Supabase
- ✅ `api/productos/index.js` - API de productos usando Supabase
- ✅ `src/services/apiService.js` - Servicio de API del frontend

## 📊 Verificación de la Migración

### 1. Dashboard de Supabase
- Ve a **Table Editor** → **productos**
- Verifica que los productos estén presentes
- Revisa la estructura de la tabla (solo 5 campos)

### 2. API de Productos
- Visita: `https://alebourg-tau.vercel.app/api/productos`
- Deberías ver los productos en formato JSON
- Los productos solo tendrán: id, titulo, imagen, precio, categoria

### 3. Frontend
- Ejecuta tu aplicación localmente
- Verifica que los productos se muestren correctamente
- Los campos faltantes (descripcion, stock, etc.) no se mostrarán

## 🚀 Despliegue

### 1. Vercel
```bash
# Desplegar en Vercel
vercel --prod
```

### 2. Netlify
- Conecta tu repositorio de GitHub a Netlify
- Configura el build command y publish directory
- Despliega automáticamente desde Vercel

## 🐛 Solución de Problemas

### Error: "Table doesn't exist"
- Crea la tabla manualmente desde el dashboard de Supabase
- Usa el SQL simple proporcionado en la sección de estructura

### Error: "Permission denied"
- Verifica que estés usando la service role key para operaciones de escritura
- Revisa las políticas de seguridad en Supabase

### Error: "Connection failed"
- Verifica las credenciales de Supabase
- Asegúrate de que la URL sea correcta
- Revisa que no haya restricciones de IP

### Productos no se muestran
- Verifica que la migración se haya completado
- Revisa la consola del navegador para errores
- Verifica que la API esté funcionando

### Campos faltantes en el frontend
- Es normal que campos como `descripcion`, `stock`, `destacado` no se muestren
- La migración solo incluye los campos esenciales
- Si necesitas estos campos, puedes agregarlos después

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisa los logs en la consola
2. Verifica la configuración de Supabase
3. Consulta la [documentación de Supabase](https://supabase.com/docs)
4. Revisa los archivos de configuración del proyecto

## ✅ Checklist de Migración

- [ ] Tabla `productos` creada en Supabase (estructura simple)
- [ ] Productos migrados desde JSON local (solo campos esenciales)
- [ ] Conexión verificada
- [ ] API funcionando correctamente
- [ ] Frontend mostrando productos (sin campos faltantes)
- [ ] Desplegado en Vercel
- [ ] Conectado a Netlify
- [ ] Pruebas realizadas en producción

---

**🎉 ¡Migración completada!** Tu proyecto ahora usa Supabase como base de datos principal con una estructura simplificada.
