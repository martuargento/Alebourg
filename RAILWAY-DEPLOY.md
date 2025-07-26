# 🚀 Deploy en Railway - Alebourg Server

## 📋 PASOS PARA DEPLOYAR:

### **Paso 1: Ir a Railway**
1. Ve a [railway.app](https://railway.app)
2. Haz clic en **"Login with GitHub"**
3. Autoriza Railway para acceder a tu GitHub

### **Paso 2: Crear nuevo proyecto**
1. Haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca y selecciona tu repositorio: `martuargento/Alebourg`

### **Paso 3: Configurar el deploy**
1. Railway detectará automáticamente que es un proyecto Node.js
2. En **"Root Directory"** deja vacío (o pon `/` si te lo pide)
3. En **"Build Command"** deja vacío (Railway lo detecta automáticamente)
4. En **"Start Command"** pon: `npm start`

### **Paso 4: Variables de entorno**
1. Ve a la pestaña **"Variables"**
2. No necesitas agregar ninguna variable por ahora
3. Railway configurará automáticamente el `PORT`

### **Paso 5: Deploy**
1. Haz clic en **"Deploy"**
2. Espera a que termine el build (puede tomar 2-3 minutos)
3. Cuando veas **"Deploy Successful"**, ya está listo

### **Paso 6: Obtener la URL**
1. Ve a la pestaña **"Settings"**
2. Busca **"Domains"**
3. Copia la URL que aparece (algo como `https://alebourg-server-production-xxxx.up.railway.app`)

## 🔧 CONFIGURACIÓN FINAL:

### **Una vez que tengas la URL de Railway:**
1. Copia esa URL
2. Reemplaza `http://localhost:3001` por la URL de Railway en tu aplicación
3. Haz commit y push de los cambios
4. Netlify hará deploy automático

## ✅ VERIFICACIÓN:

### **Para verificar que funciona:**
1. Visita la URL de Railway + `/api/descuentos`
2. Deberías ver: `[]` (array vacío)
3. Si ves eso, el servidor está funcionando correctamente

## 🎯 RESULTADO:

- ✅ Servidor funcionando 24/7
- ✅ Sin renovación manual
- ✅ Completamente gratuito
- ✅ Deploy automático desde GitHub

---

**¡Una vez que tengas la URL de Railway, me avisas y te ayudo a configurar la aplicación para usarla!** 