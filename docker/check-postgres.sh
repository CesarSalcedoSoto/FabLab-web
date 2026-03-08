#!/bin/bash
# Script de verificación para PostgreSQL en Docker
# Ejecutar: bash check-postgres.sh

APP_ROOT="/opt/FabLab-web"
DB_CONTAINER="fablab-db"

echo "============================================"
echo "FabLab - Verificación PostgreSQL Docker"
echo "============================================"
echo ""

# Verificar que el contenedor PostgreSQL está corriendo
echo "1. Verificando contenedor PostgreSQL..."
if docker ps | grep -q "$DB_CONTAINER"; then
    echo "✓ Contenedor $DB_CONTAINER está corriendo"
    docker ps | grep "$DB_CONTAINER"
else
    echo "❌ El contenedor $DB_CONTAINER NO está corriendo"
    echo ""
    echo "Iniciando PostgreSQL..."
    cd "$APP_ROOT/docker"
    docker compose up -d db
    sleep 5
    
    if docker ps | grep -q "$DB_CONTAINER"; then
        echo "✓ PostgreSQL iniciado correctamente"
    else
        echo "❌ Error al iniciar PostgreSQL"
        exit 1
    fi
fi

echo ""
echo "2. Verificando puerto 9012..."
if netstat -tuln | grep -q ":9012"; then
    echo "✓ Puerto 9012 está abierto"
else
    echo "⚠️  Puerto 9012 no está escuchando"
fi

echo ""
echo "3. Probando conexión a la base de datos..."
if docker exec "$DB_CONTAINER" psql -U fablab -d fablab_blog -c "SELECT version();" > /dev/null 2>&1; then
    echo "✓ Conexión exitosa a la base de datos"
    echo ""
    echo "Información de la base de datos:"
    docker exec "$DB_CONTAINER" psql -U fablab -d fablab_blog -c "SELECT version();"
else
    echo "❌ No se pudo conectar a la base de datos"
    echo "Verifica las credenciales en docker/.env"
fi

echo ""
echo "4. Información de conexión:"
echo ""
echo "Host: 172.17.0.1 (desde contenedores Docker)"
echo "Port: 9012 (mapeado a 5432 interno del contenedor)"
echo "Database: fablab_blog"
echo "User: fablab"
echo "Password: fablab_secret_2024"
echo ""
echo "DATABASE_URL:"
echo "postgresql://fablab:fablab_secret_2024@172.17.0.1:9012/fablab_blog"
echo ""
echo "============================================"
echo ""

# Verificar si existe el archivo .env
if [ -f "$APP_ROOT/.env" ]; then
    echo "✓ Archivo .env existe"
    
    if grep -q "DATABASE_URL" "$APP_ROOT/.env"; then
        echo "✓ DATABASE_URL está configurado en .env"
        echo ""
        echo "DATABASE_URL actual:"
        grep "DATABASE_URL" "$APP_ROOT/.env" | grep -v "^#"
    else
        echo "⚠️  DATABASE_URL NO está configurado en .env"
    fi
else
    echo "❌ Archivo .env NO existe"
    echo ""
    echo "Crea el archivo .env con:"
    echo "  cd $APP_ROOT"
    echo "  nano .env"
fi

echo ""
echo "Próximo paso:"
echo "  cd $APP_ROOT/docker"
echo "  docker compose up -d --build web"
echo ""
