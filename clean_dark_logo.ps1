Add-Type -AssemblyName System.Drawing

$darkImgPath = "e:\Federico\Desarrollo\Mios\BertonciniOnline\assets\images\logo-dark.png"
$cleanDarkImgPath = "e:\Federico\Desarrollo\Mios\BertonciniOnline\assets\images\logo-dark-clean.png"

$bmp = New-Object System.Drawing.Bitmap($darkImgPath)
$newBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# If pixel is dark/black (background), make transparent (alpha 0)
# If pixel is yellow or white/light, preserve it with crisp alpha
for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $p = $bmp.GetPixel($x, $y)
        # Background is dark (R < 35, G < 35, B < 35)
        if ($p.R -lt 40 -and $p.G -lt 40 -and $p.B -lt 40) {
            $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $newBmp.SetPixel($x, $y, $p)
        }
    }
}

$bmp.Dispose()
$newBmp.Save($cleanDarkImgPath, [System.Drawing.Imaging.ImageFormat]::Png)
$newBmp.Dispose()

Copy-Item $cleanDarkImgPath -Destination $darkImgPath -Force
Write-Host "Processed and cleaned logo-dark.png into a transparent PNG!"
