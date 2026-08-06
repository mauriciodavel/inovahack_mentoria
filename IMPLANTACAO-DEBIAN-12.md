# Implantação no Debian 12.1

Este guia instala o **InovaHack Mentoria** em um único servidor Debian 12.1, com:

- frontend React/Vite servido pelo Nginx;
- API Node.js e Socket.IO executados pelo `systemd`;
- MariaDB no mesmo servidor, acessível somente localmente;
- HTTPS com Let's Encrypt;
- firewall, backup, atualização e diagnóstico.

Repositório: <https://github.com/mauriciodavel/inovahack_mentoria.git>

> Os comandos assumem um usuário com acesso a `sudo`, um domínio apontado para o IP do servidor e arquitetura `amd64` ou `arm64`. Substitua `mentoria.exemplo.com`, e-mail, senhas e demais valores de exemplo.

## 1. Arquitetura final

```text
Internet -> Nginx :80/:443 -> arquivos estáticos em /opt/inovahack_mentoria/dist
                         |-> /api e /socket.io -> Node :3000
                                                    |-> MariaDB 127.0.0.1:3306
```

As portas `3000` e `3306` não devem ser abertas na Internet. O frontend usa o mesmo domínio da API, portanto não é necessário definir `VITE_API_URL` no build de produção.

## 2. Pré-requisitos e DNS

Crie no provedor DNS um registro `A` (e `AAAA`, se usar IPv6):

```text
mentoria.exemplo.com -> IP_PUBLICO_DO_SERVIDOR
```

Confirme no seu computador:

```bash
dig +short mentoria.exemplo.com
```

No servidor, atualize o sistema e instale os pacotes básicos:

```bash
sudo apt update
sudo apt full-upgrade -y
sudo apt install -y git curl ca-certificates gnupg nginx mariadb-server ufw
sudo systemctl enable --now nginx mariadb
```

O Debian 12 fornece MariaDB 10.11 como implementação MySQL. O projeto usa `mysql2` e seu esquema é compatível com essa instalação.

## 3. Instalar Node.js 22

O projeto usa Vite 8, que exige Node.js `20.19+` ou `22.12+`. A versão do Node nos repositórios originais do Debian 12 é antiga para esse build. Instale a linha 22 LTS pelo repositório NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
  | sudo gpg --dearmor -o /usr/share/keyrings/nodesource.gpg

echo "deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
  | sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null

sudo apt update
sudo apt install -y nodejs
node --version
npm --version
```

O `node --version` deve mostrar ao menos `v22.12.0`.

## 4. Criar usuário e clonar o Git

Crie uma conta de serviço sem login interativo e clone diretamente a branch `main`:

```bash
sudo adduser --system --group --home /opt/inovahack_mentoria inovahack
sudo -u inovahack git clone --branch main --single-branch \
  https://github.com/mauriciodavel/inovahack_mentoria.git \
  /opt/inovahack_mentoria

cd /opt/inovahack_mentoria
git remote -v
```

O clone por HTTPS funciona sem credenciais enquanto o repositório for público. Se ele se tornar privado, configure uma deploy key somente de leitura e use a URL SSH.

## 5. Preparar o banco de dados local

Proteja a instalação e remova recursos de teste quando solicitado:

```bash
sudo mariadb-secure-installation
```

Gere uma senha forte para a conta da aplicação:

```bash
openssl rand -base64 36
```

Entre no MariaDB:

```bash
sudo mariadb
```

Execute, trocando `COLE_A_SENHA_FORTE_AQUI`:

```sql
CREATE DATABASE acompanhamento_lab
  CHARACTER SET utf8
  COLLATE utf8_general_ci;

CREATE USER 'inovahack'@'localhost'
  IDENTIFIED BY 'COLE_A_SENHA_FORTE_AQUI';

GRANT ALL PRIVILEGES ON acompanhamento_lab.* TO 'inovahack'@'localhost';
GRANT CREATE ON *.* TO 'inovahack'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

O privilégio global `CREATE` é necessário porque `server/db.js` sempre executa `CREATE DATABASE IF NOT EXISTS` ao iniciar. Os demais privilégios ficam limitados ao banco da aplicação.

### Atenção à carga inicial

Crie o banco vazio **antes da primeira inicialização**, como acima. Quando o banco já existe, a aplicação cria as tabelas e ignora a seção “Carga real extraída do SQLite” de `server/mysql-schema.sql`. Se a aplicação criar o próprio banco, essa carga real será importada.

O esquema também cria um professor inicial com senha em texto simples. Após o primeiro acesso, altere essa senha imediatamente. Antes de usar dados reais, recomenda-se ainda evoluir a aplicação para armazenar hashes de senha (Argon2 ou bcrypt), pois atualmente as senhas são comparadas e armazenadas em texto simples.

## 6. Configurar os segredos

Gere o segredo JWT:

```bash
openssl rand -hex 64
```

Crie `/opt/inovahack_mentoria/server/.env`:

```bash
sudo -u inovahack nano /opt/inovahack_mentoria/server/.env
```

Conteúdo:

```dotenv
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=inovahack
DB_PASSWORD=COLE_A_SENHA_DO_BANCO
DB_NAME=acompanhamento_lab
JWT_SECRET=COLE_O_SEGREDO_JWT
```

Proteja o arquivo:

```bash
sudo chown inovahack:inovahack /opt/inovahack_mentoria/server/.env
sudo chmod 600 /opt/inovahack_mentoria/server/.env
```

Não coloque esse arquivo no Git. O `.gitignore` do projeto já ignora `.env` e `.env.*`.

## 7. Instalar dependências e compilar

Há dois projetos npm: o frontend na raiz e o backend em `server`.

```bash
cd /opt/inovahack_mentoria
sudo -u inovahack npm ci
sudo -u inovahack npm run build

cd /opt/inovahack_mentoria/server
sudo -u inovahack npm ci --omit=dev
test -d ../dist && echo "Build criado com sucesso"
```

> `server/server.js` importa `cors`, mas ele não está declarado diretamente em `server/package.json`; hoje o lockfile o instala como dependência transitiva. Para tornar a implantação robusta, adicione `cors` às dependências do backend em uma futura revisão do projeto.

## 8. Criar o serviço systemd

Crie `/etc/systemd/system/inovahack.service`:

```bash
sudo nano /etc/systemd/system/inovahack.service
```

Conteúdo:

```ini
[Unit]
Description=InovaHack Mentoria - API e Socket.IO
After=network-online.target mariadb.service
Wants=network-online.target
Requires=mariadb.service

[Service]
Type=simple
User=inovahack
Group=inovahack
WorkingDirectory=/opt/inovahack_mentoria
EnvironmentFile=/opt/inovahack_mentoria/server/.env
ExecStart=/usr/bin/node /opt/inovahack_mentoria/server/server.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=20
KillSignal=SIGTERM
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

Ative e confira:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now inovahack
sudo systemctl status inovahack --no-pager
curl -I http://127.0.0.1:3000/
```

Na primeira execução, a aplicação inicializa as tabelas automaticamente. Veja erros com:

```bash
sudo journalctl -u inovahack -n 100 --no-pager
```

## 9. Configurar Nginx

Crie `/etc/nginx/sites-available/inovahack`:

```bash
sudo nano /etc/nginx/sites-available/inovahack
```

Conteúdo, substituindo o domínio:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name mentoria.exemplo.com;

    root /opt/inovahack_mentoria/dist;
    index index.html;

    client_max_body_size 5m;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;
        proxy_buffering off;
    }

    location /assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Ative o site:

```bash
sudo ln -s /etc/nginx/sites-available/inovahack /etc/nginx/sites-enabled/inovahack
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
curl -I http://mentoria.exemplo.com
```

O fallback para `index.html` é necessário para as rotas do React Router. Os cabeçalhos `Upgrade` e `Connection` mantêm o Socket.IO/WebSocket funcionando pelo proxy.

## 10. Firewall e HTTPS

Libere antes o SSH para não perder o acesso remoto:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

Não libere `3000/tcp` nem `3306/tcp`.

Instale o Certbot e emita o certificado depois que o DNS estiver resolvendo corretamente:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d mentoria.exemplo.com \
  --email administrador@exemplo.com --agree-tos --no-eff-email --redirect
sudo certbot renew --dry-run
```

Valide:

```bash
curl -I https://mentoria.exemplo.com
systemctl list-timers | grep certbot
```

## 11. Checklist pós-implantação

```bash
sudo systemctl is-active mariadb nginx inovahack
sudo ss -lntp | grep -E ':(80|443|3000|3306)\b'
sudo nginx -t
curl -I https://mentoria.exemplo.com
sudo journalctl -u inovahack -n 50 --no-pager
```

No navegador, confirme:

1. a tela de login abre por HTTPS;
2. login e troca da senha inicial funcionam;
3. as chamadas `/api` não retornam erro 502;
4. atualizações em tempo real funcionam entre duas sessões;
5. atualizar uma rota interna do frontend não retorna 404.

## 12. Atualizar a aplicação

Faça backup antes. Verifique também se não há alterações locais no servidor:

```bash
cd /opt/inovahack_mentoria
sudo -u inovahack git status --short
```

Se a saída estiver limpa:

```bash
sudo -u inovahack git pull --ff-only origin main
sudo -u inovahack npm ci
sudo -u inovahack npm run build
cd server
sudo -u inovahack npm ci --omit=dev
sudo systemctl restart inovahack
sudo systemctl reload nginx
sudo systemctl status inovahack --no-pager
```

O backend aplica seu esquema/migrações ao reiniciar. Não use `git reset --hard` no servidor; isso pode apagar ajustes ou arquivos não versionados.

## 13. Backup e restauração

Crie um diretório protegido:

```bash
sudo install -d -m 700 /var/backups/inovahack
```

### Script diário

Crie `/usr/local/sbin/backup-inovahack`:

```bash
sudo nano /usr/local/sbin/backup-inovahack
```

Conteúdo:

```bash
#!/bin/sh
set -eu

DEST=/var/backups/inovahack
STAMP=$(date +%F_%H-%M-%S)

mariadb-dump --single-transaction --routines --triggers acompanhamento_lab \
  | gzip > "$DEST/acompanhamento_lab_$STAMP.sql.gz"

find "$DEST" -type f -name 'acompanhamento_lab_*.sql.gz' -mtime +14 -delete
```

Como o script roda como `root`, a autenticação local por socket permite o dump sem gravar senha. Proteja e teste:

```bash
sudo chmod 700 /usr/local/sbin/backup-inovahack
sudo /usr/local/sbin/backup-inovahack
sudo ls -lh /var/backups/inovahack
```

Agende em `/etc/cron.d/backup-inovahack`:

```cron
15 2 * * * root /usr/local/sbin/backup-inovahack
```

Copie os backups regularmente para outro servidor ou armazenamento externo; um backup no mesmo disco não protege contra falha do servidor.

### Restaurar

Pare a aplicação, guarde o estado atual e restaure o arquivo escolhido:

```bash
sudo systemctl stop inovahack
sudo mariadb-dump --single-transaction acompanhamento_lab \
  | gzip > /var/backups/inovahack/antes_da_restauracao.sql.gz
gunzip -c /var/backups/inovahack/acompanhamento_lab_DATA_HORA.sql.gz \
  | sudo mariadb acompanhamento_lab
sudo systemctl start inovahack
```

## 14. Diagnóstico rápido

### Nginx retorna 502

```bash
sudo systemctl status inovahack --no-pager
sudo journalctl -u inovahack -n 100 --no-pager
curl -v http://127.0.0.1:3000/api/
```

### Erro de conexão ao banco

```bash
sudo systemctl status mariadb --no-pager
mariadb -u inovahack -p -h localhost acompanhamento_lab
sudo journalctl -u mariadb -n 100 --no-pager
```

Confira `DB_USER`, `DB_PASSWORD`, `DB_NAME` e as permissões do usuário.

### Frontend antigo após atualização

```bash
cd /opt/inovahack_mentoria
sudo -u inovahack npm run build
sudo nginx -t && sudo systemctl reload nginx
```

Depois faça uma recarga forçada no navegador. O `index.html` não recebe cache longo; os arquivos versionados em `/assets` recebem.

### Socket.IO desconecta

Confira o bloco `location /socket.io/`, os cabeçalhos de upgrade e os logs:

```bash
sudo tail -n 100 /var/log/nginx/error.log
sudo journalctl -u inovahack -f
```

## 15. Observações de segurança

- mantenha Debian, Nginx, MariaDB e Node atualizados;
- nunca exponha MariaDB à Internet; mantenha o bind local padrão;
- não versione `server/.env` nem reutilize o segredo JWT;
- troque imediatamente todas as credenciais iniciais/importadas;
- restrinja o acesso SSH a chaves e desative login remoto de `root` após validar sua chave;
- armazene cópias de backup criptografadas fora do servidor e teste restaurações;
- planeje a migração das senhas da aplicação de texto simples para hashes resistentes;
- revise a carga real existente em `server/mysql-schema.sql` antes de qualquer implantação.

## Referências

- [Requisitos de Node.js do Vite](https://vite.dev/guide/)
- [MariaDB no Debian](https://wiki.debian.org/Mariadb)
- [Proxy HTTP e WebSocket no Nginx](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Certbot para Nginx](https://certbot.eff.org/instructions?ws=nginx&os=debianbookworm)
- [Repositório NodeSource](https://github.com/nodesource/distributions)

