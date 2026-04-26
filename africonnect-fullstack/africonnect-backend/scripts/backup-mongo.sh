#!/usr/bin/env bash
# Sauvegarde MongoDB (bêta / prod). À lancer par cron, ex. :
# 0 3 * * * /chemin/vers/backup-mongo.sh >> /var/log/africonnect-backup.log 2>&1
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_ROOT="$(cd "$DIR/.." && pwd)"
# Dépôt fullstack = parent de africonnect-backend
REPO_ROOT="$(cd "$DIR/../.." && pwd)"
if [[ -f "$BACKEND_ROOT/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$BACKEND_ROOT/.env" 2>/dev/null || true
  set +a
fi
: "${MONGODB_URI:?Définir MONGODB_URI (ou africonnect-backend/.env)}"
OUT="${BACKUP_DIR:-$REPO_ROOT/backups}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
FN="$OUT/mongo-dump-$TS"
mkdir -p "$OUT"
echo "[backup] Démarrage -> $FN"
# mongodump (MongoDB tools)
if ! command -v mongodump &>/dev/null; then
  echo "[backup] Installez les MongoDB Database Tools (mongodump) sur le serveur."
  exit 1
fi
mongodump --uri="$MONGODB_URI" --archive="$FN.archive" --gzip
echo "[backup] OK $FN.archive (conservez hors du serveur, chiffrez en transit)."
