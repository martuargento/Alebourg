# Script para actualizar productos en Supabase desde JSON
# Uso: .\actualizar-productos-supabase.ps1

param(
    [string]$JsonFile = "productosalebourgactualizados.json",
    [string]$BackendUrl = "https://alebourg-tau.vercel.app"
)

Write-Host "🔄 ACTUALIZANDO PRODUCTOS EN SUPABASE..." -ForegroundColor Cyan
Write-Host "Archivo JSON: $JsonFile" -ForegroundColor Yellow
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Yellow
Write-Host ""

# Verificar que el archivo existe
if (-not (Test-Path $JsonFile)) {
    Write-Host "❌ ERROR: No se encontró el archivo $JsonFile" -ForegroundColor Red
    Write-Host "Asegúrate de que el archivo esté en la raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Leer el JSON
Write-Host "📖 Leyendo archivo JSON..." -ForegroundColor Green
try {
    $jsonContent = Get-Content $JsonFile -Raw | ConvertFrom-Json
    $totalProductos = $jsonContent.Count
    Write-Host "✅ Productos encontrados en JSON: $totalProductos" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: No se pudo leer el archivo JSON" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Función para limpiar productos en Supabase
function Clear-SupabaseProducts {
    Write-Host "🗑️ Limpiando productos existentes en Supabase..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/productos/clear" -Method POST
        Write-Host "✅ Productos limpiados exitosamente" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ ERROR al limpiar productos: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Función para importar productos a Supabase
function Import-SupabaseProducts {
    Write-Host "📤 Importando productos a Supabase..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/productos/import" -Method POST
        Write-Host "✅ Productos importados exitosamente" -ForegroundColor Green
        Write-Host "Total importado: $($response.count) productos" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ ERROR al importar productos: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Función para verificar el estado
function Test-SupabaseProducts {
    Write-Host "🔍 Verificando estado de productos en Supabase..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/productos?debug=1"
        Write-Host "✅ Estado actual:" -ForegroundColor Green
        Write-Host "   - Productos en memoria: $($response.count)" -ForegroundColor White
        Write-Host "   - Total en base de datos: $($response.totalInDb)" -ForegroundColor White
        Write-Host "   - Fuente: $($response.source)" -ForegroundColor White
        return $true
    } catch {
        Write-Host "❌ ERROR al verificar estado: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Ejecutar el proceso completo
Write-Host "🚀 INICIANDO PROCESO DE ACTUALIZACIÓN..." -ForegroundColor Cyan
Write-Host ""

# Paso 1: Limpiar productos existentes
if (-not (Clear-SupabaseProducts)) {
    Write-Host "❌ FALLO en la limpieza. Abortando proceso." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 2: Importar nuevos productos
if (-not (Import-SupabaseProducts)) {
    Write-Host "❌ FALLO en la importación. Abortando proceso." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 3: Verificar estado final
if (-not (Test-SupabaseProducts)) {
    Write-Host "❌ FALLO en la verificación. Revisa manualmente." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 ¡ACTUALIZACIÓN COMPLETADA EXITOSAMENTE!" -ForegroundColor Green
Write-Host "✅ Productos limpiados" -ForegroundColor Green
Write-Host "✅ Productos importados" -ForegroundColor Green
Write-Host "✅ Estado verificado" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Tu aplicación ahora tiene los productos más recientes" -ForegroundColor Cyan
Write-Host "📱 Recarga la página para ver los cambios" -ForegroundColor Cyan
