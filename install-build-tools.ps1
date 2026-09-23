<#
.SYNOPSIS
Installs Microsoft Visual Studio C++ Build Tools (MSVC link.exe & Windows SDK) required by Rust for native Windows compilation.

.DESCRIPTION
Right-click this script and select "Run with PowerShell" (as Administrator).
#>

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Re:Read - Microsoft C++ Build Tools Installer for Rust" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "`n[!] Administrator privileges required." -ForegroundColor Yellow
    Write-Host "Restarting script with Administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

Write-Host "`n[1/2] Installing Visual Studio 2022 C++ Build Tools via winget..." -ForegroundColor Green
winget install --id Microsoft.VisualStudio.2022.BuildTools --override "--passive --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended" --accept-source-agreements --accept-package-agreements

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[2/2] Installation complete! You can now run 'npm run tauri dev' to compile the native Rust binary." -ForegroundColor Green
} else {
    Write-Host "`n[!] Winget returned exit code $LASTEXITCODE. You can also download the standalone installer from:" -ForegroundColor Yellow
    Write-Host "https://aka.ms/vs/17/release/vs_BuildTools.exe" -ForegroundColor White
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")




opencode -s ses_f373ec5aeffe2h7U2xREOApeL3
npm run desktop
