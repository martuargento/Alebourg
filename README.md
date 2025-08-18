# 🚀 Alebourg - Tienda Online

## 📋 Descripción
Aplicación web de tienda online desarrollada con React y Vercel Serverless Functions.

## 🏗️ Arquitectura
- **Frontend**: React + Vite (desplegado en Netlify)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Base de datos**: Archivos JSON estáticos

## 🚀 Despliegue
- **Frontend**: [Netlify](https://netlify.com) - Deploy automático desde GitHub
- **Backend**: [Vercel](https://vercel.com) - Funciones serverless gratuitas

## 📁 Estructura del proyecto
```
📁 api/                    # Funciones serverless de Vercel
  ├── precios-utils.js     # Endpoint para ajustar precios
  ├── descuentos.js        # Endpoint para reglas de descuento
  ├── productos/           # Endpoints para productos
  │   ├── index.js         # GET /api/productos
  │   └── [id].js          # GET /api/productos/:id
  └── categorias.js        # Endpoint para categorías
📁 src/                    # Frontend React
📁 public/                 # Archivos estáticos y JSON de productos
```

## 🌐 URLs de la API
- **Base**: `https://alebourg-tau.vercel.app`
- **Productos**: `/api/productos`
- **Categorías**: `/api/categorias`
- **Precios**: `/api/precios-utils`
- **Descuentos**: `/api/descuentos`

## 🛠️ Instalación y desarrollo
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## ✨ Características
- ✅ Catálogo de productos con categorías
- ✅ Sistema de precios dinámico
- ✅ Carrito de compras
- ✅ Búsqueda de productos
- ✅ Sistema de descuentos configurable
- ✅ Panel de administración de precios
- ✅ Tema claro/oscuro
- ✅ Responsive design

## 🔧 Tecnologías utilizadas
- **Frontend**: React 19, Vite, Bootstrap, React Router
- **Backend**: Node.js, Vercel Serverless Functions
- **Estado**: React Context API
- **Estilos**: CSS personalizado + Bootstrap

---

**Desarrollado con ❤️ para Alebourg**