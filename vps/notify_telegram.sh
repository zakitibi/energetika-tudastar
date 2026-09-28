#!/usr/bin/env bash
# =============================================================
# Energetika – Telegram-értesítés a hírgenerálás végén.
#   notify_telegram.sh success   (energetika-news.service, ExecStartPost=)
#   notify_telegram.sh failure   (energetika-news-failure.service, OnFailure=)
# Env (/etc/energetika-tudastar/.env): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, LOG.
# Csak sendMessage: getUpdates-et soha, mert a botot más folyamat pollozza.
# Az értesítés hibája nem buktatja a futást: mindig 0-val lép ki.
# =============================================================
set -uo pipefail

MODE="${1:-}"
PAGES_URL="https://zakitibi.github.io/energetika-tudastar/Energetika.html"
LOG="${LOG:-}"

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID:-}" ]]; then
  echo "notify_telegram: nincs TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID, értesítés kihagyva" >&2
  exit 0
fi

# A legutóbbi futás naplórésze (az utolsó "hírgenerálás indul" sortól).
last_run() {
  [[ -n "$LOG" && -r "$LOG" ]] || return 0
  awk '/: hírgenerálás indul =====/{buf=""} {buf=buf $0 "\n"} END{printf "%s", buf}' "$LOG"
}

case "$MODE" in
  success)
    status="$(last_run | grep -E '^(OK: feltöltve GitHubra|Nincs változás)' | tail -1)"
    text="Energetika hírek – $(date +%F)
${status:-lefutott}
${PAGES_URL}"
    ;;
  failure)
    tail_lines="$(last_run | grep -v '^\s*$' | tail -5)"
    text="⚠️ Energetika hírgenerálás HIBA ($(date '+%F %H:%M'))
${tail_lines:-nincs naplósor}
Log: ${LOG:-journalctl --user -u energetika-news}"
    ;;
  *)
    echo "Használat: $0 success|failure" >&2
    exit 0
    ;;
esac

# A token ne kerüljön a parancssorba (ps): az URL-t a curl stdin-en kapja.
if ! printf 'url = "https://api.telegram.org/bot%s/sendMessage"\n' "$TELEGRAM_BOT_TOKEN" \
  | curl -sS --fail --max-time 20 -o /dev/null -K - \
      --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
      --data-urlencode "text=${text:0:3500}"; then
  echo "notify_telegram: a küldés nem sikerült ($MODE)" >&2
fi
exit 0
