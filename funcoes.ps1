function Falhar($mensagem) {
    Write-Host ""
    Write-Host "ERRO: $mensagem" -ForegroundColor Red
    exit 1
}

function Novo-Segredo([int]$bytes) {
    $b = New-Object byte[] $bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    return (-join ($b | ForEach-Object { $_.ToString("x2") }))
}

function Ler-Senha($rotulo) {
    $seguro = Read-Host $rotulo -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

function Docker-Ativo {
    docker info 2>&1 | Out-Null
    return ($LASTEXITCODE -eq 0)
}

function Esperar-App {
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $r = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/login" -TimeoutSec 5
            if ($r.StatusCode -eq 200) { return $true }
        } catch { }
        Start-Sleep -Seconds 3
    }
    return $false
}