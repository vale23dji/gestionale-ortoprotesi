# Stage 1: Build Angular
FROM node:20-alpine AS build

WORKDIR /app
ENV NG_CLI_ANALYTICS=false

# 1) Installa dipendenze in modo deterministico
#    (usa solo package*.json per sfruttare la cache)
COPY orto-protesi/package*.json ./
RUN npm ci --no-audit --no-fund

# 2) Copia il codice e build di produzione
COPY orto-protesi/ ./
RUN npm run build -- --configuration production

# Stage 2: Nginx (serve la SPA)
FROM nginx:alpine

# 3) Copia la build Angular
#    (se il nome progetto Angular cambia, aggiorna il path dist)
COPY --from=build /app/dist/orto-protesi /usr/share/nginx/html

# 4) Config Nginx con fallback SPA / caching / gzip (la tua)
COPY deploy/prod/conf.d/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
