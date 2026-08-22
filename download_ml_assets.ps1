$destDir = "e:\Federico\Desarrollo\Mios\BertonciniOnline\assets\images"

$urls = @{
    "mercadolibre-official.png" = "https://http2.mlstatic.com/frontend-assets/ui-navigation/5.21.22/mercadolibre/logo__large_plus@2x.png"
    "mercadolibre-handshake.png" = "https://http2.mlstatic.com/frontend-assets/ui-navigation/5.21.22/mercadolibre/logo__small@2x.png"
}

foreach ($item in $urls.GetEnumerator()) {
    try {
        $dest = Join-Path $destDir $item.Key
        Invoke-WebRequest -Uri $item.Value -OutFile $dest -UserAgent "Mozilla/5.0"
        Write-Host "Downloaded $($item.Key)"
    } catch {
        Write-Host "Error downloading $($item.Key): $_"
    }
}
