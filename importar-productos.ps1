# Script para importar productos a Supabase por chunks
# Uso: .\importar-productos.ps1 "ruta-al-archivo.json"

param(
    [Parameter(Mandatory=$true)]
    [string]$ArchivoJSON
)

Write-Host "Importando productos desde: $ArchivoJSON" -ForegroundColor Green

try {
    # Leer el archivo JSON completo
    $BodyText = Get-Content -Raw $ArchivoJSON
    $Productos = $BodyText | ConvertFrom-Json

    if (-not ($Productos -is [System.Collections.IEnumerable])) {
        throw "El archivo no contiene un array JSON de productos"
    }

    $Total = $Productos.Count
    $ChunkSize = 800
    $Offset = 0
    $Insertados = 0

    while ($Offset -lt $Total) {
        $Chunk = $Productos[$Offset..([Math]::Min($Offset + $ChunkSize - 1, $Total - 1))]
        $ChunkJson = ($Chunk | ConvertTo-Json -Depth 5)

        $Mode = if ($Offset -eq 0) { 'replace' } else { 'append' }
        Write-Host ("Enviando chunk {0}-{1} de {2} (modo: {3})" -f ($Offset+1), ([Math]::Min($Offset+$ChunkSize,$Total)), $Total, $Mode) -ForegroundColor Cyan

        $Headers = @{ 
            "Content-Type" = "application/json"; 
            "X-ADMIN-TOKEN" = "Alebourg-Admin-2025-Secure"; 
            "X-IMPORT-MODE" = $Mode 
        }

        $Response = Invoke-RestMethod -Uri "https://alebourg-tau.vercel.app/api/productos/import" -Method Post -Headers $Headers -Body $ChunkJson
        if ($Response.ok -ne $true) { throw "Respuesta no OK" }
        $Insertados += [int]$Response.inserted

        $Offset += $ChunkSize
    }

    Write-Host "✅ Importación exitosa! Total insertados: $Insertados" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error en la importación:" -ForegroundColor Red
    if ($_.Exception.Response -ne $null) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $respBody = $reader.ReadToEnd()
            Write-Host "Respuesta del servidor:" -ForegroundColor Yellow
            Write-Host $respBody
        } catch {
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host "`nPresiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
