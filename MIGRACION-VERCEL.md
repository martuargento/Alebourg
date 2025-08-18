# 🚀 Migración de Railway a Vercel - Paso a Paso

## ¿Por qué migrar a Vercel?
- ✅ **Completamente GRATIS** - Sin límites de tiempo
- ✅ **100GB de ancho de banda** por mes
- ✅ **Deploy automático** desde GitHub
- ✅ **Muy rápido** - CDN global incluido
- ✅ **Perfecto para Node.js** y APIs

## 📋 Pasos para migrar:

### 1. Crear cuenta en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "Sign Up"
3. Conecta tu cuenta de GitHub
4. **¡NO necesitas tarjeta de crédito!**

### 2. Conectar tu proyecto
1. En Vercel, haz clic en "New Project"
2. Selecciona tu repositorio de GitHub
3. Vercel detectará automáticamente que es un proyecto de React

### 3. Configurar el proyecto
1. **Framework Preset**: Vite
2. **Root Directory**: `./` (dejar por defecto)
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### 4. Variables de entorno (si las tienes)
- Agrega cualquier variable de entorno que necesites
- Para este proyecto, probablemente no necesites ninguna

### 5. Deploy
1. Haz clic en "Deploy"
2. Espera 2-3 minutos
3. ¡Listo! Tu app estará funcionando

### 6. Actualizar URLs
1. Copia la URL que te da Vercel (ej: `https://tu-proyecto.vercel.app`)
2. Reemplaza en `src/config.js`:
   ```javascript
   export const BACKEND_URL = 'https://tu-proyecto.vercel.app';
   ```

### 7. Hacer commit y push
```bash
git add .
git commit -m "Migración a Vercel completada"
git push
```

## 🔧 Estructura del proyecto en Vercel:

```
📁 api/
  ├── precios-utils.js    # Endpoint para precios
  ├── descuentos.js       # Endpoint para descuentos  
  ├── productos.js        # Endpoint para productos
  └── categorias.js       # Endpoint para categorías
📁 src/                   # Tu frontend React
📁 public/                # Archivos estáticos
vercel.json               # Configuración de Vercel
```

## 🌐 URLs de tu API:
- **Precios**: `https://tu-proyecto.vercel.app/api/precios-utils`
- **Descuentos**: `https://tu-proyecto.vercel.app/api/descuentos`
- **Productos**: `https://tu-proyecto.vercel.app/api/productos`
- **Categorías**: `https://tu-proyecto.vercel.app/api/categorias`

## ✅ Ventajas de esta migración:
1. **Sin costos** - Completamente gratis
2. **Sin límites de tiempo** - Funciona indefinidamente
3. **Más rápido** - CDN global
4. **Deploy automático** - Cada push a GitHub
5. **Muy confiable** - Usado por millones de desarrolladores

## 🆘 Si algo no funciona:
1. Verifica que las URLs estén correctas
2. Revisa la consola del navegador
3. Verifica los logs en Vercel
4. ¡Pregúntame! Estoy aquí para ayudarte

## 🎯 Próximos pasos:
1. Crear cuenta en Vercel
2. Conectar tu proyecto
3. Hacer deploy
4. Actualizar URLs
5. ¡Disfrutar de tu app gratis para siempre!

---

**¿Necesitas ayuda con algún paso? ¡No dudes en preguntarme!** 🚀
