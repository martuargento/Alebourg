# Script para resetear todos los valores de orden a 0
# Uso: .\resetear-orden.ps1

param(
    [string]$BackendUrl = "https://alebourg-tau.vercel.app"
)

Write-Host "RESETEANDO TODOS LOS VALORES DE ORDEN A 0..." -ForegroundColor Cyan
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Yellow
Write-Host ""

# Funcion para resetear todos los valores de orden
function Reset-OrderValues {
    Write-Host "Enviando comando para resetear orden..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/productos/reset-order" -Method POST
        Write-Host "✅ Orden reseteado exitosamente" -ForegroundColor Green
        Write-Host "Productos actualizados: $($response.productosActualizados)" -ForegroundColor White
        return $true
    } catch {
        Write-Host "❌ ERROR al resetear orden: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Funcion para mostrar instrucciones de uso
function Show-Instructions {
    Write-Host ""
    Write-Host "💡 INSTRUCCIONES DE USO:" -ForegroundColor Cyan
    Write-Host "1. Todos los productos ahora tienen orden = 0" -ForegroundColor White
    Write-Host "2. Ve a Supabase Dashboard → Table Editor → productos" -ForegroundColor White
    Write-Host "3. Edita SOLO los productos que quieras mover" -ForegroundColor White
    Write-Host "4. Asigna el numero de posicion deseada (ej: 1, 2, 3...)" -ForegroundColor White
    Write-Host "5. Los demas productos mantienen su orden original" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 EJEMPLO:" -ForegroundColor Yellow
    Write-Host "   - Producto A: orden = 1 → Aparece PRIMERO" -ForegroundColor White
    Write-Host "   - Producto B: orden = 3 → Aparece en posicion 3" -ForegroundColor White
    Write-Host "   - Producto C: orden = 0 → Mantiene posicion original (por ID)" -ForegroundColor White
}

# Ejecutar reset
if (Reset-OrderValues) {
    Show-Instructions
} else {
    Write-Host "❌ No se pudo resetear el orden" -ForegroundColor Red
}
