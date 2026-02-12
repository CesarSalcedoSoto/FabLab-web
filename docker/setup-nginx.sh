#!/bin/bash
# Script de configuración de Nginx para FabLab Web
# Ejecutar con: sudo bash setup-nginx.sh

set -e

echo "==================================="
echo "FabLab Web - Configuración Nginx"
echo "==================================="
echo ""

# Verificar que se ejecuta como root
if [[ $EUID -ne 0 ]]; then
   echo "Error: Este script debe ejecutarse como root (usa sudo)"
   exit 1
fi

# Solicitar el dominio
read -p "Ingresa tu dominio (ej: app.tudominio.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "Error: El dominio no puede estar vacío"
    exit 1
fi

echo ""
echo "Configurando para el dominio: $DOMAIN"
echo ""

# Crear configuración de Nginx
echo "1. Creando configuración de Nginx..."
cat > /etc/nginx/sites-available/fablab << EOF
# Configuración Nginx para FabLab Web

# Redirección HTTP a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Permitir validación de Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirigir todo el tráfico a HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# Configuración HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/$DOMAIN/chain.pem;

    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/fablab-access.log;
    error_log /var/log/nginx/fablab-error.log;

    # Límites de carga
    client_max_body_size 50M;

    # Proxy a la aplicación Next.js en Docker
    location / {
        proxy_pass http://127.0.0.1:9011;
        proxy_http_version 1.1;

        # Headers esenciales
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;

        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Caché para archivos estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)\$ {
        proxy_pass http://127.0.0.1:9011;
        proxy_set_header Host \$host;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
    }
}
EOF

# Crear directorio para Let's Encrypt
echo "2. Creando directorio para certificados..."
mkdir -p /var/www/certbot

# Activar configuración
echo "3. Activando configuración de Nginx..."
ln -sf /etc/nginx/sites-available/fablab /etc/nginx/sites-enabled/

# Verificar configuración
echo "4. Verificando configuración..."
nginx -t

# Recargar Nginx
echo "5. Recargando Nginx..."
systemctl reload nginx

echo ""
echo "✓ Configuración completada!"
echo ""
echo "Próximos pasos:"
echo "1. Instalar certbot si no lo tienes:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo ""
echo "2. Obtener certificado SSL:"
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
echo "3. Verificar auto-renovación:"
echo "   sudo certbot renew --dry-run"
echo ""
echo "4. Levantar la aplicación Docker:"
echo "   cd ~/FabLab-web/docker"
echo "   docker compose -f docker-compose.web.yml up -d"
echo ""
echo "Logs de Nginx:"
echo "   sudo tail -f /var/log/nginx/fablab-access.log"
echo "   sudo tail -f /var/log/nginx/fablab-error.log"
echo ""
