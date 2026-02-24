# Guía de Configuración del archivo .env

## 📋 Variables OBLIGATORIAS

### 1. DATABASE_URL (Base de datos PostgreSQL)
**Formato:** `postgresql://usuario:password@host:puerto/nombre_base_datos`

**Ejemplos:**
```bash
# Base de datos externa en otro servidor
DATABASE_URL=postgresql://fablab_user:MiPassword123@192.168.1.100:9012/fablab_production

# Base de datos en servicio cloud (ej: Render, Railway, Supabase)
DATABASE_URL=postgresql://user:pass@dpg-abc123.oregon-postgres.render.com:5432/fablab_db

# Con SSL requerido (algunos proveedores lo exigen)
DATABASE_URL=postgresql://user:pass@host:9012/dbname?sslmode=require
```

**Cómo obtenerla:**
- Si usas un proveedor (Render, Railway, Supabase): copia la "Connection String" desde el dashboard
- Si tienes tu propio PostgreSQL: usa tus credenciales de acceso
- **IMPORTANTE:** Asegúrate de que la IP del servidor web esté permitida en el firewall de la BD

---

### 2. PAYLOAD_SECRET (Seguridad del CMS)
**Qué es:** Clave secreta para cifrar tokens JWT y sesiones

**Cómo generarla:**
```bash
# En Linux/Mac/WSL
openssl rand -base64 32

# En PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Ejemplo de valor generado:**
```
PAYLOAD_SECRET=8vJ9kL2mN4pQ6rS8tU0vX2yZ4aB6cD8eF0gH2jK4lM6n=
```

---

### 3. NEXTAUTH_SECRET (Seguridad de autenticación)
**Qué es:** Clave secreta para NextAuth (sistema de autenticación)

**Cómo generarla:**
```bash
# Generar otro secreto diferente al PAYLOAD_SECRET
openssl rand -base64 32
```

**Ejemplo:**
```
NEXTAUTH_SECRET=1aB3cD5eF7gH9iJ0kL2mN4oP6qR8sT0uV2wX4yZ6aB8c=
```

---

### 4. NEXTAUTH_URL (URL de la aplicación)
**Qué es:** URL pública donde estará tu aplicación

**Formato:**
```bash
NEXTAUTH_URL=https://app.tudominio.com
```

**Ejemplos:**
```bash
# Producción con dominio
NEXTAUTH_URL=https://fablab.miescuela.edu

# Subdominio
NEXTAUTH_URL=https://app.fablab.com

# Desarrollo local (NO usar en producción)
NEXTAUTH_URL=http://localhost:3000
```

---

### 5. NEXT_PUBLIC_SERVER_URL (URL pública del servidor)
**Qué es:** URL base que usa el frontend para llamadas API

**Valor:** Generalmente igual a NEXTAUTH_URL
```bash
NEXT_PUBLIC_SERVER_URL=https://app.tudominio.com
```

---

## 🔧 Variables OPCIONALES (según tu setup)

### 6. NEXT_PUBLIC_VESSEL_API_URL
**Qué es:** URL de API externa de Vessel (si la usas)

```bash
# Si tienes este servicio
NEXT_PUBLIC_VESSEL_API_URL=https://api.vessel.tudominio.com

# Si NO lo usas, déjalo vacío
NEXT_PUBLIC_VESSEL_API_URL=
```

---

### 7. NEXT_PUBLIC_LARAVEL_URL
**Qué es:** URL de API Laravel (si la usas)

```bash
# Si tienes backend Laravel
NEXT_PUBLIC_LARAVEL_URL=https://api.tudominio.com

# Si NO lo usas, déjalo vacío
NEXT_PUBLIC_LARAVEL_URL=
```

---

### 8. NEXT_PUBLIC_STRAPI_URL
**Qué es:** URL de Strapi CMS (legacy, solo si migras desde Strapi)

```bash
# Si aún usas Strapi
NEXT_PUBLIC_STRAPI_URL=https://cms.tudominio.com

# Si NO lo usas, déjalo vacío
NEXT_PUBLIC_STRAPI_URL=
```

---

### 9. STRAPI_API_TOKEN
**Qué es:** Token de acceso a Strapi API

```bash
# Si usas Strapi, copia el token desde el dashboard de Strapi
STRAPI_API_TOKEN=abc123...

# Si NO lo usas, déjalo vacío
STRAPI_API_TOKEN=
```

---

## 📝 Ejemplo de .env Completo para PRODUCCIÓN

```bash
# ===============================================
# FabLab Web - Producción
# ===============================================

# BASE DE DATOS POSTGRESQL (Externa - Render)
DATABASE_URL=postgresql://fablab_user:XF8k9Lm2Pq4Rs6T@dpg-abc123.oregon-postgres.render.com:5432/fablab_production?sslmode=require

# SEGURIDAD
PAYLOAD_SECRET=8vJ9kL2mN4pQ6rS8tU0vX2yZ4aB6cD8eF0gH2jK4lM6n=
NEXTAUTH_SECRET=1aB3cD5eF7gH9iJ0kL2mN4oP6qR8sT0uV2wX4yZ6aB8c=

# URLS PÚBLICAS
NEXTAUTH_URL=https://fablab.miescuela.edu
NEXT_PUBLIC_SERVER_URL=https://fablab.miescuela.edu

# APIs EXTERNAS (opcional - vacío si no se usan)
NEXT_PUBLIC_VESSEL_API_URL=
NEXT_PUBLIC_LARAVEL_URL=
NEXT_PUBLIC_STRAPI_URL=
STRAPI_API_TOKEN=
```

---

## 🚀 Pasos para Configurar

### En el Servidor

1. **Copiar el archivo ejemplo:**
```bash
cd /opt/fablab-web
cp .env.example .env
```

2. **Editar el archivo:**
```bash
nano .env
```

3. **Generar secretos:**
```bash
# Generar PAYLOAD_SECRET
openssl rand -base64 32

# Generar NEXTAUTH_SECRET
openssl rand -base64 32
```

4. **Configurar variables:**
- Pega los secretos generados
- Cambia `app.tudominio.com` por tu dominio real
- Configura la URL de tu base de datos PostgreSQL

5. **Guardar:**
- En nano: `Ctrl + O` (guardar), `Enter`, `Ctrl + X` (salir)

6. **Verificar (opcional):**
```bash
cat .env | grep -E "DATABASE_URL|PAYLOAD_SECRET|NEXTAUTH_SECRET|NEXTAUTH_URL"
```

---

## ⚠️ Consideraciones de Seguridad

1. **NUNCA** subas el archivo `.env` a Git
2. Los secretos deben tener **al menos 32 caracteres**
3. Usa secretos **diferentes** para PAYLOAD_SECRET y NEXTAUTH_SECRET
4. En producción, usa **HTTPS** (no http://)
5. Mantén el archivo `.env` con permisos restrictivos:
```bash
chmod 600 .env
```

---

## ✅ Checklist de Validación

Antes de desplegar, verifica:

- [ ] `DATABASE_URL` apunta a una base de datos real y accesible
- [ ] `PAYLOAD_SECRET` tiene al menos 32 caracteres aleatorios
- [ ] `NEXTAUTH_SECRET` tiene al menos 32 caracteres (diferente a PAYLOAD_SECRET)
- [ ] `NEXTAUTH_URL` es la URL pública con HTTPS
- [ ] `NEXT_PUBLIC_SERVER_URL` coincide con NEXTAUTH_URL
- [ ] Las variables opcionales están vacías si no se usan
- [ ] El archivo .env NO está en Git (.gitignore lo debe excluir)

---

## 🆘 Problemas Comunes

### Error: "Cannot connect to database"
- Verifica que DATABASE_URL es correcta
- Asegura que la IP del servidor está permitida en el firewall de la BD
- Si usa SSL, agrega `?sslmode=require` al final de DATABASE_URL

### Error: "NEXTAUTH_SECRET must be provided"
- Verifica que NEXTAUTH_SECRET está configurado
- Debe tener al menos 32 caracteres

### Error: "PAYLOAD_SECRET is required"
- Verifica que PAYLOAD_SECRET está configurado
- Debe tener al menos 32 caracteres

### Las variables NEXT_PUBLIC_ no funcionan
- Estas variables se "queman" en el build del Docker
- Si las cambias, debes reconstruir: `docker compose build --no-cache`
