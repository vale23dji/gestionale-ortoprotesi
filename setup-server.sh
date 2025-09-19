#!/bin/bash

# Script di configurazione iniziale per il server DigitalOcean
echo "Inizializzazione del server per Orto-Protesi..."

# Aggiornamento del sistema
echo "Aggiornamento del sistema..."
apt update && apt upgrade -y

# Installazione di Docker e Docker Compose
echo "Installazione di Docker..."
apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt update
apt install -y docker-ce docker-compose-plugin

# Installazione di certbot per i certificati SSL
echo "Installazione di Certbot..."
apt install -y certbot

# Creazione delle directory necessarie
echo "Creazione delle directory di progetto..."
mkdir -p /app/ortoprotesi
mkdir -p /app/ortoprotesi/nginx/conf.d
mkdir -p /app/ortoprotesi/nginx/ssl
mkdir -p /app/ortoprotesi/nginx/data/certbot/conf
mkdir -p /app/ortoprotesi/nginx/data/certbot/www

# Configurazione di sicurezza di base
echo "Configurazione sicurezza di base..."
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Configurazione firewall
echo "Configurazione firewall..."
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

echo "Setup completato! Il server è pronto per il deployment."