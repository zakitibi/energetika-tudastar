#!/usr/bin/env bash
# =============================================================
# Energetika – napi magyar energetikai hírek (VPS, laptop nélkül)
# Claude Code headless módban generál, majd GitHubra pushol.
# Ütemezés: cron, H/Sze/P 07:00 (Europe/Budapest).
# =============================================================
set -euo pipefail

# --- Beállítások ---
REPO_DIR="${REPO_DIR:-$HOME/energetika-tudastar}"
BRANCH="${BRANCH:-main}"
LOG="${LOG:-$HOME/energetika-news.log}"

exec >>"$LOG" 2>&1
echo "===== $(date '+%F %T %Z') : hírgenerálás indul ====="

cd "$REPO_DIR"
git pull --rebase --quiet origin "$BRANCH" || true

TODAY="$(date +%F)"
MONTH_FILE="news/$(date +%Y-%m) News.md"

# --- A prompt (fájlba írva, hogy a hosszú szöveg ne törjön el) ---
PROMPT_FILE="$(mktemp)"
cat > "$PROMPT_FILE" <<PROMPT
Magyar energetikai hírfigyelő vagy. Feladat: a mai nap ($TODAY) legfontosabb
magyar – és Magyarországot érintő EU/globális – energetikai híreit összegyűjteni,
és hozzáadni a havi gyűjtőfájlhoz: "$MONTH_FILE".

SZABÁLYOK (kötelező):
- KIZÁRÓLAG webkereséssel dolgozz. Semmit ne találj ki: se számot, se szabályt,
  se piaci adatot, se céginformációt.
- Minden tételhez keress legalább 2 független forrást. Címkézd a megbízhatóságot:
  VERIFIED (2+ független forrás) / PARTIALLY VERIFIED (csak 1 forrás) /
  CONFLICTING (források ellentmondanak) / UNVERIFIED. Emellett ahol releváns:
  FACT / ASSUMPTION / OPINION / ESTIMATE.
- Forrás-preferencia: Tier-1 (MEKH, MAVIR, HUPX, FGSZ, MVM, Paks II, ENTSO-E,
  ACER, Eurostat, IEA, hivatalos közlemények) elsődleges; média (Portfolio,
  Világgazdaság, Index, Greenfo stb.) másodlagos, önmagában nem elég a VERIFIED-hez.
- Számoknál mindig: érték + mértékegység + dátum + forrás.

FÁJLKEZELÉS:
- Ha a "$MONTH_FILE" még nem létezik, hozd létre a havi fejléccel.
- A mai naphoz szúrj be egy szekciót a fájl TETEJÉRE (a fejléc után, a korábbi
  napok elé), pontosan ilyen formátumban:

## $TODAY (ellenőrzés 07:00 CEST)

### 1. <Cím>
- **Forrás:** <forrás(ok)> · *<CÍMKE>*
- <2-4 mondat, konkrét számokkal>
- **Link:** <URL, több forrásnál " · "-tal elválasztva>
- **Kulcsszavak:** <3-6 kulcsszó>

(Ha ma nincs érdemi magyar energetikai hír, írj rövid "nincs kiemelt fejlemény"
bejegyzést, ne találj ki híreket.)

FONTOS: csak a "$MONTH_FILE" fájlt módosítsd. A végén mentsd el.
PROMPT

# --- Claude Code headless futtatás (előfizetéses bejelentkezéssel) ---
# Megjegyzés: a pontos kapcsolókat ellenőrizd a telepített verzión: claude --help
claude -p "$(cat "$PROMPT_FILE")" \
  --allowedTools "Read,Write,Edit,WebSearch,WebFetch,Bash" \
  --permission-mode acceptEdits

rm -f "$PROMPT_FILE"

# --- Energetika.html Hírek-adatának frissítése a .md fájlokból ---
if [ -f "$REPO_DIR/vps/rebuild_news_html.js" ]; then
  node "$REPO_DIR/vps/rebuild_news_html.js" || echo "figyelem: rebuild_news_html.js hiba"
fi

# --- Commit + push, ha van változás ---
if ! git diff --quiet -- "$MONTH_FILE" 2>/dev/null || [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -q -m "Napi energetikai hírek: $TODAY"
  git push -q origin "$BRANCH"
  echo "OK: feltöltve GitHubra ($TODAY)"
else
  echo "Nincs változás ($TODAY)"
fi
echo "===== kész ====="
