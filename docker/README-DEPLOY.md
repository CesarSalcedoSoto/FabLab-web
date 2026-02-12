# FabLab Web - Archivos de Despliegue

Esta carpeta contiene los archivos necesarios para desplegar FabLab Web en producción.

## 📁 Archivos Disponibles

### Configuración Docker
- `docker-compose.web.yml` - Compose para la aplicación web (sin BD local)
- `docker-compose.postgres.yml` - Compose para PostgreSQL local
- `docker-compose.yml` - Compose completo (web + BD)

### Configuración Nginx
- `nginx-fablab.conf` - Configuración completa de Nginx con SSL
- `setup-nginx.sh` - Script automático de configuración de Nginx

### Scripts de Despliegue
- `quick-deploy.sh` - Despliegue rápido (pull + build + up)
- `deploy.sh` - Despliegue completo con verificaciones

## 🚀 Guía de Despliegue Rápido

### 1. Preparar el Servidor

```bash
# Instalar dependencias
sudo apt update
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Añadir usuario al grupo docker (opcional)
sudo usermod -aG docker $USER
```

### 2. Clonar el Repositorio

```bash
cd /opt
sudo git clone https://github.com/TU_USUARIO/fablab-web.git
cd fablab-web
sudo chown -R $USER:$USER .
```

### 3. Configurar Variables de Entorno

```bash
# Copiar ejemplo
cp .env.example .env

# Editar con tus valores
nano .env
```

**Variables críticas:**
```bash
DATABASE_URL=postgresql://usuario:password@host:5432/database
PAYLOAD_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://app.tudominio.com
NEXT_PUBLIC_SERVER_URL=https://app.tudominio.com
```

### 4. Configurar Nginx

**Opción A - Automático (Recomendado):**
```bash
cd docker
sudo bash setup-nginx.sh
```

**Opción B - Manual:**
```bash
# Copiar configuración
sudo cp docker/nginx-fablab.conf /etc/nginx/sites-available/fablab

# Editar dominio
sudo nano /etc/nginx/sites-available/fablab
# Reemplazar: app.tudominio.com con tu dominio

# Activar
sudo ln -s /etc/nginx/sites-available/fablab /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Obtener Certificado SSL

```bash
sudo certbot --nginx -d app.tudominio.com
```

### 6. Desplegar la Aplicación

**Primer despliegue:**
```bash
cd /opt/fablab-web/docker
docker compose -f docker-compose.web.yml up -d --build
```

**Actualizaciones posteriores:**
```bash
cd /opt/fablab-web/docker
bash quick-deploy.sh
```

### 7. Verificar

```bash
# Ver logs
docker compose -f docker-compose.web.yml logs -f

# Ver estado
docker compose -f docker-compose.web.yml ps

# Acceder a:
# https://app.tudominio.com
# https://app.tudominio.com/cms
```

## 🔧 Comandos Útiles

### Docker

```bash
# Ver logs en tiempo real
docker compose -f docker-compose.web.yml logs -f

# Reiniciar contenedor
docker compose -f docker-compose.web.yml restart

# Detener contenedores
docker compose -f docker-compose.web.yml down

# Reconstruir desde cero
docker compose -f docker-compose.web.yml build --no-cache
docker compose -f docker-compose.web.yml up -d

# Ver estadísticas de recursos
docker stats

# Entrar al contenedor
docker compose -f docker-compose.web.yml exec web sh
```

### Nginx

```bash
# Verificar configuración
sudo nginx -t

# Recargar configuración
sudo systemctl reload nginx

# Ver logs
sudo tail -f /var/log/nginx/fablab-access.log
sudo tail -f /var/log/nginx/fablab-error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

### SSL (Certbot)

```bash
# Renovar certificados
sudo certbot renew

# Probar renovación
sudo certbot renew --dry-run

# Ver certificados instalados
sudo certbot certificates
```

## 🔄 Actualizar la Aplicación

```bash
cd /opt/fablab-web
git pull
cd docker
bash quick-deploy.sh
```

## 🐛 Solución de Problemas

### La aplicación no inicia

```bash
# Ver logs detallados
docker compose -f docker-compose.web.yml logs -f web

# Verificar variables de entorno
docker compose -f docker-compose.web.yml config

# Reconstruir contenedor
docker compose -f docker-compose.web.yml down
docker compose -f docker-compose.web.yml build --no-cache
docker compose -f docker-compose.web.yml up -d
```

### Error de conexión a base de datos

```bash
# Verificar que DATABASE_URL es correcto
cat ../.env | grep DATABASE_URL

# Probar conexión desde el servidor
psql "postgresql://usuario:password@host:5432/database"

# Verificar firewall de la BD externa
# Asegurar que la IP del servidor está permitida
```

### Nginx muestra 502 Bad Gateway

```bash
# Verificar que el contenedor está corriendo
docker compose -f docker-compose.web.yml ps

# Verificar puerto
curl http://127.0.0.1:9011

# Ver logs de Nginx
sudo tail -f /var/log/nginx/fablab-error.log
```

### Problemas con SSL

```bash
# Verificar certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# Regenerar certificado
sudo certbot delete -d app.tudominio.com
sudo certbot --nginx -d app.tudominio.com
```

## 📊 Monitoreo

### Ver uso de recursos

```bash
# Recursos del contenedor
docker stats fablab-web

# Espacio en disco
df -h
docker system df
```

### Limpieza

```bash
# Limpiar imágenes no usadas
docker image prune -a

# Limpiar todo (cuidado!)
docker system prune -a
```

## 🔐 Seguridad

### Firewall

```bash
# Permitir solo puertos necesarios
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### Actualizaciones

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Actualizar Docker
sudo apt install --only-upgrade docker.io docker-compose
```

## 📝 Notas

- El contenedor escucha en `127.0.0.1:9011` (solo localhost)
- Nginx hace de proxy reverso y maneja SSL
- Los archivos subidos se almacenan en el volumen `web-media`
- La base de datos debe ser externa (no incluida en este compose)

## 🆘 Soporte

Para más información, consulta:
- [Documentación del Proyecto](../README.md)
- [Guía de Deploy](DEPLOY.md)
