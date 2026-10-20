# VPS beállítás — laptop nélküli automatizálás

Cél: a VPS (mindig fut) generálja a napi hírt és az on-demand leckéket, majd
GitHubra pushol. A telefon a GitHub Pages-ről olvas, és onnan is triggerelhet.

```
 Telefon ──(olvas: Pages)──▶ GitHub ◀──(push)── VPS (Claude Code, systemd timer)
    └──────(trigger: SSH / GitHub Issue)────────▶ VPS
```

## 0. Előfeltételek a VPS-en
- Claude Code telepítve és **bejelentkezve** (előfizetéssel). Teszt: `claude -p "ping"`.
- `git` telepítve.
- systemd user manager, lingerrel (`loginctl enable-linger`).

## 1. Repo klónozása
```bash
cd ~
git clone https://github.com/<USER>/energetika-tudastar.git
cd energetika-tudastar
chmod +x vps/*.sh
```

## 2. Git push jog beállítása (SSH deploy key — ajánlott)
Így a VPS token nélkül, biztonságosan tud pusholni.
```bash
ssh-keygen -t ed25519 -C "vps-energetika" -f ~/.ssh/energetika_deploy -N ""
cat ~/.ssh/energetika_deploy.pub
```
A kiírt kulcsot add hozzá GitHubon:
**Repo → Settings → Deploy keys → Add deploy key** → illeszd be → **pipáld be az
"Allow write access"-t** → Add key.

Majd állítsd a repo remote-ját SSH-ra ezzel a kulccsal:
```bash
cat >> ~/.ssh/config <<'EOF'
Host github-energetika
  HostName github.com
  User git
  IdentityFile ~/.ssh/energetika_deploy
  IdentitiesOnly yes
EOF
git remote set-url origin git@github-energetika:<USER>/energetika-tudastar.git
git push        # teszt: hibátlanul kell lefutnia
```

## 3. Napi hír — systemd user timer (H/Sze/P 09:00, magyar idő)
A VPS-en a kód a `/srv/energetika-tudastar` checkoutban van, a log a
`/var/log/energetika-tudastar/news.log`-ban, az env az `/etc/energetika-tudastar/.env`-ben
(`LOG`, `CLAUDE_CODE_OAUTH_TOKEN` a `claude setup-token`-ből, `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID`; `chmod 600`). `ANTHROPIC_API_KEY` ne kerüljön bele.

Telepítés (a unitfájlok forrása a repóban: `vps/systemd/`):
```bash
cp /srv/energetika-tudastar/vps/systemd/energetika-news*.{service,timer} ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now energetika-news.timer
loginctl enable-linger "$USER"   # hogy kijelentkezve is fusson (sudo kellhet)
```
Kézi futtatás és ellenőrzés:
```bash
systemctl --user start energetika-news.service
tail -n 40 /var/log/energetika-tudastar/news.log
```
Sikeres futás után a `vps/notify_telegram.sh` rövid üzenetet küld a Pages-linkkel,
hibánál az `energetika-news-failure.service` (`OnFailure=`) hibaüzenetet (csak
`sendMessage`, `getUpdates` soha).

## 4. A Mac-es feladat kikapcsolása (fontos!)
Hogy a hír ne generálódjon duplán, a gépeden lévő `magyar-energetikai-hrek`
ütemezett feladatot állítsd le (a Claude appban / ütemezőben). Ettől kezdve a
VPS a mester generátor, a GitHub a mester példány.

## 5. On-demand lecke (telefonről is)
Bármely SSH-appból (pl. **Termius** telefonon) belépsz a VPS-re, és:
```bash
~/energetika-tudastar/vps/generate_lesson.sh "energiatárolás Magyarországon"
```
Pár perc múlva a lecke a `summary/` mappában van, GitHubon és telefonon is látod.

### (Opció) Trigger GitHub Issue-ból
Ha SSH nélkül, pusztán a GitHub appból akarsz leckét kérni: nyiss egy Issue-t
`lesson: <téma>` címmel. Egy percenként futó figyelő a VPS-en feldolgozza,
legenerálja és bezárja. Ezt a figyelőt külön kérésre beállítom.

## Megjegyzések
- A pontos Claude Code kapcsolókat ellenőrizd: `claude --help` (verziónként eltérhet).
  Ha cronból jogosultsági kérdés akadna el, nézd meg a `--permission-mode` /
  `--dangerously-skip-permissions` opciókat felügyelet nélküli futáshoz.
- A cron a bejelentkezett felhasználó `HOME`-jával fusson, hogy a Claude Code
  megtalálja a bejelentkezést. Ha gond van, a crontab tetejére: `HOME=/home/<USER>`.
