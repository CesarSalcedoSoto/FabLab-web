#!/bin/bash
# Script de despliegue rápido para FabLab Web
# Ejecutar en el servidor: bash quick-deploy.sh

set -e

echo "============================================"
echo "FabLab Web - Despliegue Rápido"
echo "============================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar archivo .env
if [ ! -f "../.env" ]; then
    echo -e "${RED}Error: No se encuentra el archivo .env${NC}"
    echo "Crea el archivo: cp ../.env.example ../.env && nano ../.env"
    exit 1
fi

echo -e "${YELLOW}1. Actualizando código desde Git...${NC}"
cd ..
git pull
cd docker

echo ""
echo -e "${YELLOW}2. Reconstruyendo y reiniciando contenedores...${NC}"
docker compose -f docker-compose.web.yml up -d --build

echo ""
echo -e "${YELLOW}3. Verificando estado...${NC}"
docker compose -f docker-compose.web.yml ps

echo ""
echo -e "${GREEN}✓ Despliegue completado!${NC}"
echo ""
echo "Ver logs en tiempo real:"
echo "  docker compose -f docker-compose.web.yml logs -f"
echo ""
