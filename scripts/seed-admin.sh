#!/bin/bash
#
# Script para crear usuario administrador por defecto en FabLab
# Ejecutar: chmod +x seed-admin.sh && ./seed-admin.sh
#
# Credenciales por defecto:
#   Email: admin@fablab.com
#   Password: Fablab2026
#

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@fablab.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Fablab2026}"
ADMIN_NAME="${ADMIN_NAME:-Administrador}"
SERVER_URL="${SERVER_URL:-http://localhost:3000}"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     FabLab - Seed Usuario Administrador        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar si curl está instalado
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl no está instalado${NC}"
    echo "Instalar con: sudo apt-get install curl"
    exit 1
fi

# Verificar si el servidor está corriendo
echo -e "${YELLOW}Verificando conexión con el servidor...${NC}"
if ! curl -s --head --fail "$SERVER_URL" > /dev/null 2>&1; then
    echo -e "${RED}Error: No se puede conectar a $SERVER_URL${NC}"
    echo "Asegúrate de que el servidor Next.js esté corriendo"
    echo "  cd web && npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Servidor disponible${NC}"
echo ""

# Crear usuario admin via API
echo -e "${YELLOW}Creando usuario administrador...${NC}"
echo "  Email:    $ADMIN_EMAIL"
echo "  Nombre:   $ADMIN_NAME"
echo ""

RESPONSE=$(curl -s -X POST "$SERVER_URL/api/seed-admin" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\", \"name\": \"$ADMIN_NAME\"}" \
    2>&1)

# Verificar respuesta
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ✓ Usuario administrador creado!            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BLUE}Email:${NC}    $ADMIN_EMAIL"
    echo -e "  ${BLUE}Password:${NC} $ADMIN_PASSWORD"
    echo ""
    echo -e "${YELLOW}⚠  Cambia la contraseña después del primer login!${NC}"
    echo ""
    echo -e "Accede al panel de administración en:"
    echo -e "  ${BLUE}$SERVER_URL/cms${NC}"
    echo ""
elif echo "$RESPONSE" | grep -q '"success":false'; then
    MESSAGE=$(echo "$RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    echo -e "${YELLOW}⚠  $MESSAGE${NC}"
    if echo "$RESPONSE" | grep -q 'existingUser'; then
        EXISTING=$(echo "$RESPONSE" | grep -o '"existingUser":"[^"]*"' | cut -d'"' -f4)
        echo -e "  Usuario existente: ${BLUE}$EXISTING${NC}"
    fi
    echo ""
else
    echo -e "${RED}Error en la respuesta del servidor:${NC}"
    echo "$RESPONSE"
    exit 1
fi

echo -e "${GREEN}Script completado.${NC}"
