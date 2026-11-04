Set-Location $PSScriptRoot
. "$PSScriptRoot\funcoes.ps1"

Write-Host "=== Instalacao do Ondebit ===" -ForegroundColor Cyan

# 1. Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Falhar "O Docker nao esta instalado. Instale o Docker Desktop (no PowerShell: winget install -e --id Docker.DockerDesktop, ou baixe pelo site do Docker), reinicie o computador, abra o Docker Desktop uma vez e rode este instalador de novo."
}
if (-not (Docker-Ativo)) {
    Falhar "O Docker esta instalado, mas nao esta em execucao. Abra o Docker Desktop, espere ele terminar de iniciar e rode o instalador de novo."
}

# 2. Arquivo .env (senhas geradas automaticamente; nunca vai para o GitHub)
$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    $conteudo = "DB_PASSWORD=" + (Novo-Segredo 16) + "`n" +
                "SESSION_SECRET=" + (Novo-Segredo 32) + "`n" +
                "COOKIE_SEGURO=false`n"
    [System.IO.File]::WriteAllText($envPath, $conteudo, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "Arquivo .env criado com senhas geradas automaticamente."
} else {
    Write-Host "Arquivo .env ja existe: mantido."
}

# 3. Senha do administrador
Write-Host ""
Write-Host "Defina a senha do administrador (usuario: admin)."
Write-Host "Use de 10 a 72 caracteres, sem espaco no comeco ou no fim."
while ($true) {
    $s1 = Ler-Senha "Senha"
    $s2 = Ler-Senha "Repita a senha"
    if ($s1 -ne $s2) {
        Write-Host "As senhas nao conferem." -ForegroundColor Yellow
        continue
    }
    if ($s1.Length -lt 10 -or $s1.Length -gt 72 -or $s1 -ne $s1.Trim()) {
        Write-Host "Senha invalida: use de 10 a 72 caracteres, sem espaco no comeco ou no fim." -ForegroundColor Yellow
        continue
    }
    break
}

# 4. Montar e iniciar
Write-Host ""
Write-Host "Montando e iniciando o sistema. Na primeira vez isso leva alguns minutos..."
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { Falhar "Nao foi possivel montar o sistema. Veja as mensagens acima." }

Write-Host "Aguardando o sistema iniciar..."
if (-not (Esperar-App)) { Falhar "O sistema nao respondeu. Para ver o motivo, rode: docker compose logs app" }

# 5. Criar o administrador
$OutputEncoding = New-Object System.Text.UTF8Encoding $false
$s1 | docker compose exec -T app npx tsx prisma/criar-admin.ts
if ($LASTEXITCODE -ne 0) { Falhar "Nao foi possivel criar o administrador." }

# 6. Backup diario automatico (todo dia as 02:00)
try {
    $acao = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$PSScriptRoot\backup.ps1`""
    $gatilho = New-ScheduledTaskTrigger -Daily -At 2:00AM
    $config = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 1)
    Register-ScheduledTask -TaskName "Ondebit Backup Diario" -Action $acao -Trigger $gatilho -Settings $config -Force | Out-Null
    Write-Host "Backup diario agendado para as 02:00."
} catch {
    Write-Host "Aviso: nao consegui agendar o backup automatico. Rode o instalador como administrador ou agende manualmente o backup.ps1." -ForegroundColor Yellow
}

# 7. Enderecos de acesso
$ips = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.InterfaceAlias -notmatch "vEthernet|WSL|Loopback|Docker" } |
    Select-Object -ExpandProperty IPAddress

Write-Host ""
Write-Host "=== Instalacao concluida ===" -ForegroundColor Green
Write-Host "Neste computador:  http://localhost:3000"
foreach ($ip in $ips) { Write-Host "No celular (mesmo Wi-Fi):  http://${ip}:3000" }
Write-Host "Login: admin  (com a senha que voce acabou de definir)"