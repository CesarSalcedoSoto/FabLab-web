#!/bin/bash
# Script de verificación para PostgreSQL en Docker
# Ejecutar: bash check-postgres.sh

echo "============================================"
echo "FabLab - Verificación PostgreSQL Docker"
echo "============================================"
echo ""

# Verificar que el contenedor PostgreSQL está corriendo
echo "1. Verificando contenedor PostgreSQL..."
if docker ps | grep -q fablab-postgres; then
    echo "✓ Contenedor fablab-postgres está corriendo"
    docker ps | grep fablab-postgres
else
    echo "❌ El contenedor fablab-postgres NO está corriendo"
    echo ""
    echo "Iniciando PostgreSQL..."
    cd /root/FabLab-web/docker
    docker compose -f docker-compose.postgres.yml up -d
    sleep 5
    
    if docker ps | grep -q fablab-postgres; then
        echo "✓ PostgreSQL iniciado correctamente"
    else
        echo "❌ Error al iniciar PostgreSQL"
        exit 1
    fi
fi

echo ""
echo "2. Verificando puerto 5432..."
if netstat -tuln | grep -q ":5432"; then
    echo "✓ Puerto 5432 está abierto"
else
    echo "⚠️  Puerto 5432 no está escuchando"
fi

echo ""
echo "3. Probando conexión a la base de datos..."
if docker exec fablab-postgres psql -U fablab -d fablab_blog -c "SELECT version();" > /dev/null 2>&1; then
    echo "✓ Conexión exitosa a la base de datos"
    echo ""
    echo "Información de la base de datos:"
    docker exec fablab-postgres psql -U fablab -d fablab_blog -c "SELECT version();"
else
    echo "❌ No se pudo conectar a la base de datos"
    echo "Verifica las credenciales en docker-compose.postgres.yml"
fi

echo ""
echo "4. Información de conexión:"
echo ""
echo "Host: 172.17.0.1 (desde contenedores Docker)"
echo "Port: 5432"
echo "Database: fablab_blog"
echo "User: fablab"
echo "Password: fablab_secret_2024"
echo ""
echo "DATABASE_URL:"
echo "postgresql://fablab:fablab_secret_2024@172.17.0.1:5432/fablab_blog"
echo ""
echo "============================================"
echo ""

# Verificar si existe el archivo .env
if [ -f "/root/FabLab-web/.env" ]; then
    echo "✓ Archivo .env existe"
    
    if grep -q "DATABASE_URL" /root/FabLab-web/.env; then
        echo "✓ DATABASE_URL está configurado en .env"
        echo ""
        echo "DATABASE_URL actual:"
        grep "DATABASE_URL" /root/FabLab-web/.env | grep -v "^#"
    else
        echo "⚠️  DATABASE_URL NO está configurado en .env"
    fi
else
    echo "❌ Archivo .env NO existe"
    echo ""
    echo "Crea el archivo .env con:"
    echo "  cd /root/FabLab-web"
    echo "  nano .env"
fi

echo ""
echo "Próximo paso:"
echo "  cd /root/FabLab-web/docker"
echo "  docker compose -f docker-compose.web.yml up -d --build"
echo ""
