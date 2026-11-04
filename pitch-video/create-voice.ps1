$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$scriptPath = Join-Path $PSScriptRoot 'narration.txt'
$assetsPath = Join-Path $PSScriptRoot 'assets'
$lines = [System.IO.File]::ReadAllText($scriptPath) -split '(?:\r?\n){2,}' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
$synthType = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows, ContentType=WindowsRuntime]
$streamType = [Windows.Media.SpeechSynthesis.SpeechSynthesisStream, Windows, ContentType=WindowsRuntime]
$voice = $synthType::AllVoices | Where-Object { $_.DisplayName -eq 'Microsoft George' } | Select-Object -First 1
if (-not $voice) { throw 'Microsoft George (en-GB) offline voice is unavailable.' }

$method = [System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1 } |
    Select-Object -First 1
$synth = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::new()
$synth.Voice = $voice
$synth.Options.SpeakingRate = 1.08
$synth.Options.AudioVolume = 1.0

try {
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $operation = $synth.SynthesizeTextToStreamAsync($lines[$i])
        $task = $method.MakeGenericMethod($streamType).Invoke($null, [object[]]@($operation))
        $stream = $task.GetAwaiter().GetResult()
        $input = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($stream.GetInputStreamAt(0))
        $outputPath = Join-Path $assetsPath ('voice-{0:d2}.wav' -f ($i + 1))
        $output = [System.IO.File]::Create($outputPath)
        try { $input.CopyTo($output) } finally { $output.Dispose(); $input.Dispose(); $stream.Dispose() }
    }
} finally {
    $synth.Dispose()
}

Write-Output "Generated $($lines.Count) synced narration lines with Microsoft George (offline)."
