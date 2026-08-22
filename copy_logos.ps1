$destDir = "e:\Federico\Desarrollo\Mios\BertonciniOnline\assets\images"
if (-not (Test-Path $destDir)) { 
    New-Item -ItemType Directory -Path $destDir -Force 
}

$img1 = "C:\Users\berton\.gemini\antigravity\brain\86179fa5-9f74-4f0a-8dd1-29e7cf1abd93\.user_uploaded\media_1787404092715.png"
$img2 = "C:\Users\berton\.gemini\antigravity\brain\86179fa5-9f74-4f0a-8dd1-29e7cf1abd93\.user_uploaded\media_1787404113552.png"

Copy-Item -Path $img1 -Destination "$destDir\logo-light.png" -Force
Copy-Item -Path $img2 -Destination "$destDir\logo-dark.png" -Force

Write-Host "Files copied successfully to $destDir"
Get-ChildItem $destDir
