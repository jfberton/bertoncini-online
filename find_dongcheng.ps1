$products = Get-Content 'e:\Federico\Desarrollo\Mios\BertonciniOnline\data\products.json' -Raw | ConvertFrom-Json

Write-Host "Searching Dong Cheng products in catalog..."
$dongCheng = $products | Where-Object { $_.name -match 'Dong Cheng|Dongcheng' -or $_.description -match 'Dong Cheng' }
Write-Host "Found $($dongCheng.Count) Dong Cheng products:"

foreach ($p in $dongCheng) {
    Write-Host "  - SKU: $($p.sku) | $($p.name)"
}
