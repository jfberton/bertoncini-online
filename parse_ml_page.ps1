$html = Get-Content "e:\Federico\Desarrollo\Mios\BertonciniOnline\ml_seller_page.html" -Raw

Write-Host "Searching for product cards, titles and links in ML seller page..."

# Extract all links
$matches = [regex]::Matches($html, 'href="(https://[^"]*(?:MLA|articulo|producto)[^"]*)"')
Write-Host "Found $($matches.Count) product links"

$items = @()
# Extract using polycard / search results regex
$cardMatches = [regex]::Matches($html, '<li class="ui-search-layout__item[^>]*>[\s\S]*?</li>')
Write-Host "Found $($cardMatches.Count) card items in layout"

if ($cardMatches.Count -gt 0) {
    foreach ($card in $cardMatches) {
        $cHtml = $card.Value
        $titleMatch = [regex]::Match($cHtml, '<h2[^>]*class="[^"]*poly-component__title[^"]*"[^>]*><a[^>]*href="([^"]+)"[^>]*>([^<]+)</a>')
        if (-not $titleMatch.Success) {
            $titleMatch = [regex]::Match($cHtml, '<a[^>]*href="([^"]+)"[^>]*title="([^"]+)"')
        }
        if (-not $titleMatch.Success) {
            $titleMatch = [regex]::Match($cHtml, '<a[^>]*class="ui-search-link"[^>]*href="([^"]+)"[^>]*>([^<]+)</a>')
        }

        if ($titleMatch.Success) {
            $link = $titleMatch.Groups[1].Value
            $title = $titleMatch.Groups[2].Value
            $items += @{
                title = $title
                link = $link
            }
        }
    }
} else {
    # Match any poly-component or poly-card
    $polyMatches = [regex]::Matches($html, '<a[^>]+href="(https://[^"]+)"[^>]*class="poly-component__title"[^>]*>([^<]+)</a>')
    foreach ($pm in $polyMatches) {
        $items += @{
            link = $pm.Groups[1].Value
            title = $pm.Groups[2].Value
        }
    }
    if ($items.Count -eq 0) {
        $generalMatches = [regex]::Matches($html, '<a[^>]+href="(https://(?:articulo|www)\.mercadolibre\.com\.ar/[^"]+)"[^>]*>([^<]+)</a>')
        foreach ($gm in ($generalMatches | Select-Object -First 20)) {
            $items += @{
                link = $gm.Groups[1].Value
                title = $gm.Groups[2].Value.Trim()
            }
        }
    }
}

Write-Host "Extracted $($items.Count) items:"
$items | ForEach-Object { Write-Host "  - $($_.title) -> $($_.link)" }
