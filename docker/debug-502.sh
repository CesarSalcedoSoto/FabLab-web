#!/bin/bash
# Script de diagnóstico para error 502 Bad Gateway
# Ejecutar: bash debug-502.sh

echo "============================================"
echo "FabLab - Diagnóstico 502 Bad Gateway"
echo "============================================"
echo ""

echo "1. Verificando estado de contenedores..."
echo ""
docker ps -a | grep -E "fablab-web|fablab-postgres"
echo ""

if ! docker ps | grep -q fablab-web; then
    echo "❌ El contenedor fablab-web NO está corriendo"
    echo ""
    echo "Verificando si existe pero está detenido:"
    docker ps -a | grep fablab-web
    echo ""
else
    echo "✓ El contenedor fablab-web está corriendo"
    echo ""
fi

echo "2. Verificando puerto 9011..."
echo ""
if netstat -tuln | grep -q ":9011"; then
    echo "✓ Puerto 9011 está escuchando"
    netstat -tuln | grep :9011
else
    echo "❌ Puerto 9011 NO está escuchando"
fi
echo ""

echo "3. Probando conexión directa al contenedor..."
echo ""
if curl -s http://127.0.0.1:9011 > /dev/null 2>&1; then
    echo "✓ La aplicación responde en http://127.0.0.1:9011"
else
    echo "❌ La aplicación NO responde en http://127.0.0.1:9011"
fi
echo ""

echo "4. Verificando logs del contenedor web (últimas 30 líneas)..."
echo ""
docker compose -f /root/FabLab-web/docker/docker-compose.web.yml logs --tail=30 web
echo ""

echo "5. Verificando Nginx..."
echo ""
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx está corriendo"
else
    echo "❌ Nginx NO está corriendo"
    echo "Iniciando Nginx..."
    systemctl start nginx
fi
echo ""

echo "6. Verificando configuración de Nginx..."
nginx -t
echo ""

echo "7. Verificando logs de Nginx (últimas 10 líneas)..."
echo ""
tail -n 10 /var/log/nginx/fablab-error.log 2>/dev/null || echo "No hay logs de error aún"
echo ""

echo "============================================"
echo "Resumen de Comandos Útiles:"
echo "============================================"
echo ""
echo "Ver logs en vivo:"
echo "  docker compose -f /root/FabLab-web/docker/docker-compose.web.yml logs -f web"
echo ""
echo "Reiniciar contenedor:"
echo "  cd /root/FabLab-web/docker"
echo "  docker compose -f docker-compose.web.yml restart web"
echo ""
echo "Reconstruir contenedor:"
echo "  cd /root/FabLab-web/docker"
echo "  docker compose -f docker-compose.web.yml down"
echo "  docker compose -f docker-compose.web.yml up -d --build"
echo ""
echo "Ver estado de contenedores:"
echo "  docker ps -a"
echo ""
echo "Entrar al contenedor:"
echo "  docker exec -it fablab-web sh"
echo ""
echo "Verificar .env:"
echo "  cat /root/FabLab-web/.env"
echo ""
