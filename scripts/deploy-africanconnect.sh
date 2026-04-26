#!/usr/bin/env bash
# Déploiement African Connect (VPS : Nginx + PM2 + Node)
# Prérequis : définir DEPLOY_WEBROOT = même chemin que la directive `root` de Nginx pour ce site.
#
# Exemple :
#   export DEPLOY_WEBROOT=/var/www/africanconnect/html
#   chmod +x scripts/deploy-africanconnect.sh
#   ./scripts/deploy-africanconnect.sh
#
# Trouver la racine Nginx pour ce domaine :
#   sudo nginx -T 2>/dev/null | grep -E 'server_name|^\s*root\s+'
#
set -euo pipefail

REPO="${DEPLOY_REPO:-/var/www/africonnect}"
BE="${REPO}/africonnect-fullstack/africonnect-backend"
FE="${REPO}/africonnect-fullstack/africonnect-frontend"
PM2_NAME="${DEPLOY_PM2_NAME:-africanconnect-api}"

if [[ -z "${DEPLOY_WEBROOT:-}" ]]; then
  echo "Erreur: exportez DEPLOY_WEBROOT (répertoire des fichiers statiques servis par Nginx)."
  echo "Exemple: export DEPLOY_WEBROOT=/chemin/vers/la/racine/site"
  exit 1
fi

if [[ ! -d "$BE" ]] || [[ ! -d "$FE" ]]; then
  echo "Chemins introuvables. DEPLOY_REPO=$REPO"
  exit 1
fi

# Toujours aligner le serveur sur origin/main avant build (évite de déployer un vieux code si pull oublié)
if [[ -z "${DEPLOY_SKIP_GIT_PULL:-}" ]] && [[ -d "${REPO}/.git" ]]; then
  echo "==> Git pull (définir DEPLOY_SKIP_GIT_PULL=1 pour ignorer)"
  cd "$REPO"
  git pull origin main
fi

OUT=""
if [[ -d "${FE}/dist/africonnect/browser" ]]; then
  OUT="${FE}/dist/africonnect/browser"
elif [[ -d "${FE}/dist/africonnect" ]]; then
  OUT="${FE}/dist/africonnect"
else
  OUT=""
fi

echo "==> Backend deps + restart"
cd "$BE"
npm install --production
pm2 restart "$PM2_NAME"

echo "==> Frontend deps + build"
cd "$FE"
export CI=true
# Évite le prompt interactif sur les analytics Google au premier `ng build` sur le serveur
npm install
npx ng build

if [[ -d "${FE}/dist/africonnect/browser" ]]; then
  OUT="${FE}/dist/africonnect/browser"
elif [[ -d "${FE}/dist/africonnect" ]]; then
  OUT="${FE}/dist/africonnect"
else
  echo "Build introuvable sous ${FE}/dist/africonnect"
  exit 1
fi

echo "==> Publish frontend -> ${DEPLOY_WEBROOT}"
mkdir -p "$DEPLOY_WEBROOT"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "${OUT}/" "${DEPLOY_WEBROOT}/"
else
  echo "rsync absent: copie avec cp (anciens fichiers orphelins non supprimés)"
  cp -a "${OUT}/." "${DEPLOY_WEBROOT}/"
fi

if command -v restorecon >/dev/null 2>&1; then
  echo "==> SELinux relabel"
  restorecon -Rv "$DEPLOY_WEBROOT" 2>/dev/null || true
fi

echo "==> Nginx check + reload"
nginx -t
systemctl reload nginx

echo "✅ Deploy terminé"
