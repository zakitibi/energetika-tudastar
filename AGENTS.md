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
| `Energetika.html` | **A fő app** — generált egyfájlos SPA, 4 fül (Tananyag/Hírek/Mértékegységek/Kvíz), mind escaped `srcdoc` iframe |
| `Energetika_Tananyag.html` | **A leckék EGYETLEN forrása** (tartalom + sidebar + `const QUIZ`/`TITLES`); a SPA Tananyag+Kvíz füle ebből generálódik |
| `news/YYYY-MM News.md` | Havi hírgyűjtő (a Hírek fül ebből épül) |
| `vps/generate_news.sh` | Napi hír generálás (Claude Code headless) → .md → rebuild → push |
| `vps/generate_lesson.sh "téma"` | On-demand lecke → `summary/lesson_NNN_slug.md` → push |
| `vps/rebuild_news_html.js` | A `news/*.md`-ből újraépíti az `Energetika.html` beágyazott hír-adatát |
| `vps/rebuild_tananyag_html.py` | Az `Energetika_Tananyag.html`-ből újraépíti az `Energetika.html` beágyazott **Tananyag ÉS Kvíz** fülét |
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

## 4b. A Tananyag + Kvíz fül — KRITIKUS tudnivalók
- A **leckék egyetlen forrása** az `Energetika_Tananyag.html` (tartalom + sidebar + `const QUIZ` + `const TITLES`). A `Energetika.html` SPA a Tananyag- ÉS a Kvíz-fület ennek **beágyazott, escaped `srcdoc` másolatából** rendereli.
- **Ha leckét adsz hozzá/módosítasz, NEM elég az `Energetika_Tananyag.html`-t szerkeszteni.** Utána KÖTELEZŐ: `python3 vps/rebuild_tananyag_html.py` — ez újraépíti az `Energetika.html` `view-tan` és `view-quiz` srcdoc-ját a forrásból (a beágyazási igazításokat — `<base target="_blank">` + `embed-override` CSS — megőrzi). Enélkül a Pages-en a régi leckelista marad (ez történt a 15–16. leckével 2026-07-03-án).
- **`const QUIZ` szerkezet:** top-level kulcsok `"1"`..`"N"`, mindegyik `{"questions":[{l,q,o:[4],a:idx,e}], "cards":[[front,back],…]}`. Új leckénél a `"15"`, `"16"` … kulcs a **QUIZ-objektum LEGFELSŐ szintjére** kerüljön, NE egy előző lecke objektumába. Gyakori hiba: hiányzó záró `}` a 14. lecke után → a 15/16 a 14-be ágyazódik és a kvízből eltűnik. A `TITLES`, a sidebar-`navitem` és az `id="lesson-N"` tartalom darabszáma is egyezzen.
- Escaping séma (srcdoc szint): `& < > " '` → `&amp; &lt; &gt; &quot; &#x27;` — a rebuild automatikusan kezeli.

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
- Az `Energetika.html` óriás generált fájl — a hír-adathoz CSAK a `rebuild_news_html.js`-en, a Tananyag/Kvíz-adathoz CSAK a `rebuild_tananyag_html.py`-n át nyúlj.
- Lecke után **mindig** futtasd: `python3 vps/rebuild_tananyag_html.py` — különben a SPA Tananyag/Kvíz füle nem frissül (csak a standalone fájl).
- A `CLAUDE.md`/`MEMORY.md` a repóban van (publikus repo, email kiszedve). Ne tegyél bele titkot/PII-t.

## 9. Karbantartás — MINDIG frissítsd ezt a fájlt, ha változik:
architektúra · deploy mód · fájlstruktúra · a generátor-logika · fontos konvenció.

### Állapot / változásnapló
- 2026-07-03: Pages áthelyezve GitHub Actions deployra (branch-deploy beragadt).
- 2026-07-03: Új **Kvíz** fül (kumulatív kikérdező + villámkártya, 1..N leckéig) az `Energetika.html`-ben.
- 2026-07-03: Tananyag-szinkron megoldva (`vps/rebuild_tananyag_html.py`); a 15–16. lecke `QUIZ`-szerkezete javítva (tévesen a 14. leckébe ágyazódott).
  Hírek linkek a generátorba építve. Projekt-memória (CLAUDE.md/MEMORY.md) a repóba került.
