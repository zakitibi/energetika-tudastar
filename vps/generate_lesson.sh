#!/usr/bin/env bash
# =============================================================
# Energetika – on-demand LECKE generálása (VPS)
# Használat (pl. telefonról SSH-n keresztül):
#   ./vps/generate_lesson.sh "energiatőzsde és a HUPX működése"
# Eredmény: summary/lesson_XXX_<slug>.md, commitolva + pusholva.
# =============================================================
set -euo pipefail

# Mindig az alapértelmezett (előfizetéses) Claude-loginnal fussunk,
# ne örököljük más agent (pl. Marveen worker) CLAUDE_CONFIG_DIR-jét:
unset CLAUDE_CONFIG_DIR 2>/dev/null || true

REPO_DIR="${REPO_DIR:-$HOME/energetika-tudastar}"
BRANCH="${BRANCH:-main}"
LOG="${LOG:-$HOME/energetika-lesson.log}"

TOPIC="${*:-}"
if [ -z "$TOPIC" ]; then
  echo "Adj meg egy témát. Pl.: $0 \"energiatárolás Magyarországon\""
  exit 1
fi

exec >>"$LOG" 2>&1
echo "===== $(date '+%F %T %Z') : lecke '$TOPIC' ====="

cd "$REPO_DIR"
git pull --rebase --quiet origin "$BRANCH" || true
mkdir -p summary

# Sorszám a meglévő leckékből
NUM=$(printf "%03d" $(( $(ls summary/lesson_*.md 2>/dev/null | wc -l) + 1 )))
SLUG=$(echo "$TOPIC" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '_' | sed 's/_\+/_/g;s/^_//;s/_$//' | cut -c1-40)
OUT="summary/lesson_${NUM}_${SLUG}.md"

PROMPT_FILE="$(mktemp)"
cat > "$PROMPT_FILE" <<PROMPT
Energetikai mentor és szaktanár vagy. Készíts egy önálló, alapos LECKÉT erről a
témáról: "$TOPIC". A célközönség középhaladó, magyar energiapiaci fókusszal.

SZABÁLYOK:
- Webkereséssel ellenőrizd a tényeket; minden fontos állításhoz 2+ független
  forrás. Címke: VERIFIED / PARTIALLY VERIFIED / CONFLICTING / UNVERIFIED.
  Különítsd el: FACT / ASSUMPTION / OPINION / ESTIMATE.
- Számoknál: érték + mértékegység + dátum + forrás. Tier-1 forrásokat preferálj.

A lecke szerkezete (magyarul, Markdown):
1. Cím
2. Tanulási célok
3. Vezetői összefoglaló
4. Egyszerű magyarázat (analógiával)
5. Részletes magyarázat
6. Magyar vonatkozás (MAVIR/MEKH/MVM/HUPX/Paks stb. ahol releváns)
7. Európai / globális kontextus
8. Fontos számok (forrással)
9. Gyakori tévhitek
10. Kulcs-tanulságok
11. Fogalomtár
12. Rövid önellenőrző kérdések
13. Ellenőrzött források (linkekkel, dátummal)
14. Ajánlott következő téma

Az eredményt EBBE a fájlba írd: "$OUT". Csak ezt a fájlt hozd létre/módosítsd.
PROMPT

claude -p "$(cat "$PROMPT_FILE")" \
  --allowedTools "Read,Write,Edit,WebSearch,WebFetch,Bash" \
  --permission-mode acceptEdits

rm -f "$PROMPT_FILE"

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -q -m "Új lecke: $TOPIC ($OUT)"
  git push -q origin "$BRANCH"
  echo "OK: $OUT feltöltve"
else
  echo "Nem készült fájl – ellenőrizd a logot"
fi
echo "===== kész ====="
