# Implantação no Debian 12.1 para rede local

Este guia implanta o **InovaHack Mentoria** em um servidor Debian 12.1 acessível somente pela rede local. Inicialmente, os clientes abrem:

```text
http://IP_DO_SERVIDOR:5173
```

O frontend será compilado pelo Vite, mas servido pelo Nginx na porta `5173`. O servidor de desenvolvimento do Vite não será mantido em produção. API, Socket.IO e MariaDB ficam restritos ao próprio servidor.

Repositório: <https://github.com/mauriciodavel/inovahack_mentoria.git>

Ao final há um complemento para HTTPS local com Certbot e as limitações de certificados para endereços privados.

## 1. Arquitetura

```text
Clientes da LAN -> http://IP_DO_SERVIDOR:5173 -> Nginx
                                                   |-> frontend em dist/
                                                   |-> /api -> Node 127.0.0.1:3000
                                                   |-> /socket.io -> Node 127.0.0.1:3000
                                                                      |-> MariaDB local
```

Somente a porta `5173` precisa ser acessível pelos clientes. Não abra as portas `3000` e `3306` na rede.

## 2. Definir um IP fixo

O servidor deve ter IP fixo ou reserva DHCP. Neste documento será usado como exemplo:

```text
IP do servidor: 192.168.1.50
Rede local:      192.168.1.0/24
Interface:       enp1s0
```

Descubra os valores reais:

```bash
ip -br address
ip route
hostname -I
```

Prefira criar uma reserva DHCP no roteador associando o MAC do servidor ao IP escolhido. Isso evita conflitos e dispensa alterar a configuração de rede do Debian.

Teste de outro computador da rede:

```bash
ping 192.168.1.50
```

## 3. Instalar os pacotes

No servidor:

```bash
sudo apt update
sudo apt full-upgrade -y
sudo apt install -y git curl ca-certificates gnupg nginx mariadb-server ufw
sudo systemctl enable --now nginx mariadb
```

### Instalar Node.js 22

O Vite 8 do projeto exige Node.js `20.19+` ou `22.12+`. Instale Node.js 22:

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

O Node deve ser pelo menos `v22.12.0`.

## 4. Clonar o repositório

```bash
sudo adduser --system --group --home /opt/inovahack_mentoria inovahack
sudo -u inovahack git clone --branch main --single-branch \
  https://github.com/mauriciodavel/inovahack_mentoria.git \
  /opt/inovahack_mentoria

cd /opt/inovahack_mentoria
git remote -v
```

## 5. Configurar o MariaDB local

```bash
sudo mariadb-secure-installation
openssl rand -base64 36
sudo mariadb
```

No console do MariaDB, substitua a senha:

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

O privilégio `CREATE` é necessário porque `server/db.js` executa `CREATE DATABASE IF NOT EXISTS` ao iniciar.

> Crie o banco vazio antes de iniciar a aplicação. Assim, a aplicação cria as tabelas, mas não importa automaticamente a seção de dados reais presente em `server/mysql-schema.sql`. Revise esse arquivo e troque imediatamente as credenciais iniciais. Atualmente o projeto armazena senhas em texto simples; não use senhas reutilizadas em outros sistemas.

Garanta que o MariaDB escute somente localmente:

```bash
sudo ss -lntp | grep 3306
sudo mariadb -e "SHOW VARIABLES LIKE 'bind_address';"
```

O resultado deve indicar `127.0.0.1`, `localhost` ou ausência de exposição em interfaces externas.

## 6. Criar o arquivo de ambiente

Gere o JWT:

```bash
openssl rand -hex 64
```

Crie o arquivo:

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

Proteja-o:

```bash
sudo chown inovahack:inovahack /opt/inovahack_mentoria/server/.env
sudo chmod 600 /opt/inovahack_mentoria/server/.env
```

## 7. Compilar para `IP:5173`

O código do frontend precisa conhecer sua origem pública. Crie um ambiente de produção local, substituindo o IP:

```bash
sudo -u inovahack nano /opt/inovahack_mentoria/.env.production.local
```

Conteúdo:

```dotenv
VITE_API_URL=http://192.168.1.50:5173
```

Instale e compile:

```bash
cd /opt/inovahack_mentoria
sudo -u inovahack npm ci
sudo -u inovahack npm run build

cd /opt/inovahack_mentoria/server
sudo -u inovahack npm ci --omit=dev
test -f /opt/inovahack_mentoria/dist/index.html \
  && echo "Frontend compilado com sucesso"
```

O arquivo `.env.production.local` é ignorado pelo Git. Se o IP mudar, atualize o arquivo e execute novamente `npm run build`.

## 8. Criar o serviço Node

Crie `/etc/systemd/system/inovahack.service`:

```bash
sudo nano /etc/systemd/system/inovahack.service
```

Conteúdo:

```ini
[Unit]
Description=InovaHack Mentoria - API local e Socket.IO
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

Ative:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now inovahack
sudo systemctl status inovahack --no-pager
curl -I http://127.0.0.1:3000/
```

## 9. Configurar Nginx em HTTP na porta 5173

Crie `/etc/nginx/sites-available/inovahack-local`:

```bash
sudo nano /etc/nginx/sites-available/inovahack-local
```

Use esta configuração:

```nginx
server {
    listen 5173;
    listen [::]:5173;
    server_name _;

    root /opt/inovahack_mentoria/dist;
    index index.html;
    client_max_body_size 5m;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
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
        proxy_set_header Host $http_host;
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
sudo ln -s /etc/nginx/sites-available/inovahack-local \
  /etc/nginx/sites-enabled/inovahack-local
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
curl -I http://127.0.0.1:5173
```

## 10. Restringir o firewall à rede local

Substitua `192.168.1.0/24` pela sua rede. Libere SSH antes de habilitar o firewall:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.1.0/24 to any port 22 proto tcp comment 'SSH rede local'
sudo ufw allow from 192.168.1.0/24 to any port 5173 proto tcp comment 'InovaHack rede local'
sudo ufw enable
sudo ufw status numbered
```

Não crie regras para `3000` ou `3306`. Se o SSH vier por VPN ou por outra sub-rede administrativa, adicione a regra correspondente antes de ativar o UFW.

Para uma máquina de outra rede ou VLAN alcançar o sistema, o roteador precisa permitir o tráfego até `192.168.1.50:5173`; isso deve ser decidido pela administração da rede.

## 11. Testar pelos clientes

Em um computador conectado à LAN, abra:

```text
http://192.168.1.50:5173
```

Valide no servidor:

```bash
sudo systemctl is-active mariadb inovahack nginx
sudo ss -lntp | grep -E ':(5173|3000|3306)\b'
sudo journalctl -u inovahack -n 50 --no-pager
sudo tail -n 50 /var/log/nginx/error.log
```

Confirme login, API e atualizações em tempo real entre dois navegadores.

## 12. Atualizar a aplicação

```bash
cd /opt/inovahack_mentoria
sudo -u inovahack git status --short
sudo -u inovahack git pull --ff-only origin main
sudo -u inovahack npm ci
sudo -u inovahack npm run build
cd server
sudo -u inovahack npm ci --omit=dev
sudo systemctl restart inovahack
sudo systemctl reload nginx
sudo systemctl status inovahack --no-pager
```

Confirme que `.env.production.local` continua contendo o endereço correto antes do build.

---

# Complemento: HTTPS somente na rede local

## 13. Escolher a modalidade de certificado

Há duas situações diferentes:

### Opção A — domínio real com Certbot (recomendada)

Use um domínio que você controla, por exemplo `mentoria.seudominio.com.br`. O servidor continua totalmente privado. A validação será `DNS-01`, feita por uma entrada TXT no DNS público, e o DNS interno fará o nome apontar para `192.168.1.50`.

Os clientes acessarão:

```text
https://mentoria.seudominio.com.br:5173
```

Não acessarão por `https://192.168.1.50:5173`, pois o certificado do domínio não corresponde ao IP.

### Opção B — HTTPS pelo próprio IP privado

Certificados públicos para IP passaram a existir no Let's Encrypt em 2026, porém exigem Certbot 5.4+, duram pouco mais de seis dias e a autoridade precisa validar o IP. Um endereço privado RFC 1918, como `192.168.x.x`, `10.x.x.x` ou `172.16-31.x.x`, não é globalmente roteável e não pode ser validado pelo Let's Encrypt.

Para continuar acessando exatamente `https://192.168.1.50:5173`, use uma CA interna, como `step-ca`, ou um certificado próprio distribuído como confiável em todos os clientes. Isso não é feito pelo Certbot público e exige instalar a CA raiz nos computadores e celulares.

As próximas etapas usam a opção A.

## 14. Criar resolução DNS interna

No DNS do roteador, Pi-hole, AdGuard Home, Windows DNS ou BIND interno, crie:

```text
mentoria.seudominio.com.br -> 192.168.1.50
```

Não é necessário publicar o IP privado em um registro `A` público. Entretanto, a zona pública precisa existir e permitir a criação do TXT de validação.

Teste em um cliente:

```bash
nslookup mentoria.seudominio.com.br
```

O resultado, dentro da rede, deve ser `192.168.1.50`.

## 15. Instalar Certbot atualizado

O Certbot do Debian pode ser usado para certificado de domínio via DNS-01:

```bash
sudo apt update
sudo apt install -y certbot
certbot --version
```

Não é preciso abrir as portas 80 ou 443, pois a validação será pelo DNS.

## 16. Emitir com DNS-01 manual

Execute, substituindo domínio e e-mail:

```bash
sudo certbot certonly --manual --preferred-challenges dns \
  -d mentoria.seudominio.com.br \
  --email administrador@seudominio.com.br \
  --agree-tos --no-eff-email
```

O Certbot mostrará um valor. No provedor que hospeda o DNS público, crie o registro solicitado:

```text
Tipo:  TXT
Nome:  _acme-challenge.mentoria.seudominio.com.br
Valor: VALOR_FORNECIDO_PELO_CERTBOT
```

Antes de continuar no Certbot, confirme a propagação usando um resolvedor público:

```bash
dig TXT _acme-challenge.mentoria.seudominio.com.br @1.1.1.1
dig TXT _acme-challenge.mentoria.seudominio.com.br @8.8.8.8
```

Depois pressione Enter no Certbot. Os arquivos serão criados em:

```text
/etc/letsencrypt/live/mentoria.seudominio.com.br/fullchain.pem
/etc/letsencrypt/live/mentoria.seudominio.com.br/privkey.pem
```

> A validação manual não renova automaticamente. Para renovação sem intervenção, instale o plugin DNS específico do seu provedor e use uma credencial de API restrita apenas à edição do TXT `_acme-challenge`. Consulte `certbot plugins` e a documentação do seu provedor.

## 17. Recompilar o frontend para HTTPS

Edite:

```bash
sudo -u inovahack nano /opt/inovahack_mentoria/.env.production.local
```

Altere para:

```dotenv
VITE_API_URL=https://mentoria.seudominio.com.br:5173
```

Compile novamente:

```bash
cd /opt/inovahack_mentoria
sudo -u inovahack npm run build
```

Essa etapa evita conteúdo misto e garante que API e Socket.IO usem TLS no mesmo endereço.

## 18. Trocar o Nginx para HTTPS na porta 5173

Edite `/etc/nginx/sites-available/inovahack-local`. No início do bloco `server`, substitua as diretivas `listen` e `server_name` por:

```nginx
server {
    listen 5173 ssl;
    listen [::]:5173 ssl;
    server_name mentoria.seudominio.com.br;

    ssl_certificate /etc/letsencrypt/live/mentoria.seudominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mentoria.seudominio.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # mantenha aqui root, index, /api, /socket.io, /assets e location /
}
```

Todo o restante do bloco HTTP anterior deve permanecer dentro desse `server`. Valide e recarregue:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -I --resolve mentoria.seudominio.com.br:5173:127.0.0.1 \
  https://mentoria.seudominio.com.br:5173
```

Agora os clientes devem abrir:

```text
https://mentoria.seudominio.com.br:5173
```

O endereço HTTP na porta 5173 deixa de funcionar depois dessa troca. Não é possível atender HTTP e HTTPS simultaneamente na mesma combinação de IP e porta.

## 19. Renovação

Com a emissão DNS manual, repita o comando da seção 16 antes do vencimento e recarregue o Nginx:

```bash
sudo certbot certificates
sudo certbot certonly --manual --preferred-challenges dns \
  -d mentoria.seudominio.com.br
sudo nginx -t
sudo systemctl reload nginx
```

Se configurar um plugin DNS automatizado, teste:

```bash
sudo certbot renew --dry-run
```

Adicione um deploy hook para o Nginx após renovações bem-sucedidas:

```bash
sudo install -d /etc/letsencrypt/renewal-hooks/deploy
sudo nano /etc/letsencrypt/renewal-hooks/deploy/reload-nginx
```

Conteúdo:

```sh
#!/bin/sh
systemctl reload nginx
```

```bash
sudo chmod 755 /etc/letsencrypt/renewal-hooks/deploy/reload-nginx
```

## 20. Checklist HTTPS local

- o nome interno resolve para o IP privado correto;
- o certificado contém exatamente o nome usado no navegador;
- `VITE_API_URL` usa `https`, o domínio e a porta `5173`;
- apenas a rede local tem permissão no UFW;
- as portas 80, 443, 3000 e 3306 continuam fechadas para clientes;
- login, API e Socket.IO funcionam sem alertas de certificado ou conteúdo misto;
- existe um procedimento de renovação testado.

## Referências

- [Requisitos do Vite](https://vite.dev/guide/)
- [Certificados para IP e Certbot 5.4+](https://letsencrypt.org/2026/03/11/shorter-certs-certbot.html)
- [Certificados de IP do Let's Encrypt](https://letsencrypt.org/2026/01/15/6day-and-ip-general-availability.html)
- [Certbot: validação DNS manual e renovação](https://eff-certbot.readthedocs.io/en/stable/using.html)
- [Proxy WebSocket no Nginx](https://nginx.org/en/docs/http/websocket.html)

