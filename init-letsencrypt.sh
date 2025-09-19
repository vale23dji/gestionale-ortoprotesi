#!/bin/bash

# Script per inizializzare i certificati Let's Encrypt per Orto-Protesi

domains=(orto-protesi.com www.orto-protesi.com api.orto-protesi.com)
email="alan.ahmad@gmail.com" # Cambia con l'email del cliente per ricevere avvisi sul certificato

# Directory per i dati di Let's Encrypt
data_path="/app/ortoprotesi/nginx/data/certbot"

echo "### Ottenimento certificati Let's Encrypt..."

# Installa certbot se non già installato
if ! [ -x "$(command -v certbot)" ]; then
  apt-get update
  apt-get install -y certbot
fi

# Ottieni i certificati usando certbot standalone
for domain in "${domains[@]}"; do
  echo "Richiesta certificato per $domain..."
  certbot certonly --standalone \
    --preferred-challenges http \
    --email $email \
    --agree-tos \
    --no-eff-email \
    -d $domain \
    --keep-until-expiring
  
  # Copia i certificati nella directory di nginx
  echo "Copia certificati per $domain nella directory nginx..."
  mkdir -p "$data_path/conf/live/$domain"
  cp -L /etc/letsencrypt/live/$domain/fullchain.pem "$data_path/conf/live/$domain/"
  cp -L /etc/letsencrypt/live/$domain/privkey.pem "$data_path/conf/live/$domain/"
done

# Configura il rinnovo automatico dei certificati
echo "### Configurazione del rinnovo automatico dei certificati..."
echo "0 3 * * * certbot renew --quiet && docker restart ortoprotesi-nginx" > /etc/cron.d/certbot-renew

echo "### Certificati SSL ottenuti e configurati con successo!"