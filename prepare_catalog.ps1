# Process products into a lightweight catalog file with Brand Detection and ML Mapping support
$rawProducts = Get-Content 'e:\Federico\Desarrollo\Mios\BertonciniOnline\data\products.json' -Raw | ConvertFrom-Json
$rawCats = Get-Content 'e:\Federico\Desarrollo\Mios\BertonciniOnline\data\categories.json' -Raw | ConvertFrom-Json

Write-Host "Processing $($rawProducts.Length) products with enhanced brand detection..."

# Direct ML mappings known
$mlDirectMap = @{
    "985 000 790 000" = "https://www.mercadolibre.com.ar/cutter-mango-aluminio-18-mm-hd110318-dong-cheng/p/MLA2102680674?pdp_filters=seller_id%3A399646072"
}

$cleanProducts = @()

foreach ($p in $rawProducts) {
    $mainCat = if ($p.categories.Length -gt 0) { $p.categories[0].name } else { "General" }
    $catNames = @($p.categories | ForEach-Object { $_.name })
    
    $mainImg = if ($p.images.Length -gt 0) { $p.images[0].src } else { "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80" }
    $allImgs = @($p.images | ForEach-Object { $_.src })
    
    # Clean text description
    $cleanDesc = ""
    if (-not [string]::IsNullOrWhiteSpace($p.description)) {
        $cleanDesc = $p.description -replace '<[^>]+>', ' ' -replace '&nbsp;', ' ' -replace '\s+', ' '
        $cleanDesc = $cleanDesc.Trim()
    }
    
    # Attributes
    $attrs = @()
    if ($p.attributes) {
        foreach ($attr in $p.attributes) {
            $termNames = @($attr.terms | ForEach-Object { $_.name })
            $attrs += @{
                name = $attr.name
                options = $termNames
            }
        }
    }
    
    # Variations
    $vars = @()
    if ($p.variations) {
        foreach ($v in $p.variations) {
            $vars += @{
                id = $v.id
                sku = $v.sku
                attributes = $v.attributes
            }
        }
    }

    # Brand Detection (Enhanced)
    $brand = "Bertoncini / Nacional"
    if ($p.brands -and $p.brands.Length -gt 0) {
        $brand = $p.brands[0].name
    } elseif ($p.name -match 'Dong Cheng|Dongcheng') {
        $brand = "Dong Cheng"
    } elseif ($p.name -match 'LUSQTOFF|Lusqtoff') {
        $brand = "Lusqtoff"
    } elseif ($p.name -match 'BOSCH|Bosch') {
        $brand = "Bosch"
    } elseif ($p.name -match 'BAHCO|Bahco') {
        $brand = "Bahco"
    } elseif ($p.name -match 'STANLEY|Stanley') {
        $brand = "Stanley"
    } elseif ($p.name -match 'DEWALT|DeWalt|Dewalt') {
        $brand = "DeWalt"
    } elseif ($p.name -match 'MAKITA|Makita') {
        $brand = "Makita"
    } elseif ($p.name -match 'SKIL|Skil') {
        $brand = "Skil"
    } elseif ($p.name -match 'BREMEN|Bremen') {
        $brand = "Bremen"
    }

    $skuClean = if (-not [string]::IsNullOrWhiteSpace($p.sku)) { $p.sku.Trim() } else { "S/N-$($p.id)" }

    # Direct ML URL if known
    $directMlUrl = if ($mlDirectMap.ContainsKey($skuClean)) { $mlDirectMap[$skuClean] } else { $null }

    $cleanProducts += @{
        id = $p.id
        name = $p.name
        slug = $p.slug
        sku = $skuClean
        category = $mainCat
        categories = $catNames
        brand = $brand
        description = $cleanDesc
        raw_description = $p.description
        short_description = $p.short_description
        image = $mainImg
        images = $allImgs
        attributes = $attrs
        variations = $vars
        type = $p.type
        ml_url = $directMlUrl
    }
}

Write-Host "Processed $($cleanProducts.Length) clean products."

# Export as JSON
$cleanProducts | ConvertTo-Json -Depth 6 | Out-File -FilePath 'e:\Federico\Desarrollo\Mios\BertonciniOnline\data\catalog_clean.json' -Encoding utf8

# Export as JS
$jsContent = "window.BERTONCINI_CATALOG = " + ($cleanProducts | ConvertTo-Json -Depth 6) + ";"
[System.IO.File]::WriteAllText('e:\Federico\Desarrollo\Mios\BertonciniOnline\data\catalog.js', $jsContent, [System.Text.Encoding]::UTF8)

# Categories list for menu
$menuCats = $rawCats | Where-Object { $_.count -gt 0 } | Sort-Object count -Descending | Select-Object id, name, slug, count, parent
$catsJs = "window.BERTONCINI_CATEGORIES = " + ($menuCats | ConvertTo-Json -Depth 4) + ";"
[System.IO.File]::WriteAllText('e:\Federico\Desarrollo\Mios\BertonciniOnline\data\categories.js', $catsJs, [System.Text.Encoding]::UTF8)

Write-Host "Successfully regenerated data\catalog.js with Dong Cheng brand detection and ML direct mapping!"
