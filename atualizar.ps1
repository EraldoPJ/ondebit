Set-Location $PSScriptRoot
. "$PSScriptRoot\funcoes.ps1"

$ramo = "producao"

Write-Host "=== Atualizacao do Ondebit ===" -ForegroundColor Cyan

if (-not (Docker-Ativo)) { Falhar "O Docker nao esta em execucao. Abra o Docker Desktop e tente de novo." }

git fetch origin $ramo
if ($LASTEXITCODE -ne 0) { Falhar "Nao consegui acessar o GitHub. Verifique a internet e o acesso ao repositorio." }

$atual = (git rev-parse HEAD).Trim()
$novo = (git rev-parse "origin/$ramo").Trim()
if ($atual -eq $novo) {
    Write-Host "Ja esta na versao mais recente."
    exit 0
}

Write-Host "Fazendo backup antes de atualizar..."
& "$PSScriptRoot\backup.ps1"
if ($LASTEXITCODE -ne 0) { Falhar "O backup falhou, entao a atualizacao foi cancelada." }

git merge --ff-only "origin/$ramo"
if ($LASTEXITCODE -ne 0) { Falhar "Nao foi possivel atualizar o codigo (existem alteracoes locais no notebook?)." }

Write-Host "Reconstruindo o sistema..."
docker compose up -d --build
$subiu = ($LASTEXITCODE -eq 0) -and (Esperar-App)

if (-not $subiu) {
    Write-Host "A nova versao nao iniciou. Voltando para a versao anterior..." -ForegroundColor Yellow
    git reset --hard $atual
    docker compose up -d --build
    if (Esperar-App) {
        Falhar "A atualizacao falhou e a versao anterior foi restaurada. Se o banco chegou a ser alterado, use o restaurar.ps1 com o backup mais recente."
    } else {
        Falhar "A atualizacao falhou e a versao anterior tambem nao iniciou. Veja: docker compose logs app. Se precisar, use o restaurar.ps1."
    }
}

docker image prune -f | Out-Null
Write-Host "Atualizado com sucesso." -ForegroundColor Green