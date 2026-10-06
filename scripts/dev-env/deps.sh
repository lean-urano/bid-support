#!/usr/bin/env bash
# frontend / collector / リポジトリ直下 の node_modules を、中央ストアからのクローンで用意する。
# 使い方: bash scripts/dev-env/deps.sh <frontend|collector|root>
#   package-lock.json のhash + Nodeバージョン + OS/arch をキーに、~/.cache/bid-support/deps/<pkg>/<key>/ で
#   npm ci を1回だけ実行する。各worktreeへは clonefile(2) → cp -cR で node_modules を丸ごとクローンする。
#   どちらも使えないときは worktree で直接 npm ci する。symlink共有はしない(Next.js/Turbopackが落ちる)。
#   .deps-key マーカーが無い node_modules(手で入れたもの。mainのcheckout等)は触らない。
# 環境変数: BID_SUPPORT_CACHE_DIR(既定 ~/.cache/bid-support) / BID_SUPPORT_NPM / BID_SUPPORT_PYTHON / BID_SUPPORT_CP
set -euo pipefail

log() { echo "[bid-support-dev-env] $*" >&2; }
die() { log "エラー: $*"; exit 1; }

pkg="${1:-}"
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)
case "$pkg" in
  root) dir="$root" ;;
  frontend|collector) dir="$root/$pkg" ;;
  *) die "使い方: deps.sh <frontend|collector|root>" ;;
esac
npm_bin="${BID_SUPPORT_NPM:-npm}"
python_bin="${BID_SUPPORT_PYTHON:-python3}"
cp_bin="${BID_SUPPORT_CP:-cp}"
cache="${BID_SUPPORT_CACHE_DIR:-$HOME/.cache/bid-support}/deps/$pkg"
[ -f "$dir/package-lock.json" ] || die "$dir/package-lock.json が無い"

sha256() { if command -v shasum >/dev/null 2>&1; then shasum -a 256 | cut -d' ' -f1; else sha256sum | cut -d' ' -f1; fi; }

# frontend は Prisma Client が node_modules/.prisma に生成されるため、schemaもキーに含める。
schema="$dir/prisma/schema.prisma"
lock_hash=$({ cat "$dir/package-lock.json"; [ ! -f "$schema" ] || cat "$schema"; [ ! -f "$dir/.npmrc" ] || cat "$dir/.npmrc"; } | sha256 | cut -c1-16)
runtime_key="node$(node -p 'process.versions.node')-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m)"
key="$lock_hash-$runtime_key"
nm="$dir/node_modules"
marker="$nm/.deps-key"

if [ -d "$nm" ] && [ ! -f "$marker" ]; then
  log "$pkg: 手で入れた node_modules は触らない ($nm)"
  exit 0
fi
if [ -f "$marker" ] && [ "$(cat "$marker")" = "$key" ]; then
  log "$pkg: node_modules は最新 ($key)"
  exit 0
fi

clone_with_clonefile() {
  "$python_bin" -c '
import ctypes, sys
try:
    r = ctypes.CDLL(None, use_errno=True).clonefile(sys.argv[1].encode(), sys.argv[2].encode(), 0)
except Exception:
    r = -1
sys.exit(0 if r == 0 else 1)' "$1" "$2" >/dev/null 2>&1
}
# cp -c(clonefile)はmacOS(BSD cp)だけ。GNU cpの -c は別の意味なので、Linuxでは使わない。
clone_with_cp() { [ "$(uname -s)" = Darwin ] && "$cp_bin" -cR "$1" "$2" >/dev/null 2>&1; }

pick_clone_method() {
  local probe="$cache/.probe.$$"
  rm -rf "$probe"; mkdir -p "$probe/src"; echo probe > "$probe/src/f"
  if clone_with_clonefile "$probe/src" "$probe/dst-1"; then echo clonefile
  elif clone_with_cp "$probe/src" "$probe/dst-2"; then echo cp
  else echo none; fi
  rm -rf "$probe"
}

install_direct() {
  log "$pkg: npm ci (direct)"
  rm -rf "$nm"
  (cd "$dir" && "$npm_bin" ci)
  echo "$key" > "$marker"
}

ensure_store() {
  local entry="$cache/$key" stage
  [ ! -d "$entry/node_modules" ] || return 0
  stage="$cache/.stage-$key.$$"
  rm -rf "$stage"; mkdir -p "$stage"
  cp "$dir/package.json" "$dir/package-lock.json" "$stage/"
  [ ! -f "$dir/.npmrc" ] || cp "$dir/.npmrc" "$stage/"
  log "$pkg: npm ci (store $key)"
  (cd "$stage" && "$npm_bin" ci)
  if [ -f "$schema" ]; then
    # npm ci中にschemaがあると @prisma/client のpostinstall(generate)がengine取得と競合して落ちるため、npm ci後に生成する。
    mkdir -p "$stage/prisma"; cp "$schema" "$stage/prisma/schema.prisma"
    (cd "$stage" && "$npm_bin" exec --no -- prisma generate >&2)
  fi
  mv "$stage" "$entry"
}

# mkdirロック(同時実行を直列化)。保持プロセスが死んでいたら奪う。クローンが終わるまで保持し、pruneとの競合を避ける。
lock="$cache/.lock-$key"
release_lock() { rm -rf "$lock"; }
mkdir -p "$cache"
waited=0
until mkdir "$lock" 2>/dev/null; do
  holder=$(cat "$lock/pid" 2>/dev/null || true)
  if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then rm -rf "$lock"; continue; fi
  [ "$waited" -lt 600 ] || die "ロックを取得できない: $lock"
  sleep 1; waited=$((waited + 1))
done
trap release_lock EXIT
echo $$ > "$lock/pid"

if [ -f "$marker" ] && [ "$(cat "$marker")" = "$key" ]; then
  log "$pkg: node_modules は最新 ($key)"
  exit 0
fi

if [ -d "$cache/$key/node_modules" ]; then method=clonefile; else method=$(pick_clone_method); fi
if [ "$method" = none ]; then install_direct; exit 0; fi

ensure_store
tmp="$dir/.node_modules.tmp.$$"
rm -rf "$tmp"
if [ "$method" = clonefile ]; then clone_with_clonefile "$cache/$key/node_modules" "$tmp" || method=cp; fi
if [ "$method" = cp ]; then
  rm -rf "$tmp"
  clone_with_cp "$cache/$key/node_modules" "$tmp" || { rm -rf "$tmp"; install_direct; exit 0; }
fi
echo "$key" > "$tmp/.deps-key"
rm -rf "$nm"
mv "$tmp" "$nm"
log "$pkg: node_modules を store からクローン clone=$method ($key)"
