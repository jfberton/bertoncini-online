$headers = @{
    'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    'Accept' = 'application/json, text/html, */*'
}

Write-Host "=== 1. Testing Sitemap ==="
try {
    $sitemapResp = Invoke-WebRequest -Uri "https://bertoncinionline.com.ar/wp-sitemap.xml" -Headers $headers -TimeoutSec 10
    Write-Host "wp-sitemap.xml status: $($sitemapResp.StatusCode)"
    [xml]$xml = $sitemapResp.Content
    $xml.sitemapindex.sitemap | ForEach-Object { Write-Host "  Sub-sitemap: $($_.loc)" }
} catch {
    Write-Host "wp-sitemap failed: $_"
}

Write-Host "`n=== 2. Testing WC Store API ==="
try {
    $wcStore = Invoke-RestMethod -Uri "https://bertoncinionline.com.ar/wp-json/wc/store/v1/products?per_page=5" -Headers $headers -TimeoutSec 10
    Write-Host "WC Store /products works! Items count: $($wcStore.Length)"
    foreach ($item in $wcStore) {
        Write-Host "  Product: [$($item.id)] $($item.name) | SKU: $($item.sku)"
    }
} catch {
    Write-Host "WC Store API error: $_"
}

Write-Host "`n=== 3. Testing Total Counts ==="
try {
    $resp = Invoke-WebRequest -Uri "https://bertoncinionline.com.ar/wp-json/wc/store/v1/products?per_page=1" -Headers $headers -TimeoutSec 10
    $total = $resp.Headers["X-WP-Total"]
    $totalPages = $resp.Headers["X-WP-TotalPages"]
    Write-Host "Total products: $total | Total pages: $totalPages"
} catch {
    Write-Host "Count check error: $_"
}
