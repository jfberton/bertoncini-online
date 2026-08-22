$headers = @{ 'User-Agent' = 'Mozilla/5.0' }
$p = Invoke-RestMethod -Uri 'https://bertoncinionline.com.ar/wp-json/wc/store/v1/products/37010' -Headers $headers
$p | ConvertTo-Json -Depth 5 | Out-File -FilePath 'e:\Federico\Desarrollo\Mios\BertonciniOnline\sample_product.json' -Encoding utf8
Write-Host "Product Keys: $($p.PSObject.Properties.Name -join ', ')"
Write-Host "Name: $($p.name)"
Write-Host "Images count: $($p.images.Length)"
if ($p.images.Length -gt 0) {
    Write-Host "Image 1: $($p.images[0].src)"
}
Write-Host "Categories: $(($p.categories | ForEach-Object { $_.name }) -join ' > ')"
Write-Host "Attributes: $(($p.attributes | ForEach-Object { $_.name }) -join ', ')"
Write-Host "Prices: $($p.prices | ConvertTo-Json -Compress)"
