#!/bin/bash

# Script per il deployment dell'applicazione Orto-Protesi

echo "Inizializzazione del deployment..."

# Assicurati che le directory esistano
mkdir -p /app/ortoprotesi

# Copia i file nella directory dell'applicazione
echo "Copia dei file dell'applicazione..."
cp -r ./orto-protesi /app/ortoprotesi/
cp -r ./OrtoProtesiApi /app/ortoprotesi/
cp docker-compose.yml /app/ortoprotesi/
cp .env /app/ortoprotesi/

# Copia la configurazione Nginx
echo "Copia della configurazione Nginx..."
cp -r ./nginx /app/ortoprotesi/

# Vai alla directory dell'applicazione
cd /app/ortoprotesi

# Costruisci e avvia i container
echo "Costruzione e avvio dei container Docker..."
docker compose up -d

# Verifica lo stato dei container
echo "Verifica dello stato dei container..."
docker compose ps

echo "Deployment completato! L'applicazione è ora in esecuzione."