param([switch]$List, [string]$Request)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $voices = @($synth.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { $_.VoiceInfo.Name })
  if ($List) { ConvertTo-Json -InputObject $voices -Compress; exit 0 }
  if (-not [IO.Path]::IsPathRooted($Request)) { throw 'absolute_request_required' }
  $job = Get-Content -LiteralPath $Request -Raw -Encoding UTF8 | ConvertFrom-Json
  if ($voices -cnotcontains $job.voice) { throw 'unavailable_voice' }
  $synth.SelectVoice($job.voice)
  $root = [IO.Path]::GetFullPath($job.output).TrimEnd('\') + '\'
  foreach ($clip in $job.clips) {
    $file = [IO.Path]::GetFullPath($clip.file)
    if (-not $file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { throw 'clip_outside_output' }
    if (Test-Path -LiteralPath $file) { throw 'clip_already_exists' }
    if ($clip.text.Length -gt 400 -or $clip.text.Length -eq 0) { throw 'invalid_clip_text' }
    $synth.SetOutputToWaveFile($file)
    $synth.Speak([string]$clip.text)
    $synth.SetOutputToNull()
  }
  '{"ok":true}'
} finally { $synth.Dispose() }
