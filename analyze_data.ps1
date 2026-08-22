$data = Get-Content 'e:\Federico\Desarrollo\Mios\BertonciniOnline\data\products.json' -Raw | ConvertFrom-Json
$cats = Get-Content 'e:\Federico\Desarrollo\Mios\BertonciniOnline\data\categories.json' -Raw | ConvertFrom-Json

Write-Host "Total products loaded: $($data.Length)"
Write-Host "Total categories loaded: $($cats.Length)"

$withSku = ($data | Where-Object { -not [string]::IsNullOrWhiteSpace($_.sku) }).Length
$withImages = ($data | Where-Object { $_.images.Length -gt 0 }).Length
$withDesc = ($data | Where-Object { -not [string]::IsNullOrWhiteSpace($_.description) }).Length
$withVariations = ($data | Where-Object { $_.variations.Length -gt 0 -or $_.type -eq 'variable' }).Length

Write-Host "Products with SKU: $withSku / $($data.Length)"
Write-Host "Products with Images: $withImages / $($data.Length)"
Write-Host "Products with Description: $withDesc / $($data.Length)"
Write-Host "Variable products / with variations: $withVariations / $($data.Length)"

# Sample SKUs
Write-Host "`nSample SKUs:"
$data | Select-Object -First 10 | ForEach-Object { Write-Host "  $($_.sku) | $($_.name)" }

# Top Categories by count
Write-Host "`nTop 10 Categories:"
$cats | Sort-Object count -Descending | Select-Object -First 10 | ForEach-Object { Write-Host "  $($_.name) ($($_.count) prods) [Slug: $($_.slug)]" }

# Attributes
$allAttrs = $data | ForEach-Object { $_.attributes } | Group-Object name | Sort-Object Count -Descending
Write-Host "`nProduct Attributes detected:"
$allAttrs | ForEach-Object { Write-Host "  Attribute '$($_.Name)': $($_.Count) occurrences" }

# Check other site pages
Write-Host "`nFetching site pages from sitemap..."
try {
    $pagesSitemap = Invoke-RestMethod -Uri "https://bertoncinionline.com.ar/wp-sitemap-posts-page-1.xml" -Headers @{'User-Agent'='Mozilla/5.0'}
    [xml]$xml = $pagesSitemap
    Write-Host "Site pages:"
    $xml.urlset.url | ForEach-Object { Write-Host "  - $($_.loc)" }
} catch {
    Write-Host "Error getting pages: $_"
}
