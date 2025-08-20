# Script de migración a Supabase
# Ejecutar desde la raíz del proyecto

Write-Host "🚀 Iniciando migración a Supabase..." -ForegroundColor Green
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "api")) {
    Write-Host "❌ Error: No se encontró el directorio 'api'. Ejecuta este script desde la raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Verificar que Node.js esté instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js no está instalado o no está en el PATH" -ForegroundColor Red
    exit 1
}

# Verificar que npm esté instalado
try {
    $npmVersion = npm --version
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: npm no está instalado o no está en el PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Pasos de migración:" -ForegroundColor Yellow
Write-Host "1. Crear tabla productos en Supabase" -ForegroundColor White
Write-Host "2. Migrar productos desde JSON local" -ForegroundColor White
Write-Host "3. Verificar migración" -ForegroundColor White
Write-Host ""

# Paso 1: Crear tabla en Supabase
Write-Host "🔧 Paso 1: Creando tabla productos en Supabase..." -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANTE: Si la tabla no existe, créala manualmente desde el dashboard de Supabase" -ForegroundColor Yellow
Write-Host "   con la estructura que se mostrará en la consola." -ForegroundColor Yellow
Write-Host ""

try {
    Set-Location "api"
    node crear-tabla-supabase.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tabla creada/verificada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Hubo problemas con la tabla. Revisa la consola." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error ejecutando script de creación de tabla: $_" -ForegroundColor Red
}

Write-Host ""

# Paso 2: Migrar productos desde JSON
Write-Host "🚀 Paso 2: Migrando productos desde JSON local..." -ForegroundColor Cyan
Write-Host ""

try {
    node migrar-json-a-supabase.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migración de productos completada" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Hubo problemas con la migración. Revisa la consola." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error ejecutando script de migración: $_" -ForegroundColor Red
}

Write-Host ""

# Paso 3: Verificar migración
Write-Host "🔍 Paso 3: Verificando migración..." -ForegroundColor Cyan
Write-Host ""

try {
    node -e "
        import('./_supabaseClient.js').then(async (module) => {
            const stats = await module.getSupabaseStats();
            if (stats) {
                console.log('📊 Estadísticas de Supabase:');
                console.log('   Total de productos:', stats.totalProductos);
                console.log('   Timestamp:', stats.timestamp);
            } else {
                console.log('❌ No se pudieron obtener estadísticas');
            }
        }).catch(console.error);
    "
} catch {
    Write-Host "❌ Error verificando migración: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Proceso de migración completado!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Verifica que los productos estén en Supabase" -ForegroundColor White
Write-Host "2. Actualiza tu aplicación para usar Supabase en lugar de Neon" -ForegroundColor White
Write-Host "3. Despliega en Vercel y luego en Netlify" -ForegroundColor White
Write-Host ""

# Volver al directorio raíz
Set-Location ".."
