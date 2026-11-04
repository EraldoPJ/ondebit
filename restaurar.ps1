param([string]$Arquivo)

Set-Location $PSScriptRoot
. "$PSScriptRoot\funcoes.ps1"

if (-not $Arquivo) {
    Write-Host "Backups disponiveis:"
    Get-ChildItem (Join-Path $PSScriptRoot "backups") -Filter "ondebit-*.dump" |
        Sort-Object LastWriteTime -Descending |
        ForEach-Object { Write-Host "  $($_.Name)" }
    Write-Host ""
    Write-Host "Para restaurar: powershell -ExecutionPolicy Bypass -File .\restaurar.ps1 -Arquivo .\backups\NOME.dump"
    exit 0
}

if (-not (Test-Path $Arquivo)) { Falhar "Arquivo nao encontrado: $Arquivo" }
if (-not (Docker-Ativo)) { Falhar "O Docker nao esta em execucao." }

$confirma = Read-Host "Isso SUBSTITUI todos os dados atuais pelos do backup. Digite SIM para continuar"
if ($confirma -ne "SIM") { Write-Host "Cancelado."; exit 0 }

docker compose stop app
$id = (docker compose ps -q db).Trim()
$caminho = (Resolve-Path $Arquivo).Path

docker cp $caminho "${id}:/tmp/restaurar.dump"
if ($LASTEXITCODE -ne 0) { Falhar "Falha ao enviar o backup para o banco." }

docker compose exec -T db pg_restore --clean --if-exists --no-owner -U ondebit -d db_ondebit /tmp/restaurar.dump
$codigo = $LASTEXITCODE
docker compose exec -T db rm -f /tmp/restaurar.dump
docker compose start app

if ($codigo -ne 0) {
    Write-Host "Restauracao terminou com avisos (codigo $codigo). Confira se os dados estao corretos." -ForegroundColor Yellow
} else {
    Write-Host "Restauracao concluida." -ForegroundColor Green
}