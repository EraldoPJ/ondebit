Set-Location $PSScriptRoot
. "$PSScriptRoot\funcoes.ps1"

if (-not (Docker-Ativo)) { Falhar "O Docker nao esta em execucao." }

$pasta = Join-Path $PSScriptRoot "backups"
New-Item -ItemType Directory -Force -Path $pasta | Out-Null
$nome = "ondebit-" + (Get-Date -Format "yyyy-MM-dd_HHmm") + ".dump"
$destino = Join-Path $pasta $nome

docker compose exec -T db pg_dump -Fc -U ondebit -d db_ondebit -f /tmp/ondebit.dump
if ($LASTEXITCODE -ne 0) { Falhar "Falha ao gerar o backup." }

$id = (docker compose ps -q db).Trim()
docker cp "${id}:/tmp/ondebit.dump" $destino
if ($LASTEXITCODE -ne 0) { Falhar "Falha ao copiar o backup para o computador." }
docker compose exec -T db rm -f /tmp/ondebit.dump

# Mantem apenas os 30 backups mais recentes
Get-ChildItem $pasta -Filter "ondebit-*.dump" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip 30 |
    Remove-Item -Force

# Copia extra (pen drive, OneDrive etc.): coloque o caminho da pasta em backup-destino.txt
$arquivoDestino = Join-Path $PSScriptRoot "backup-destino.txt"
if (Test-Path $arquivoDestino) {
    $extra = (Get-Content $arquivoDestino -Raw).Trim()
    if ($extra -and (Test-Path $extra)) {
        Copy-Item $destino $extra -Force
        Write-Host "Copia extra salva em: $extra"
    } else {
        Write-Host "Aviso: pasta da copia extra nao encontrada: $extra" -ForegroundColor Yellow
    }
}

Write-Host "Backup salvo: $destino" -ForegroundColor Green