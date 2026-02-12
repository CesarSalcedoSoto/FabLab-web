#!/bin/bash
# Script de configuración de PostgreSQL para FabLab
# Ejecutar en el servidor VPS: sudo bash setup-postgres.sh

set -e

DB_NAME="fablab_production"
DB_USER="fablab"
POSTGRES_VERSION=$(psql --version 2>/dev/null | grep -oP '\d+' | head -1)

echo "============================================"
echo "FabLab - Configuración PostgreSQL Local"
echo "============================================"
echo ""

# Verificar que se ejecuta como root
if [[ $EUID -ne 0 ]]; then
   echo "⚠️  Este script necesita permisos de sudo"
   echo "Ejecuta: sudo bash setup-postgres.sh"
   exit 1
fi

# Verificar si PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "📦 PostgreSQL no está instalado. Instalando..."
    apt update
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    echo "✓ PostgreSQL instalado"
else
    echo "✓ PostgreSQL ya está instalado (versión $(psql --version | grep -oP '\d+\.\d+'))"
fi

echo ""
echo "🔐 Configurando base de datos y usuario..."
echo ""

# Solicitar password
read -sp "Ingresa un password seguro para el usuario 'fablab': " DB_PASSWORD
echo ""
read -sp "Confirma el password: " DB_PASSWORD_CONFIRM
echo ""

if [ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ]; then
    echo "❌ Los passwords no coinciden"
    exit 1
fi

if [ ${#DB_PASSWORD} -lt 8 ]; then
    echo "❌ El password debe tener al menos 8 caracteres"
    exit 1
fi

echo ""
echo "Creando base de datos y usuario..."

# Crear base de datos y usuario
sudo -u postgres psql << EOF
-- Drop si existe (para re-ejecutar)
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;

-- Crear usuario
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Crear base de datos
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Conectar a la base de datos y dar permisos
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER SCHEMA public OWNER TO $DB_USER;

-- Mostrar confirmación
\l $DB_NAME
EOF

echo ""
echo "✓ Base de datos '$DB_NAME' creada"
echo "✓ Usuario '$DB_USER' creado"
echo ""

# Configurar acceso desde Docker
echo "🔧 Configurando acceso desde Docker..."

PG_HBA_FILE=$(sudo -u postgres psql -t -P format=unaligned -c 'SHOW hba_file')
PG_CONF_FILE=$(sudo -u postgres psql -t -P format=unaligned -c 'SHOW config_file')

echo "Archivo de configuración: $PG_CONF_FILE"
echo "Archivo de autenticación: $PG_HBA_FILE"

# Backup de configuraciones
cp "$PG_HBA_FILE" "$PG_HBA_FILE.backup.$(date +%Y%m%d)"
cp "$PG_CONF_FILE" "$PG_CONF_FILE.backup.$(date +%Y%m%d)"

# Agregar regla en pg_hba.conf si no existe
if ! grep -q "host.*$DB_NAME.*$DB_USER.*172.16.0.0/12" "$PG_HBA_FILE"; then
    echo "" >> "$PG_HBA_FILE"
    echo "# FabLab Docker access" >> "$PG_HBA_FILE"
    echo "host    $DB_NAME    $DB_USER    172.16.0.0/12    md5" >> "$PG_HBA_FILE"
    echo "✓ Regla de acceso agregada a pg_hba.conf"
else
    echo "✓ Regla de acceso ya existe en pg_hba.conf"
fi

# Configurar listen_addresses
if ! grep -q "listen_addresses.*172.17.0.1" "$PG_CONF_FILE"; then
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost,172.17.0.1'/" "$PG_CONF_FILE"
    sed -i "s/listen_addresses = 'localhost'/listen_addresses = 'localhost,172.17.0.1'/" "$PG_CONF_FILE"
    echo "✓ listen_addresses configurado"
else
    echo "✓ listen_addresses ya configurado"
fi

# Reiniciar PostgreSQL
echo ""
echo "🔄 Reiniciando PostgreSQL..."
systemctl restart postgresql
sleep 2

if systemctl is-active --quiet postgresql; then
    echo "✓ PostgreSQL reiniciado correctamente"
else
    echo "❌ Error al reiniciar PostgreSQL"
    exit 1
fi

# Obtener IP del gateway Docker
DOCKER_GATEWAY=$(ip addr show docker0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1)
if [ -z "$DOCKER_GATEWAY" ]; then
    DOCKER_GATEWAY="172.17.0.1"
fi

echo ""
echo "============================================"
echo "✅ Configuración completada!"
echo "============================================"
echo ""
echo "📝 Información de conexión:"
echo ""
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Password: ********"
echo "Host (desde Docker): $DOCKER_GATEWAY"
echo "Port: 5432"
echo ""
echo "🔗 DATABASE_URL para Docker:"
echo ""
echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DOCKER_GATEWAY:5432/$DB_NAME"
echo ""
echo "============================================"
echo ""
echo "Próximos pasos:"
echo "1. Crea el archivo .env en /root/FabLab-web/.env con esta DATABASE_URL"
echo "2. Ejecuta: chmod 600 /root/FabLab-web/.env"
echo "3. Despliega: cd /root/FabLab-web/docker && docker compose -f docker-compose.web.yml up -d --build"
echo ""
echo "Para probar la conexión:"
echo "  psql -h $DOCKER_GATEWAY -U $DB_USER -d $DB_NAME"
echo ""
