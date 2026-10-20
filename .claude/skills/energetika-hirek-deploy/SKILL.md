---
name: energetika-hirek-deploy
description: Energetika hírek generálása és GitHub Pages deploy – a push, a Pages-build és a tipikus deployhibák. Trigger: egy hírgenerálás után a push vagy a Pages nem frissült.
---
# Energetika hírek deploy

## Eljárás
1. Futtatás a unittal: `systemctl --user start energetika-news.service` (ld. `energetika-hirek-task`).
2. `tail -40 /var/log/energetika-tudastar/news.log` – eredmény ellenőrzés.
3. Ha a push elbukott: `cd /srv/energetika-tudastar && git pull --rebase origin main && git push origin main`.
4. A Pages: `https://zakitibi.github.io/energetika-tudastar/Energetika.html`.

## Buktatók
- **A push SSH deploy kulcson megy** (`github-energetika` host-alias az `~/.ssh/config`-ban), a GitHub
  Pages pedig OIDC-vel deployol. PAT nem kell hozzá.
- **Push rejected (fetch first)**: ha a Pages Actions commit a mi pushunk előtt érkezett a remote-ra,
  a push elutasítódik. A `generate_news.sh` automatikusan rebase-el és újrapróbálja.
- A `generate_news.sh` elején van `git pull --rebase`, de ez nem véd, ha a pull és a push között
  pushol valaki (race). Ezért kell a push retry is.
- **Szkript exit 1, de log OK**: a claude headless session belső hibával is zárulhat úgy, hogy a logban
  "kész" és "feltöltve GitHubra" látszik. Ez sikeres lefutás; a unit ilyenkor hibát jelez.
- **GitHub Actions workflow vs branch-alapú Pages**: ha a `.github/workflows/deploy-pages.yml` a repóban
  van, de a Settings → Pages → Source még "Deploy from a branch", a workflow a `configure-pages`
  lépésnél elbukik. Fix: Source → "GitHub Actions". Ez a tulajdonos döntése, egyeztetés nélkül ne módosítsd.
- **Hosszú futás**: a generálás kb. 10 perc. Agent-sessionből ne szinkron Bash-hívással indítsd,
  hanem a unittal, és a logot nézd.

## Ellenőrzés
- `tail -5 /var/log/energetika-tudastar/news.log` → "OK: feltöltve GitHubra" vagy "Nincs változás"
- `git -C /srv/energetika-tudastar log --oneline -3` → a mai commit látható
