Add-Type -AssemblyName System.Drawing

$lightImgPath = "e:\Federico\Desarrollo\Mios\BertonciniOnline\assets\images\logo-light.png"
$cleanLightImgPath = "e:\Federico\Desarrollo\Mios\BertonciniOnline\assets\images\logo-light-clean.png"

$bmp = New-Object System.Drawing.Bitmap($lightImgPath)
$newBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# If pixel is near-white or light gray (part of fake checkerboard), make transparent (alpha 0)
# If pixel is dark (text), make black with crisp alpha
for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $p = $bmp.GetPixel($x, $y)
        # Check brightness / RGB values
        # The text is black/very dark (R < 100, G < 100, B < 100)
        # The checkerboard is white/grey (R > 180, G > 180, B > 180)
        if ($p.R -gt 170 -and $p.G -gt 170 -and $p.B -gt 170) {
            # Make transparent
            $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
        } elseif ($p.R -lt 100 -and $p.G -lt 100 -and $p.B -lt 100) {
            # Solid black
            $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 10, 10, 10))
        } else {
            # Intermediate / anti-aliasing edge
            $alpha = 255 - [int](($p.R + $p.G + $p.B) / 3)
            if ($alpha -lt 40) { $alpha = 0 }
            $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 10, 10, 10))
        }
    }
}

$bmp.Dispose()
$newBmp.Save($cleanLightImgPath, [System.Drawing.Imaging.ImageFormat]::Png)
$newBmp.Dispose()

Copy-Item $cleanLightImgPath -Destination $lightImgPath -Force
Write-Host "Processed and cleaned logo-light.png into a crisp transparent PNG!"
