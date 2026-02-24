# FabLab Web - Arquitectura del Proyecto

## Visión General

Este proyecto usa **Next.js 15** con **Payload CMS 3.0** embebido para gestión de contenido.

## Estructura de Features

```
src/features/
├── cms/                    # 🔧 Configuración de Payload CMS
├── auth/                   # 🔐 Autenticación y sesiones
├── blog/                   # 📝 Blog y posts
├── projects/               # 🛠️ Proyectos del FabLab
├── landing/                # 🏠 Páginas públicas
├── inventory/              # 📦 Sistema de inventario
└── iot/                    # 🌐 Control de dispositivos IoT
```

## CMS (Payload)

**Ubicación:** `src/features/cms/`

Esta feature centraliza toda la configuración de Payload CMS. Lee el [README](src/features/cms/README.md) para detalles.

### Acceso al Panel Admin

- **URL:** `/cms`
- **Usuario inicial:** Se crea en el primer acceso
- **Roles:** admin, editor, author

### Colecciones Disponibles

| Colección | Descripción | Panel Admin |
|-----------|-------------|-------------|
| `users` | Usuarios del sistema | Configuración |
| `media` | Archivos multimedia | Contenido |
| `posts` | Posts del blog | Blog |
| `categories` | Categorías del blog | Blog |
| `team-members` | Miembros del equipo | Equipo |
| `projects` | Proyectos del FabLab | Proyectos |

### Globals

| Global | Descripción |
|--------|-------------|
| `equipo-page` | Configuración página de equipo |

## Flujo de Trabajo

### Agregar Nueva Colección

1. Crear archivo en `src/features/cms/infrastructure/payload/collections/`
2. Importar en `collections/index.ts`
3. Reiniciar servidor - Payload crea las tablas automáticamente

### Modificar Colección Existente

1. Editar archivo de colección
2. Si hay cambios estructurales (nuevo campo, eliminar campo):
   - En desarrollo: Payload sincroniza automáticamente
   - Si hay error: Eliminar tabla desde el panel o SQL

### Errores de Base de Datos

Si aparece error `Failed query: ...`:

```bash
# Conectar a PostgreSQL y eliminar tabla problemática
docker exec -i fablab-postgres psql -U fablab -d fablab_blog -c "DROP TABLE IF EXISTS nombre_tabla CASCADE;"
```

Luego reiniciar `npm run dev`.

## URLs del Proyecto

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page |
| `/equipo` | Página de equipo |
| `/proyectos` | Galería de proyectos |
| `/blog` | Blog |
| `/contacto` | Formulario de contacto |
| `/cms` | Panel admin de Payload |
| `/admin` | Dashboard administrativo custom |

## Variables de Entorno

```env
# Base de datos PostgreSQL
DATABASE_URL=postgres://fablab:fablab_secret_2024@localhost:9012/fablab_blog

# Payload CMS
PAYLOAD_SECRET=fablab-payload-secret-dev

# Producción
NEXT_PUBLIC_SERVER_URL=https://fablab.example.com
```

## Scripts Disponibles

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Build de producción
npm run start        # Iniciar producción
```

## Tecnologías

- **Frontend:** Next.js 15, React 19, TailwindCSS
- **CMS:** Payload CMS 3.0 (embebido)
- **Base de datos:** PostgreSQL
- **Editor:** Lexical (rich text)
- **Imágenes:** Sharp
