# Scraper for Bertoncini Online
$ErrorActionPreference = "Stop"

$baseDir = "e:\Federico\Desarrollo\Mios\BertonciniOnline\data"
if (-not (Test-Path $baseDir)) {
    New-Item -ItemType Directory -Path $baseDir -Force | Out-Null
}

$headers = @{
    'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    'Accept' = 'application/json'
}

Write-Host "=========================================="
Write-Host " 1. Descargando Categorias de Productos... "
Write-Host "=========================================="

$categories = @()
$catPage = 1
$perPage = 100

while ($true) {
    $catUrl = "https://bertoncinionline.com.ar/wp-json/wc/store/v1/products/categories?per_page=$perPage&page=$catPage"
    try {
        $res = Invoke-RestMethod -Uri $catUrl -Headers $headers -TimeoutSec 15
        if ($res.Length -eq 0 -or $null -eq $res) { break }
        $categories += $res
        Write-Host "  Página $catPage de categorias obtenida ($($res.Length) categorias)..."
        if ($res.Length -lt $perPage) { break }
        $catPage++
    } catch {
        Write-Host "  Fin o error al paginar categorias: $_"
        break
    }
}

$categories | ConvertTo-Json -Depth 6 | Out-File -FilePath "$baseDir\categories.json" -Encoding utf8
Write-Host "-> Total categorias guardadas: $($categories.Count) en data\categories.json"

Write-Host "`n=========================================="
Write-Host " 2. Descargando Todos los Productos...    "
Write-Host "=========================================="

$products = @()
$prodPage = 1

while ($true) {
    $prodUrl = "https://bertoncinionline.com.ar/wp-json/wc/store/v1/products?per_page=$perPage&page=$prodPage"
    try {
        $res = Invoke-RestMethod -Uri $prodUrl -Headers $headers -TimeoutSec 20
        if ($res.Length -eq 0 -or $null -eq $res) { break }
        $products += $res
        Write-Host "  Página $prodPage de productos obtenida ($($res.Length) productos)... Total acumulado: $($products.Count)"
        if ($res.Length -lt $perPage) { break }
        $prodPage++
    } catch {
        Write-Host "  Fin o error al paginar productos: $_"
        break
    }
}

$products | ConvertTo-Json -Depth 8 | Out-File -FilePath "$baseDir\products.json" -Encoding utf8
Write-Host "-> Total productos guardados: $($products.Count) en data\products.json"

# Crear resumen para análisis rápido
$summary = @{
    TotalProducts = $products.Count
    TotalCategories = $categories.Count
    Categories = ($categories | Select-Object id, name, slug, parent, count)
    Brands = ($products | ForEach-Object { $_.brands } | Select-Object -ExpandProperty name -ErrorAction SilentlyContinue | Select-Object -Unique)
    Attributes = ($products | ForEach-Object { $_.attributes } | Select-Object -ExpandProperty name -ErrorAction SilentlyContinue | Select-Object -Unique)
    SampleSkus = ($products | Select-Object -First 10 | Select-Object id, name, sku)
    DateScraped = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$summary | ConvertTo-Json -Depth 5 | Out-File -FilePath "$baseDir\summary.json" -Encoding utf8
Write-Host "-> Resumen guardado en data\summary.json"
