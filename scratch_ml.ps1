$headers = @{
    'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    'Accept' = 'application/json'
}

$sellerId = '399646072'
$url = "https://api.mercadolibre.com/sites/MLA/search?seller_id=$sellerId"

try {
    $res = Invoke-RestMethod -Uri $url -Headers $headers -TimeoutSec 15
    Write-Host "=== MERCADOLIBRE SELLER DATA ==="
    Write-Host "Seller Nickname: $($res.seller.nickname)"
    Write-Host "Seller ID: $($res.seller.id)"
    Write-Host "Total items in ML: $($res.paging.total)"
    Write-Host "`nFirst 10 items in seller ML account:"
    foreach ($item in ($res.results | Select-Object -First 10)) {
        Write-Host "  - [$($item.id)] $($item.title)"
        Write-Host "    Price: `$$($item.price) | Link: $($item.permalink)"
    }
} catch {
    Write-Host "Error fetching ML API: $_"
}
