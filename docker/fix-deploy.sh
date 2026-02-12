#!/bin/bash
# Script de limpieza y reinicio completo para FabLab Web
# Ejecutar: bash fix-deploy.sh

set -e

echo "============================================"
echo "FabLab - Limpieza y Reinicio Completo"
echo "============================================"
echo ""

cd /root/FabLab-web

# 1. Cargar variables de entorno
echo "1. Cargando variables de entorno..."
if [ ! -f .env ]; then
    echo "❌ ERROR: Archivo .env no existe en /root/FabLab-web/"
    exit 1
fi

# Exportar todas las variables
set -a
source .env
set +a

echo "✓ Variables cargadas"
echo ""

# 2. Detener TODOS los contenedores relacionados
echo "2. Deteniendo contenedores..."
docker stop fablab-web 2>/dev/null || true
docker stop fablab-postgres 2>/dev/null || true
docker stop fablab-nginx 2>/dev/null || true

# 3. Eliminar contenedores
echo "3. Eliminando contenedores..."
docker rm -f fablab-web 2>/dev/null || true
docker rm -f fablab-postgres 2>/dev/null || true
docker rm -f fablab-nginx 2>/dev/null || true

# 4. Verificar que el puerto 9011 está libre
echo "4. Liberando puerto 9011..."
PORT_PID=$(lsof -ti:9011 2>/dev/null || true)
if [ ! -z "$PORT_PID" ]; then
    echo "   Matando proceso $PORT_PID en puerto 9011"
    kill -9 $PORT_PID
fi

# Verificar
if lsof -i:9011 > /dev/null 2>&1; then
    echo "❌ ERROR: Puerto 9011 todavía está ocupado"
    lsof -i:9011
    exit 1
else
    echo "✓ Puerto 9011 libre"
fi
echo ""

# 5. Iniciar PostgreSQL
echo "5. Iniciando PostgreSQL..."
cd docker
docker compose -f docker-compose.postgres.yml up -d
cd ..

echo "   Esperando 5 segundos..."
sleep 5
echo ""

# 6. Iniciar aplicación web con variables explícitas
echo "6. Iniciando aplicación web..."
cd docker
docker compose -f docker-compose.web.yml \
    --env-file ../.env \
    up -d --remove-orphans
cd ..

echo ""
echo "7. Esperando que la aplicación inicie..."
sleep 10

# 8. Verificar estado
echo ""
echo "============================================"
echo "Estado del Despliegue"
echo "============================================"
echo ""

echo "Contenedores:"
docker ps | grep fablab

echo ""
echo "Puerto 9011:"
netstat -tuln | grep :9011 || echo "No está escuchando aún"

echo ""
echo "Últimos logs:"
cd docker
docker compose -f docker-compose.web.yml logs --tail=20 web

echo ""
echo "============================================"
echo "Comandos útiles:"
echo "============================================"
echo "Ver logs:    cd /root/FabLab-web/docker && docker compose -f docker-compose.web.yml logs -f web"
echo "Reiniciar:   cd /root/FabLab-web/docker && docker compose -f docker-compose.web.yml restart web"
echo "Estado:      docker ps"
echo "Probar app:  curl http://127.0.0.1:9011"
echo ""
