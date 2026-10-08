$ErrorActionPreference = "Continue"
$skill = "$HOME\.copilot\skills\ace-step-music\scripts\generate-music.ps1"
$out = "F:\AI\GameAssets\fluffy-bureau\music\raw"
New-Item -ItemType Directory -Force $out | Out-Null
foreach ($line in Get-Content "$PSScriptRoot\$($args[0])") {
  $id, $bpm, $key = $line.Split("|")
  if (Get-ChildItem $out -Filter "$id-*.flac" -ErrorAction SilentlyContinue) { "$id exists"; continue }
  for ($i = 0; $i -lt 30; $i++) {
    try { $r = Invoke-WebRequest http://127.0.0.1:7865/health -TimeoutSec 10; if ($r.StatusCode -eq 200) { break } } catch { Start-Sleep 30 }
  }
  & $skill -PromptFile "$PSScriptRoot\$id.txt" -Instrumental -OutputName "$id-v1" -DurationSeconds 95 -Bpm ([int]$bpm) -KeyScale $key -TimeSignature "4/4" -Seed 4242
  $src = Join-Path "C:\AI\ACE-Step-1.5\outputs" "$id-v1.flac"
  if (Test-Path $src) { Copy-Item $src $out; Copy-Item ($src -replace '\.flac$','.json') $out -ErrorAction SilentlyContinue; "$id done" } else { "$id FAILED" }
}

