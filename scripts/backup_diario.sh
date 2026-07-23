#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# backup_diario.sh  —  Respaldo diario de Decormimbre
#
# Uso:
#   bash scripts/backup_diario.sh
#
# Para programar con crontab (todos los días a las 2:00 AM):
#   crontab -e
#   0 2 * * * /ruta/absoluta/DecormimbreApp/scripts/backup_diario.sh >> /var/log/decormimbre_backup.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../decormimbre_backend"

echo "=== Respaldo Decormimbre — $(date '+%Y-%m-%d %H:%M:%S') ==="

# En macOS (Homebrew) asegura usar pg_dump v17 si está disponible
for PG_BIN in \
    "/opt/homebrew/opt/postgresql@17/bin" \
    "/opt/homebrew/opt/postgresql@16/bin" \
    "/usr/lib/postgresql/17/bin" \
    "/usr/lib/postgresql/16/bin"; do
    [ -x "$PG_BIN/pg_dump" ] && export PATH="$PG_BIN:$PATH" && break
done

cd "$BACKEND_DIR"

# Activa el entorno virtual si existe
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi

# Ejecuta el comando de respaldo (mantiene los últimos 30, ~un mes de diarios)
DJANGO_SETTINGS_MODULE=config.settings.production \
    python manage.py hacer_respaldo --mantener 30

echo "=== Respaldo completado ==="
