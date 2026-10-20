---
name: energetika-hirek-task
description: Az energetikai hírgenerálás ütemezett futása a VPS-en (systemd user timer, H/Sze/P 09:00), a futás ellenőrzése és a hibák kezelése. Akkor használd, ha egy futás eredményét kell megnézni, vagy egy elmaradt futást kell pótolni.
---
# Energetika hírek – ütemezett futás

## Hogyan fut
- A VPS-en a `energetika-news.timer` (systemd **user** unit) H/Sze/P 09:00-kor (Europe/Budapest)
  indítja az `energetika-news.service`-t, ami a `vps/generate_news.sh`-t futtatja.
- A unitfájlok forrása a repóban: `vps/systemd/`. Telepítve: `~/.config/systemd/user/`.
- A kód a `/srv/energetika-tudastar` checkoutban van, a log a `/var/log/energetika-tudastar/news.log`-ban.
- Env: `/etc/energetika-tudastar/.env` (`LOG`, `CLAUDE_CODE_OAUTH_TOKEN`, Telegram-beállítások).
  Secret a repóba nem kerül.
- Telegram-értesítés: sikeres futás után a `vps/notify_telegram.sh` rövid üzenetet küld a Pages-linkkel,
  hibánál az `energetika-news-failure.service` (`OnFailure=`) hibaüzenetet. Csak `sendMessage`,
  `getUpdates` soha (más folyamat pollozza ugyanazt a botot).
- A chatbe csak a link és egy státuszsor megy, a hírek tartalma nem: azt a page-en kell olvasni.

## Ellenőrzés
```bash
systemctl --user list-timers energetika-news.timer
systemctl --user status energetika-news.service
tail -30 /var/log/energetika-tudastar/news.log
git -C /srv/energetika-tudastar log --oneline -3
```
Sikeres futás: a log végén `OK: feltöltve GitHubra (DÁTUM)` vagy `Nincs változás (DÁTUM)`, utána `===== kész =====`.

## Kézi futtatás / pótlás
```bash
systemctl --user start energetika-news.service   # a unit env-jével, értesítéssel együtt
```
Ne futtasd közvetlenül a scriptet egy agent-sessionből: a unit környezete (token, `LOG`) ott nincs meg.

## Buktatók
- **`Failed to authenticate: OAuth session expired`**: a Claude OAuth token lejárt. Új token:
  `claude setup-token`, az eredmény a `/etc/energetika-tudastar/.env` `CLAUDE_CODE_OAUTH_TOKEN=` sorába.
  `ANTHROPIC_API_KEY` ne legyen az env-ben: a unit és a script is kifejezetten törli.
- **"Execution error" a logban** nem feltétlenül fatális: ha a log végén `OK: feltöltve GitHubra` és
  `===== kész =====` áll, a futás sikeres volt.
- **Bot API + MarkdownV2 = HTTP 400**: az értesítés ezért sima szöveg, `parse_mode` nélkül.
