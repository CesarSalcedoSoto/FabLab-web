#!/bin/bash
# Script de despliegue para FabLab Los Angeles
# Ejecutar en el servidor: bash deploy-fablab.sh

set -e

DOMAIN="fablablosangeles.com"
PROJECT_DIR="/opt/fablab-web"
REPO_URL="https://github.com/TU_USUARIO/fablab-web.git"

echo "============================================"
echo "FabLab Los Angeles - Despliegue Inicial"
echo "Dominio: $DOMAIN"
echo "============================================"
echo ""

# Verificar que se ejecuta como root o con sudo
if [[ $EUID -ne 0 ]]; then
   echo "⚠️  Este script necesita permisos de sudo"
   echo "Ejecuta: sudo bash deploy-fablab.sh"
   exit 1
fi

echo "📦 1. Instalando dependencias..."
apt update
apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git

echo ""
echo "🚀 2. Configurando Docker..."
systemctl start docker
systemctl enable docker

echo ""
echo "📥 3. Clonando repositorio..."
if [ -d "$PROJECT_DIR" ]; then
    echo "El directorio $PROJECT_DIR ya existe. ¿Actualizar? (s/n)"
    read -r response
    if [[ "$response" =~ ^[Ss]$ ]]; then
        cd $PROJECT_DIR
        git pull
    fi
else
    cd /opt
    git clone $REPO_URL
    cd fablab-web
fi

echo ""
echo "⚙️  4. Configurando variables de entorno..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cp $PROJECT_DIR/.env.fablablosangeles $PROJECT_DIR/.env
    echo ""
    echo "⚠️  IMPORTANTE: Edita el archivo .env antes de continuar"
    echo ""
    echo "Genera los secretos con estos comandos:"
    echo "  openssl rand -base64 32  # Para PAYLOAD_SECRET"
    echo "  openssl rand -base64 32  # Para NEXTAUTH_SECRET"
    echo ""
    echo "Luego edita: nano $PROJECT_DIR/.env"
    echo ""
    read -p "Presiona ENTER cuando hayas configurado el .env..."
    nano $PROJECT_DIR/.env
    chmod 600 $PROJECT_DIR/.env
else
    echo "✓ Archivo .env ya existe"
fi

echo ""
echo "🌐 5. Configurando Nginx..."
cd $PROJECT_DIR/docker
bash setup-nginx.sh

echo ""
echo "🔒 6. Configurando SSL con Let's Encrypt..."
echo "Presiona ENTER para obtener certificado SSL para $DOMAIN"
read -p ""
certbot --nginx -d $DOMAIN

echo ""
echo "🐳 7. Desplegando aplicación Docker..."
cd $PROJECT_DIR/docker
docker compose -f docker-compose.web.yml up -d --build

echo ""
echo "⏳ Esperando que la aplicación esté lista..."
sleep 15

echo ""
echo "============================================"
echo "✅ ¡Despliegue completado!"
echo "============================================"
echo ""
echo "🌍 Tu sitio está disponible en:"
echo "   https://$DOMAIN"
echo "   https://$DOMAIN/cms"
echo ""
echo "📊 Comandos útiles:"
echo "   Ver logs:     cd $PROJECT_DIR/docker && docker compose -f docker-compose.web.yml logs -f"
echo "   Reiniciar:    cd $PROJECT_DIR/docker && docker compose -f docker-compose.web.yml restart"
echo "   Estado:       cd $PROJECT_DIR/docker && docker compose -f docker-compose.web.yml ps"
echo "   Actualizar:   cd $PROJECT_DIR/docker && bash quick-deploy.sh"
echo ""
echo "🔐 No olvides:"
echo "   - Crear tu primer usuario admin en: https://$DOMAIN/cms"
echo "   - Verificar logs: docker compose -f docker-compose.web.yml logs -f"
echo ""
