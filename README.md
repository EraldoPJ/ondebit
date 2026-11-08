# Ondebit

Sistema web para controlar vendas fiadas por cliente: cadastro de usuários, clientes e produtos, lançamento de pedidos, relatório com filtros e cobrança por WhatsApp.

O sistema roda em um notebook da empresa, dentro do Docker (um contêiner para o app Next.js e outro para o banco PostgreSQL), e é acessado pelo navegador do próprio notebook ou do celular, na mesma rede, em `http://IP-DO-NOTEBOOK:3000`.

## Instalação (notebook com Windows 11)

### Requisitos

- Windows 11 (Home ou Pro) com virtualização habilitada (Gerenciador de Tarefas → Desempenho → CPU → Virtualização: Habilitado).
- 8 GB de RAM (ideal) e cerca de 20 GB livres em disco.
- Internet durante a instalação.

### Preparação (uma vez, no computador de desenvolvimento)

1. Ter o repositório privado `ondebit` no GitHub com as ramificações `main` (desenvolvimento) e `producao` (versão instalada no notebook).
2. Criar um token do GitHub (Fine-grained token) restrito ao repositório `ondebit`, com a permissão **Contents: Read-only**.
3. No arquivo `pre_instalacao.bat`, editar a linha `GITHUB_USUARIO` com o seu usuário do GitHub (e, se necessário, `GITHUB_REPO`, `PASTA` e `RAMO`).
4. Converter o `pre_instalacao.bat` para o final de linha do Windows (rodar uma única vez):

```bash
sed -i '' 's/$/\r/' pre_instalacao.bat
```

O `pre_instalacao.bat` não fica no repositório do notebook: ele é levado por pen drive, e-mail ou pasta compartilhada, porque roda antes de o projeto existir lá.

### Instalação no notebook

1. Copiar o `pre_instalacao.bat` para o notebook e dar dois cliques, aceitando o aviso de administrador.
2. Se o Docker Desktop foi instalado nesse momento: reiniciar o computador, abrir o Docker Desktop, aceitar os termos, esperar ele iniciar e executar o `pre_instalacao.bat` de novo.
3. Colar o token do GitHub quando for pedido. O projeto é baixado em `C:\Ondebit` e o `instalar.bat` abre em seguida.
4. Definir a senha do administrador (10 a 72 caracteres, sem espaço no começo ou no fim) e aguardar a montagem, que leva alguns minutos na primeira vez.
5. Anotar os endereços de acesso mostrados no final.

O que acontece automaticamente:

- Instalação do Git e do Docker Desktop, se ainda não existirem.
- Ajuste de energia: o notebook não dorme na tomada, nem ao fechar a tampa.
- Liberação da porta 3000 no firewall, somente para redes privadas.
- Download do projeto (ramificação `producao`) em `C:\Ondebit`.
- Criação do arquivo `.env` com senhas geradas aleatoriamente.
- Criação do banco, das tabelas e do usuário `admin`.
- Agendamento do backup diário às 02:00, na pasta `C:\Ondebit\backups`.

### Ajustes manuais no notebook

- Aceitar os termos do Docker Desktop na primeira vez que ele abrir.
- Nas configurações do Docker Desktop, marcar a opção de iniciar junto com o Windows.
- Deixar a rede do notebook (Wi-Fi ou cabo) como **Rede privada** (Configurações → Rede e Internet → propriedades da conexão).
- Reservar o IP do notebook no roteador (reserva DHCP), para o endereço não mudar.
- Opcional: ativar o login automático do Windows (`netplwiz`), para o sistema voltar sozinho depois de uma queda de energia.
- Opcional: cópia extra dos backups, criando o arquivo `C:\Ondebit\backup-destino.txt` com uma única linha, o caminho da pasta de destino (pen drive ou pasta do OneDrive, por exemplo).
- Guardar uma cópia segura do arquivo `C:\Ondebit\.env`.

### Conferência final

1. No notebook, abrir `http://localhost:3000` e entrar com `admin` e a senha definida.
2. No celular, na mesma rede, abrir `http://IP-DO-NOTEBOOK:3000` e entrar.

## Atualização

### 1. Publicar a versão nova (no computador de desenvolvimento)

Depois de testar as alterações na ramificação `main`:

```bash
git checkout producao
git merge main
git push
git checkout main
```

### 2. Atualizar o notebook

1. Abrir a pasta `C:\Ondebit` e dar dois cliques em `atualizar.bat`.
2. O script busca a versão nova no GitHub, faz um backup do banco, reconstrói o sistema e reinicia. Se não houver versão nova, ele avisa que já está atualizado.
3. Se a versão nova não iniciar, o próprio script volta para a versão anterior.
