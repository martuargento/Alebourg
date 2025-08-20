# Script para agregar campo de orden a la tabla productos en Supabase
# Uso: .\agregar-campo-orden.ps1

param(
    [string]$BackendUrl = "https://alebourg-tau.vercel.app"
)

Write-Host "AGREGANDO CAMPO DE ORDEN A LA TABLA PRODUCTOS..." -ForegroundColor Cyan
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Yellow
Write-Host ""

# Funcion para agregar el campo orden
function Add-OrderField {
    Write-Host "Agregando campo 'orden' a la tabla productos..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/productos/add-order-field" -Method POST
        Write-Host "Campo 'orden' agregado exitosamente" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "ERROR al agregar campo 'orden': $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Funcion para actualizar valores de orden
function Update-OrderValues {
    Write-Host "Actualizando valores de orden basados en ID actual..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/productos/update-order-values" -Method POST
        Write-Host "Valores de orden actualizados exitosamente" -ForegroundColor Green
        Write-Host "   - Productos actualizados: $($response.totalActualizados)" -ForegroundColor White
        return $true
    } catch {
        Write-Host "ERROR al actualizar valores de orden: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Funcion para verificar el estado
function Test-OrderField {
    Write-Host "Verificando campo de orden..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/productos?debug=1"
        Write-Host "Estado actual:" -ForegroundColor Green
        Write-Host "   - Productos en memoria: $($response.count)" -ForegroundColor White
        Write-Host "   - Total en base de datos: $($response.totalInDb)" -ForegroundColor White
        Write-Host "   - Fuente: $($response.source)" -ForegroundColor White
        return $true
    } catch {
        Write-Host "ERROR al verificar estado: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Ejecutar el proceso completo
Write-Host "INICIANDO PROCESO DE AGREGAR CAMPO DE ORDEN..." -ForegroundColor Cyan
Write-Host ""

# Paso 1: Agregar campo orden
if (-not (Add-OrderField)) {
    Write-Host "FALLO al agregar campo. Abortando proceso." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 2: Actualizar valores de orden
if (-not (Update-OrderValues)) {
    Write-Host "FALLO al actualizar valores. Abortando proceso." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 3: Verificar estado final
if (-not (Test-OrderField)) {
    Write-Host "FALLO en la verificacion. Revisa manualmente." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "CAMPO DE ORDEN AGREGADO EXITOSAMENTE!" -ForegroundColor Green
Write-Host "Campo 'orden' agregado a la tabla" -ForegroundColor Green
Write-Host "Valores de orden inicializados" -ForegroundColor Green
Write-Host "Estado verificado" -ForegroundColor Green
Write-Host ""
Write-Host "AHORA PUEDES:" -ForegroundColor Cyan
Write-Host "   - Editar el campo 'orden' en Supabase Dashboard" -ForegroundColor White
Write-Host "   - Usar numeros bajos para productos prioritarios" -ForegroundColor White
Write-Host "   - Los productos se ordenaran automaticamente" -ForegroundColor White
Write-Host ""
Write-Host "Tu aplicacion ahora respeta el orden personalizado" -ForegroundColor Cyan
