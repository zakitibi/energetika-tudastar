# VPS beállítás — laptop nélküli automatizálás

Cél: a VPS (mindig fut) generálja a napi hírt és az on-demand leckéket, majd
GitHubra pushol. A telefon a GitHub Pages-ről olvas, és onnan is triggerelhet.

```
 Telefon ──(olvas: Pages)──▶ GitHub ◀──(push)── VPS (Claude Code, cron)
    └──────(trigger: SSH / GitHub Issue)────────▶ VPS
```

## 0. Előfeltételek a VPS-en
- Claude Code telepítve és **bejelentkezve** (előfizetéssel). Teszt: `claude -p "ping"`.
- `git` telepítve.
- `cron` fut (a legtöbb Linuxon alapból).

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

## 3. Napi hír — cron (H/Sze/P 07:00, magyar idő)
```bash
crontab -e
```
Illeszd be (a `CRON_TZ` a magyar időt biztosítja UTC-s VPS-en is):
```
CRON_TZ=Europe/Budapest
0 7 * * 1,3,5 /home/<USER>/energetika-tudastar/vps/generate_news.sh
```
Kézi teszt futtatás:
```bash
~/energetika-tudastar/vps/generate_news.sh
tail -n 40 ~/energetika-news.log
```

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
