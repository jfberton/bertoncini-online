$headers = @{
    'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    'Accept' = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    'Accept-Language' = 'es-ES,es;q=0.9'
}

$url = "https://listado.mercadolibre.com.ar/_CustId_399646072"

try {
    $resp = Invoke-WebRequest -Uri $url -Headers $headers -TimeoutSec 15
    Write-Host "CustId listing status: $($resp.StatusCode)"
    Write-Host "Page title / length: $($resp.Content.Length) bytes"
    
    # Save content for parsing
    $resp.Content | Out-File -FilePath "e:\Federico\Desarrollo\Mios\BertonciniOnline\ml_seller_page.html" -Encoding utf8
    Write-Host "Saved ml_seller_page.html"
} catch {
    Write-Host "Error fetching CustId: $_"
}
