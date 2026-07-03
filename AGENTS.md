# AGENTS.md — kódoló agentek belépési pontja

> Ezt a fájlt olvasd el ELŐSZÖR, ha bármilyen kódoló agent (Codex, Claude Code,
> Cursor, stb.) fejleszti/karbantartja ezt a repót. Ha az architektúra, a deploy,
> a fájlstruktúra, a generátor-logika vagy egy fontos konvenció változik,
> **frissítsd ezt a fájlt** (lásd lent a „Karbantartás" részt).

## 1. Mi ez a projekt
**Energetika – személyes energetikai tudástár** (magyar energiapiac fókusszal).
Egy statikus web-app, amit a GitHub Pages szolgál ki, és amelynek tartalmát
(napi hírek, leckék) automatizáltan generáljuk.

**Két, jól elkülönülő szerep — ne keverd:**
1. **Tartalomgenerálás** (energetikai mentor persona) → lásd `CLAUDE.md`.
   Ide tartozik a napi hír és az on-demand lecke tartalma, a forrás-ellenőrzési
   szabályokkal.
2. **Kódfejlesztés** (EZ a fájl) → a web-app, a szkriptek és a deploy karbantartása.

## 2. Architektúra
```
 Fejlesztő (Cowork/Codex)   Telefon            VPS (Anna/Marveen, Claude Code)
        │ git push             │ olvas (Pages)         │ generál + git push
        ▼                      ▼                       ▼
 ┌──────────────  GitHub: zakitibi/energetika-tudastar (main)  ──────────────┐
 │  = MESTER PÉLDÁNY. Minden itt van, a projekt-memória is.                  │
 │  GitHub Actions (deploy-pages.yml) → GitHub Pages (olvasható app)         │
 └──────────────────────────────────────────────────────────────────────────┘
```
- **Repo:** https://github.com/zakitibi/energetika-tudastar (publikus), `main` ág.
- **Pages URL:** https://zakitibi.github.io/energetika-tudastar/
- **Deploy:** **GitHub Actions** (`.github/workflows/deploy-pages.yml`), Pages *Source = GitHub Actions*.
  `concurrency: cancel-in-progress` védi a torlódás ellen.
  **NE** állítsd vissza „Deploy from a branch"-re — az korábban beragadt (queue-wedge).

## 3. Fájlstruktúra
| Útvonal | Mi ez |
|---|---|
| `index.html` | Átirányít az `Energetika.html`-re (Pages belépési pont) |
| `Energetika.html` | **A fő app** — generált egyfájlos SPA, 3 fül (Tananyag/Hírek/Mértékegységek), mind escaped `srcdoc` iframe |
| `Energetika_Tananyag.html` | A tananyag+kikérdező önálló változata |
| `news/YYYY-MM News.md` | Havi hírgyűjtő (a Hírek fül ebből épül) |
| `vps/generate_news.sh` | Napi hír generálás (Claude Code headless) → .md → rebuild → push |
| `vps/generate_lesson.sh "téma"` | On-demand lecke → `summary/lesson_NNN_slug.md` → push |
| `vps/rebuild_news_html.js` | A `news/*.md`-ből újraépíti az `Energetika.html` beágyazott hír-adatát |
| `vps/VPS_SETUP.md` | VPS beüzemelés (deploy key, cron, stb.) |
| `.github/workflows/deploy-pages.yml` | Pages deploy workflow |
| `CLAUDE.md` | Tartalomgenerálás persona + szabályok (Claude Code auto-olvassa) |
| `MEMORY.md` | Projekt-memória (tanulási haladás, leckelista) |
| `DEV_WORKFLOW.md` | A fejlesztési/üzemeltetési folyamat részletei |

## 4. A Hírek fül — KRITIKUS tudnivalók
- A `Energetika.html` egy **generált** fájl. A Hírek-adat a `view-news` iframe
  `srcdoc`-jában, escaped formában él: `const NEWS = {év:{hó:{title,intro,days:[{date,day,header,html,text}],keywords:[[szó,db]]}}}`.
- **NE szerkeszd kézzel a `const NEWS` blokkot.** A `vps/rebuild_news_html.js`
  regenerálja a `news/*.md`-kből, és a `generate_news.sh` minden futáskor meghívja.
- **Linkek:** a linkelés a generátorban van (`rebuild_news_html.js` → `inline()`),
  tiszta `<a target="_blank" rel="noopener">` (popup-hack nélkül), így túléli a regenerálást.
- **Escaping séma** (srcdoc szint): `& < > " '` → `&amp; &lt; &gt; &quot; &#x27;`.
- **keywords:** a rebuild MEGŐRZI a fájl korábbi (kurált) kulcsszavait hónaponként;
  csak a napokat regenerálja. Így a régi hónapok bájt-azonosak maradnak.
- A mobil-nézet reszponzív CSS-e (`@media`, összecsukható naptár a ☰ gombbal) az
  iframe `<style>`-jában van.

## 5. Tartalmi konvenciók
- **Hírek:** havi fájl `news/YYYY-MM News.md`. Napok: `## YYYY-MM-DD (ellenőrzés 07:00 CEST)`,
  legfrissebb nap felül. Tételek: `### N. cím`, majd `- **Forrás:** … · *CÍMKE*`,
  összefoglaló számokkal, `- **Link:** URL`, `- **Kulcsszavak:** …`.
  Megbízhatóság: `VERIFIED / PARTIALLY VERIFIED / CONFLICTING / UNVERIFIED`
  + `FACT / ASSUMPTION / OPINION / ESTIMATE`.
- **Leckék:** `summary/lesson_NNN_slug.md`.

## 6. Fejlesztési workflow
1. Fejlesztés (itt vagy Codexben) → `git commit` → `git push` a `main`-re.
2. Az Actions **„Deploy Pages"** workflow élesíti a Pages-t.
3. A VPS a következő futáskor `git pull`-lal átveszi a változást.
- **Push jogok:** fejlesztő = GitHub token (Contents; workflow-fájlhoz `workflow` scope kell);
  VPS = SSH **deploy key**.
- Részletek: `DEV_WORKFLOW.md`.

## 7. Automatizálás (VPS)
- `generate_news.sh`: `git pull` → Claude Code headless generál → `news/*.md` →
  `rebuild_news_html.js` → `commit` + `push`. A szkript elején `unset CLAUDE_CONFIG_DIR`
  (mindig az előfizetéses login).
- Ütemezés: Marveen/Anna (Telegram-ból is indítható) VAGY cron `0 7 * * 1,3,5` (Europe/Budapest).

## 8. Gyakori buktatók
- Pages **Actions** módban van — ne állítsd branch-deployra.
- Az `Energetika.html` óriás generált fájl — a hír-adathoz CSAK a `rebuild_news_html.js`-en át nyúlj.
- A `CLAUDE.md`/`MEMORY.md` a repóban van (publikus repo, email kiszedve). Ne tegyél bele titkot/PII-t.

## 9. Karbantartás — MINDIG frissítsd ezt a fájlt, ha változik:
architektúra · deploy mód · fájlstruktúra · a generátor-logika · fontos konvenció.

### Állapot / változásnapló
- 2026-07-03: Pages áthelyezve GitHub Actions deployra (branch-deploy beragadt).
  Hírek linkek a generátorba építve. Projekt-memória (CLAUDE.md/MEMORY.md) a repóba került.
