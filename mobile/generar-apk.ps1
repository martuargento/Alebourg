$ErrorActionPreference = 'Stop'

$mobileRoot = $PSScriptRoot
$repoRoot = Split-Path -Parent $mobileRoot
$androidRoot = Join-Path $mobileRoot 'android'
$sdkRoot = $env:ANDROID_HOME
if (-not $sdkRoot) {
  $sdkRoot = $env:ANDROID_SDK_ROOT
}
if (-not $sdkRoot) {
  $sdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}
if (-not (Test-Path -LiteralPath $sdkRoot)) {
  throw "No se encontró el Android SDK en '$sdkRoot'."
}

$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$driveCandidates = @('R', 'Q', 'P', 'O', 'N', 'M', 'L', 'K', 'J', 'I', 'H', 'G', 'F')
$mappedDrive = $null
foreach ($candidate in $driveCandidates) {
  if (Test-Path -LiteralPath ($candidate + ':\')) {
    continue
  }
  $candidateDrive = "${candidate}:"
  & subst.exe $candidateDrive $repoRoot
  if ($LASTEXITCODE -eq 0) {
    $mappedDrive = $candidateDrive
    break
  }
}
if (-not $mappedDrive) {
  throw 'No se encontró una letra de unidad libre para evitar el límite de rutas de Windows.'
}

$locationAnterior = Get-Location
$teniaNodeEnv = Test-Path Env:NODE_ENV
$nodeEnvAnterior = $env:NODE_ENV
try {
  $env:NODE_ENV = 'production'
  Set-Location "${mappedDrive}\mobile\android"
  & .\gradlew.bat assembleRelease
  if ($LASTEXITCODE -ne 0) {
    throw "Gradle terminó con código $LASTEXITCODE."
  }

  $apk = Join-Path $androidRoot 'app\build\outputs\apk\release\app-release.apk'
  if (-not (Test-Path -LiteralPath $apk)) {
    throw "Gradle terminó sin generar la APK esperada en '$apk'."
  }

  $descargas = Join-Path $env:USERPROFILE 'Downloads'
  if (-not (Test-Path -LiteralPath $descargas)) {
    throw "No se encontró la carpeta de Descargas: '$descargas'."
  }
  $destino = Join-Path $descargas 'alebourg.apk'
  Copy-Item -LiteralPath $apk -Destination $destino -Force
  Write-Host "APK lista: $destino"
} finally {
  Set-Location $locationAnterior
  if ($mappedDrive) {
    & subst.exe $mappedDrive /d
  }
  if ($teniaNodeEnv) {
    $env:NODE_ENV = $nodeEnvAnterior
  } else {
    Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
  }
}
