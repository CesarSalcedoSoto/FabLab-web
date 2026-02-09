#!/bin/bash
# ==============================================
# PostgreSQL Init Script - Restore fablab_blog.dump
# ==============================================
# Este script se ejecuta SOLO en la primera inicialización
# de PostgreSQL (cuando el volumen está vacío).
# Se monta en /docker-entrypoint-initdb.d/

set -e

DUMP_FILE="/docker-entrypoint-initdb.d/dump/fablab_blog.dump"

echo "======================================"
echo " FabLab DB Init Script"
echo "======================================"

if [ -f "$DUMP_FILE" ]; then
    echo "[INFO] Dump encontrado: $DUMP_FILE"
    echo "[INFO] Restaurando base de datos fablab_blog..."
    
    # Detectar formato del dump (custom vs plain SQL)
    FILE_TYPE=$(file "$DUMP_FILE" 2>/dev/null || echo "unknown")
    
    if echo "$FILE_TYPE" | grep -q "PostgreSQL custom database dump"; then
        echo "[INFO] Formato: Custom (pg_restore)"
        pg_restore \
            --username="$POSTGRES_USER" \
            --dbname="$POSTGRES_DB" \
            --no-owner \
            --no-privileges \
            --verbose \
            "$DUMP_FILE" || {
                echo "[WARN] pg_restore terminó con advertencias (esto puede ser normal)"
            }
    else
        echo "[INFO] Formato: SQL plano (psql)"
        psql \
            --username="$POSTGRES_USER" \
            --dbname="$POSTGRES_DB" \
            -f "$DUMP_FILE" || {
                echo "[WARN] psql terminó con advertencias (esto puede ser normal)"
            }
    fi
    
    echo "[OK] Base de datos restaurada exitosamente."
else
    echo "[INFO] No se encontró dump en $DUMP_FILE"
    echo "[INFO] La base de datos se creará vacía."
    echo "[INFO] Payload CMS ejecutará las migraciones automáticamente."
fi

echo "======================================"
echo " Init completado"
echo "======================================"
