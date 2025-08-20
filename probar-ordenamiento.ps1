# Script para probar el sistema de ordenamiento inteligente
# Uso: .\probar-ordenamiento.ps1

param(
    [string]$BackendUrl = "https://alebourg-tau.vercel.app"
)

Write-Host "🧪 PROBANDO SISTEMA DE ORDENAMIENTO INTELIGENTE..." -ForegroundColor Cyan
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Yellow
Write-Host ""

# Función para obtener productos y mostrar orden
function Test-Ordering {
    Write-Host "📋 Obteniendo productos con ordenamiento inteligente..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/productos"
        Write-Host "✅ Productos obtenidos exitosamente" -ForegroundColor Green
        Write-Host "Total de productos: $($response.Count)" -ForegroundColor White
        
        # Mostrar los primeros 10 productos con su orden
        Write-Host ""
        Write-Host "🔍 PRIMEROS 10 PRODUCTOS (con orden):" -ForegroundColor Cyan
        Write-Host "Pos | ID    | Orden | Título" -ForegroundColor White
        Write-Host "----|-------|-------|----------------------------------------" -ForegroundColor White
        
        for ($i = 0; $i -lt [Math]::Min(10, $response.Count); $i++) {
            $producto = $response[$i]
            $orden = if ($producto.orden) { $producto.orden } else { "0 (ID)" }
            $titulo = if ($producto.titulo.Length -gt 40) { $producto.titulo.Substring(0, 37) + "..." } else { $producto.titulo }
            
            Write-Host "$($i+1)   | $($producto.id) | $orden | $titulo" -ForegroundColor White
        }
        
        # Mostrar productos con orden personalizado
        $productosConOrden = $response | Where-Object { $_.orden -and $_.orden -gt 0 }
        if ($productosConOrden.Count -gt 0) {
            Write-Host ""
            Write-Host "🎯 PRODUCTOS CON ORDEN PERSONALIZADO:" -ForegroundColor Green
            Write-Host "Orden | ID    | Título" -ForegroundColor White
            Write-Host "------|-------|----------------------------------------" -ForegroundColor White
            
            $productosConOrden | Sort-Object orden | ForEach-Object {
                $titulo = if ($_.titulo.Length -gt 40) { $_.titulo.Substring(0, 37) + "..." } else { $_.titulo }
                Write-Host "$($_.orden)     | $($_.id) | $titulo" -ForegroundColor Green
            }
        } else {
            Write-Host ""
            Write-Host "ℹ️ No hay productos con orden personalizado" -ForegroundColor Yellow
        }
        
        return $true
    } catch {
        Write-Host "❌ ERROR al obtener productos: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Función para mostrar instrucciones de uso
function Show-Instructions {
    Write-Host ""
    Write-Host "💡 INSTRUCCIONES DE USO:" -ForegroundColor Cyan
    Write-Host "1. Ve a Supabase Dashboard → Table Editor → productos" -ForegroundColor White
    Write-Host "2. Edita el campo 'orden' para los productos que quieras mover" -ForegroundColor White
    Write-Host "3. Usa números del 1 al 10 para posiciones prioritarias" -ForegroundColor White
    Write-Host "4. Los productos sin orden mantienen su posición original" -ForegroundColor White
    Write-Host "5. Ejecuta este script nuevamente para ver los cambios" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 EJEMPLO:" -ForegroundColor Yellow
    Write-Host "   - Producto A: orden = 1 → Aparece PRIMERO" -ForegroundColor White
    Write-Host "   - Producto B: orden = 3 → Aparece en posición 3" -ForegroundColor White
    Write-Host "   - Producto C: sin orden → Mantiene posición original" -ForegroundColor White
}

# Ejecutar prueba
if (Test-Ordering) {
    Show-Instructions
} else {
    Write-Host "❌ No se pudo probar el ordenamiento" -ForegroundColor Red
}
