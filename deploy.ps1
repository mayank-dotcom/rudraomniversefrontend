# Build karo
npm run build

# Standalone output copy karo
$dist = ".next\standalone"
$static = ".next\static"
$pub = "public"

if (Test-Path $dist) {
    Copy-Item -Recurse -Force $static "$dist\.next\static"
    Copy-Item -Recurse -Force $pub "$dist\public"
    Write-Host "Deploy $dist folder to VPS"
}
