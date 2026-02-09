#!/bin/bash

# =====================================================
# Script de Despliegue para FabLab - Hostinger VPS
# =====================================================
# Uso: ./deploy.sh [web|db|all]
# Por defecto: all
#
# Primera vez:
#   chmod +x deploy.sh
#   ./deploy.sh
# =====================================================

SERVICE=${1:-all}

echo "🚀 FabLab Deploy - Hostinger VPS"
echo "================================"
echo "Servicio: $SERVICE"
echo ""

# Verificar que .env existe
if [ ! -f .env ]; then
    echo "❌ Error: No se encontró .env"
    echo "   Ejecuta: cp .env.example .env"
    echo "   Y configura tus valores reales"
    exit 1
fi

# 1. Obtener últimos cambios
echo "📥 Bajando código desde git..."
git pull origin main || { echo "❌ Error al bajar código"; exit 1; }

# 2. Desplegar según servicio
if [ "$SERVICE" == "web" ]; then
    echo "🏗️  Reconstruyendo WEB + Nginx..."
    docker compose up -d --build web nginx
elif [ "$SERVICE" == "db" ]; then
    echo "🏗️  Reiniciando PostgreSQL..."
    docker compose up -d postgres
else
    echo "🏗️  Reconstruyendo TODO..."
    docker compose up -d --build
fi

# 3. Limpieza
echo "🧹 Limpiando imágenes Docker antiguas..."
docker image prune -f

echo ""
echo "✅ Despliegue completado"
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
