[CmdletBinding()]
param(
  [string]$CommitMessage = 'Update website'
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)

function Invoke-Git {
  & git @args
  if ($LASTEXITCODE -ne 0) {
    throw "git $($args -join ' ') failed with exit code $LASTEXITCODE."
  }
}

$branch = (& git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) {
  throw 'Could not determine the current Git branch.'
}
if ($branch -ne 'main') {
  throw "Refusing to publish from '$branch'; GitHub Pages deploys pushes to 'main'."
}

$stagedChanges = @(& git diff --cached --name-only)
if ($LASTEXITCODE -ne 0) {
  throw 'Could not inspect staged changes.'
}
if ($stagedChanges.Count -gt 0) {
  throw "Commit or unstage existing staged changes first: $($stagedChanges -join ', ')"
}

$nodeCandidates = [System.Collections.Generic.List[string]]::new()
$pathNode = Get-Command node.exe -ErrorAction SilentlyContinue
if ($pathNode) {
  $nodeCandidates.Add($pathNode.Source)
}

$cachedNodeRoot = Join-Path $env:LOCALAPPDATA 'npm-cache\_npx'
if (Test-Path -LiteralPath $cachedNodeRoot) {
  Get-ChildItem -LiteralPath $cachedNodeRoot -Directory | ForEach-Object {
    $candidate = Join-Path $_.FullName 'node_modules\node\bin\node.exe'
    if (Test-Path -LiteralPath $candidate) {
      $nodeCandidates.Add($candidate)
    }
  }
}

$selectedNode = $null
$nodeVersionsFound = [System.Collections.Generic.List[string]]::new()
foreach ($candidate in $nodeCandidates | Select-Object -Unique) {
  $versionOutput = (& $candidate --version 2>$null).Trim()
  if ($LASTEXITCODE -ne 0 -or $versionOutput -notmatch '^v?(\d+)\.(\d+)\.(\d+)') {
    continue
  }

  $candidateVersion = [version]::new(
    [int]$Matches[1],
    [int]$Matches[2],
    [int]$Matches[3]
  )
  $nodeVersionsFound.Add("$versionOutput ($candidate)")
  if ($candidateVersion -ge [version]'22.23.4') {
    $selectedNode = $candidate
    break
  }
}

if (-not $selectedNode) {
  $found = if ($nodeVersionsFound.Count -gt 0) {
    $nodeVersionsFound -join ', '
  } else {
    'no usable Node.js installation was found'
  }
  throw "Node.js 22.23.4 or newer is required; found $found. Install a supported version or add it to PATH."
}

$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCommand) {
  throw 'npm.cmd was not found. Install npm and ensure it is available on PATH.'
}
$npmCli = Join-Path (Split-Path -Parent $npmCommand.Source) 'node_modules\npm\bin\npm-cli.js'
if (-not (Test-Path -LiteralPath $npmCli)) {
  throw "Could not locate npm-cli.js next to $($npmCommand.Source)."
}

Invoke-Git fetch origin main
$divergence = ((& git rev-list --left-right --count HEAD...origin/main) -join '').Trim()
if ($LASTEXITCODE -ne 0) {
  throw 'Could not compare the local branch with origin/main.'
}
$counts = $divergence -split '\s+'
if ($counts.Count -ne 2 -or [int]$counts[1] -gt 0) {
  throw 'origin/main has commits not present locally. Pull or rebase before publishing.'
}

$originalPath = $env:PATH
$env:PATH = "$(Split-Path -Parent $selectedNode);$originalPath"
try {
  & $selectedNode $npmCli run build
  if ($LASTEXITCODE -ne 0) {
    throw "Production build failed with exit code $LASTEXITCODE; nothing was committed or pushed."
  }
} finally {
  $env:PATH = $originalPath
}

Invoke-Git add --all
$hasChanges = $false
& git diff --cached --quiet
if ($LASTEXITCODE -eq 1) {
  $hasChanges = $true
} elseif ($LASTEXITCODE -ne 0) {
  throw 'Could not inspect staged changes.'
}

if (-not $hasChanges) {
  Write-Output 'Build succeeded; there are no site changes to commit.'
  exit 0
}

Invoke-Git commit -m $CommitMessage -m 'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>'
Invoke-Git push origin main
Write-Output 'All site changes pushed. GitHub Actions will deploy the site to GitHub Pages.'
