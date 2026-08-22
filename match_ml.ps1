# Script to helper-match Mercado Libre items with Bertoncini Catalog
# You can paste pairs of Title/URL or load a list from Mercado Libre
param (
    [string]$InputCsvPath = ""
)

Write-Host "==============================================" -ForegroundColor Yellow
Write-Host " BERTONCINI - HERRAMIENTA DE MATCHEO ML      " -ForegroundColor Black -BackgroundColor Yellow
Write-Host "==============================================" -ForegroundColor Yellow

$catalog = Get-Content 'e:\Federico\Desarrollo\Mios\BertonciniOnline\data\catalog_clean.json' -Raw | ConvertFrom-Json
Write-Host "Catálogo cargado: $($catalog.Count) productos.`n"

# Dictionary of matched SKUs
$mlMap = @{}

# Load existing mapping if any
if (Test-Path 'e:\Federico\Desarrollo\Mios\BertonciniOnline\data\ml_mapping.json') {
    $existing = Get-Content 'e:\Federico\Desarrollo\Mios\BertonciniOnline\data\ml_mapping.json' -Raw | ConvertFrom-Json
    foreach ($prop in $existing.PSObject.Properties) {
        $mlMap[$prop.Name] = $prop.Value
    }
}

# Example matched item from user
$mlMap["985 000 790 000"] = "https://www.mercadolibre.com.ar/cutter-mango-aluminio-18-mm-hd110318-dong-cheng/p/MLA2102680674?pdp_filters=seller_id%3A399646072"

if ($InputCsvPath -and (Test-Path $InputCsvPath)) {
    Write-Host "Cargando archivo CSV: $InputCsvPath ..."
    $csv = Import-Csv -Path $InputCsvPath
    # Assuming columns: Title, Url, Sku (optional)
    foreach ($row in $csv) {
        if ($row.Sku) {
            $mlMap[$row.Sku.Trim()] = $row.Url.Trim()
        } elseif ($row.Title) {
            # Try fuzzy match by name
            $cleanT = $row.Title.ToLower()
            $match = $catalog | Where-Object { $cleanT.Contains($_.name.ToLower().Trim()) -or $_.name.ToLower().Contains($cleanT) } | Select-Object -First 1
            if ($match) {
                $mlMap[$match.sku.Trim()] = $row.Url.Trim()
                Write-Host "  -> Matcheado: [$($match.sku)] $($match.name) con $($row.Url)" -ForegroundColor Green
            }
        }
    }
}

# Export mapping JSON
$mlMap | ConvertTo-Json -Depth 4 | Out-File -FilePath 'e:\Federico\Desarrollo\Mios\BertonciniOnline\data\ml_mapping.json' -Encoding utf8

# Export mapping JS for browser
$jsMap = "window.BERTONCINI_ML_MAPPING = " + ($mlMap | ConvertTo-Json -Depth 4) + ";"
[System.IO.File]::WriteAllText('e:\Federico\Desarrollo\Mios\BertonciniOnline\data\ml_mapping.js', $jsMap, [System.Text.Encoding]::UTF8)

Write-Host "`n-> Mapeo guardado con éxito en data\ml_mapping.js y data\ml_mapping.json!" -ForegroundColor Cyan
Write-Host "Total productos con link directo 1 a 1: $($mlMap.Count)"
