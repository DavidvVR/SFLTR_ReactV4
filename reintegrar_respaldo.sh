#!/usr/bin/env bash
set -euo pipefail

# === Configuración ===
# Carpeta origen: la carpeta actual donde estás trabajando hoy
SRC="$(pwd)"

# Volumen externo (DVR) y carpeta de backups
BACKUP_ROOT="/Volumes/DVR/respaldos_sfltr"
TS="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/SFLTR_ReactV4_${TS}"

# (Opcional) Datos para la reintegración (Opción 2)
REMOTE_URL="${REMOTE_URL:-git@github.com:DavidvVR/SFLTR_ReactV4.git}"
DEST="${DEST:-$HOME/SFLTR_ReactV4_git}"  # Carpeta destino para clonar el repo con historial

# Excluye cosas pesadas o que no necesitas en el backup
RSYNC_EXCLUDES=(
  "--exclude=.git"
  "--exclude=node_modules"
  "--exclude=.next"
  "--exclude=dist"
  "--exclude=build"
  "--exclude=.DS_Store"
)

msg() { echo -e "\033[1;32m[OK]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err() { echo -e "\033[1;31m[ERR]\033[0m $*"; }

check_dvr() {
  if [[ ! -d "/Volumes/DVR" ]]; then
    err "No se encuentra montado /Volumes/DVR. Conecta el disco externo y vuelve a intentar."
    exit 1
  fi
}

do_backup() {
  check_dvr
  mkdir -p "$BACKUP_DIR"
  msg "Copiando respaldo seguro a: $BACKUP_DIR"
  rsync -av "${RSYNC_EXCLUDES[@]}" "$SRC"/ "$BACKUP_DIR"/
  msg "Creando snapshot comprimido (tar.gz) inmutable del respaldo..."
  (cd "$BACKUP_ROOT" && tar -czf "SFLTR_ReactV4_${TS}.tar.gz" "SFLTR_ReactV4_${TS}")
  msg "Respaldo COMPLETADO."
  echo "Ruta de carpeta: $BACKUP_DIR"
  echo "Archivo .tar.gz: ${BACKUP_ROOT}/SFLTR_ReactV4_${TS}.tar.gz"
}

do_reintegrate() {
  # Clona el repo con historial y encima copia lo de hoy (sin .git)
  if [[ -d "$DEST/.git" ]]; then
    warn "DEST ya existe con .git: $DEST"
  else
    msg "Clonando repo con historial en: $DEST"
    git clone "$REMOTE_URL" "$DEST"
  fi

  msg "Copiando tus archivos de hoy encima del repo clonado (sin .git)..."
  rsync -av --exclude=".git" "$SRC"/ "$DEST"/

  cd "$DEST"
  msg "Mostrando cambios..."
  git status

  # Commit y push
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  msg "Agregando y commiteando cambios en rama: $BRANCH"
  git add .
  git commit -m "Avance del día $(date +%Y-%m-%d) (reintegrado desde respaldo)"

  msg "Haciendo push a origin/$BRANCH"
  git push origin "$BRANCH"

  msg "Reintegración COMPLETADA."
}

usage() {
  cat <<EOF
Uso:
  $(basename "$0") [--backup-only] [--with-reintegrate]

Sin banderas: hace SOLO el respaldo en DVR (recomendado primero).

Opciones:
  --backup-only       Solo realiza el respaldo en /Volumes/DVR (carpeta + tar.gz).
  --with-reintegrate  Después del respaldo, clona el repo remoto y sobrepone los archivos del día.
                      Variables opcionales:
                        REMOTE_URL (por defecto: $REMOTE_URL)
                        DEST (por defecto: $DEST)
Ejemplos:
  $(basename "$0") --backup-only
  REMOTE_URL=git@github.com:DavidvVR/SFLTR_ReactV4.git DEST=~/SFLTR_ReactV4_git $(basename "$0") --with-reintegrate
EOF
}

main() {
  local OP="${1:-}"
  case "$OP" in
    ""|"--backup-only")
      do_backup
      ;;
    "--with-reintegrate")
      do_backup
      do_reintegrate
      ;;
    "-h"|"--help")
      usage
      ;;
    *)
      err "Opción no reconocida: $OP"
      usage
      exit 1
      ;;
  esac
}

main "${1:-}"
