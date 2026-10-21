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
| `sw.js` | Service worker: 1 napig érvényes gyorsítótár (ld. 3b.) |
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

## 3b. A SPA shell fejléce és a bal oldali fiók (drawer)
> A döntések indoklása, a session alatt kiderült buktatók és a nyitott pontok:
> **`notes/2026-10-21-fejlec-es-oldalmenu.md`**.

Az `Energetika.html` **nem generált** része a fejléc + a fiók + a záró `<script>`.
(A `rebuild_*` szkriptek csak a `view-*` iframe-ek `srcdoc`-ját írják, a shellt nem.)

- **A navigáció EGY forrásból jön:** a záró script `MENU` tömbjéből épül a fejléc
  fülsora ÉS a fiók listája is. **Új nézet = egy `MENU`-sor + egy `<div class="view" id="view-<id>">`**
  (a `gl` mezőben egy emoji ikon). Ne írj kézzel fület vagy menüpontot.
- **Választóvonal** a fiókban ott kerül be, ahol a `MENU` elem `group` értéke
  megváltozik — nem csoportonként hardkódolva.
- **Az aktuális nézet jelölve van, nem elrejtve** (`.drawer-item.current` + `aria-current`).
- **`window.pageLock`** (pinelt `body` + visszaugró scroll) egy helyen van, mert a fiók
  és az info-ablak is használja. iOS-en az `overflow:hidden` a `body`-n nem elég.
- **Az overlay-k sima `<div>`-ek, nem `<dialog>`** (iOS Safari &lt;15.4). Háttérre
  kattintásnál a feltétel `event.target === overlay`, soha nem a benne ülő panel.
- **Fejléc sorrend:** ☰ menü (bal szél) → cím → fülsor → ⓘ info (jobb szél). A ☰ és az ⓘ
  inline SVG (`currentColor`), rajz 20–22 px, doboz 40×40. A **fiók menüpontjai emoji**
  ikont kapnak (`MENU[].gl`), ugyanazt, ami a fülsoron van.
- **Az ⓘ panel a live állapotból épül:** nézetenként ● (betöltött) / ▲ (nem) + forráscímke.
- **A fiók lábrésze:** balra a **frissítési állapot** (a tartalom kora + mikor jött le a
  hálózatról), jobbra a ↻ gomb. Nem egymásba ágyazva — `<button>` egy `<a>`-ban érvénytelen.
- **Gyorsítótár: `sw.js` (service worker), 1 nap.** 24 óránál fiatalabb másolat azonnal a
  cache-ből megy ki, és a háttérben frissül; 24 óra fölött hálózat először, hiba esetén cache;
  offline a lejárt példány is kimegy. A letöltés idejét az `x-cached-at` fejléc hordozza a
  bemásolt válaszon — ebből írja ki a lábrész az állapotot. A **↻ gomb** `CLEAR` üzenettel
  üríti a cache-t, törli a `caches` bejegyzéseket, majd `?v=<ts>`-sel tölt újra.
  **Új deploy után a felhasználó legfeljebb egy betöltésnyit késik** (a háttér-revalidáció
  miatt), vagy azonnal frissíthet a ↻-val. Ha a cache szerkezete változik, emeld a `CACHE`
  nevet (`energetika-v1` → `-v2`).
- **Leckeválasztó a fejlécben** (`#lessonpick` + `#lessonmenu`): a Tananyag nézetben a cím
  mellett alcímként ott az aktuális lecke, és abból gördül le a teljes leckelista (720 px-ig
  széles, több oszlopos — szándékosan szélesebb a fióknál). A lista a Tananyag-iframe saját
  `.navitem` elemeiből épül **minden nyitáskor**, a választás a nézet `selectLesson(n)`
  függvényét hívja — nincs belőle második, elavulni képes leckelista. Az alcímet egy
  `MutationObserver` tartja szinkronban, ha a nézet saját oldalsávjából választanak.
  Más nézetben a `body.tanview` osztály hiányában nem látszik.
- **A „Naptár” menüpont nem nézet, hanem művelet** (`MENU[].act`): a Hírek-nézet `.nav`
  oszlopát nyitja/zárja a srcdoc iframe-ben (azonos eredetű, közvetlenül elérhető). A nézet
  saját `#navtoggle` sávja ezért `display:none` a news srcdoc CSS-ében. 900 px fölött a
  menüpont rejtve van, mert ott a navigátor állandóan látszik.
- A Tananyag-iframe saját ☰ („Leckék”) gombja **el van rejtve** az `embed-override` CSS-ben
  (`.top .burger{display:none!important}`) — a leckéket a fejléc leckeválasztója kezeli.
  Az `embed-override` blokkot a `rebuild_tananyag_html.py` a *jelenlegi* `view-tan`-ból
  emeli át, tehát ott kell szerkeszteni, és a rebuild megőrzi.
- **Nem vettük át** az eredeti mintából az „egy gombos frissítés” (deploy) részt: az csak ott
  értelmes, ahol a felülethez való hozzáférés önmagában deploy-jogosultság. Ez a lap publikus.

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
- **Branch-ről nem lehet Pages-re deployolni.** A `workflow_dispatch` elindul, de a job logok
  nélkül, 2 mp alatt elbukik: *„Branch … is not allowed to deploy to github-pages due to
  environment protection rules."* A `github-pages` environment csak az alapértelmezett ágról
  enged. Élő teszt tehát = merge a `main`-be (vagy a tulajdonos felveszi a `claude/*` szabályt
  a Settings → Environments alatt).
- **Felhős sessionben a klón elavult lehet** (ez 2026-10-20-án egy hónapnyi hírt forgatott
  volna vissza). Munka előtt mindig `git fetch origin main`, és arra építs.
- **Shell-módosítás után futtasd le mindkét generátort**, és a fájlnak bájtra változatlannak
  kell maradnia — ez fogja meg, ha egy horgony (`id="view-tan"><iframe title=…`) elromlott.
- **A service worker miatt a felhasználó legfeljebb egy betöltésnyit késik** egy új deploy
  után (vagy azonnal frissít a fiók ↻ gombjával). Ha „nem frissült" bejelentés jön, először
  ezt kérdezd vissza, ne a deployt hibáztasd.

## 9. Karbantartás — MINDIG frissítsd ezt a fájlt, ha változik:
architektúra · deploy mód · fájlstruktúra · a generátor-logika · fontos konvenció.

### Állapot / változásnapló
- 2026-10-21: A Tananyag-nézet saját ☰ Leckék gombja elrejtve (a fejléc leckeválasztója váltja ki).
- 2026-10-21: Leckeválasztó a fejlécben (az aktuális lecke alcímként, belőle legördülő
  leckelista); a Naptár menüpont 📅 ikont kapott.
- 2026-10-21: A fiók emoji ikonokat kapott, az ⓘ a fejléc jobb szélére került, a ↻ csak a
  fiók lábrészében maradt (valódi cache-ürítéssel); új `sw.js` (1 napos cache); a Hírek
  navigátora „Naptár” menüponttá vált a fiókban.
- 2026-10-20: A SPA shell megkapta a **bal oldali fiókot (drawer)** + ⓘ info-ablakot
  + ↻ újratöltést; a fülsor és a fiók egyetlen `MENU` tömbből épül (lásd 3b.).
- 2026-07-03: Pages áthelyezve GitHub Actions deployra (branch-deploy beragadt).
- 2026-07-03: Új **Kvíz** fül (kumulatív kikérdező + villámkártya, 1..N leckéig) az `Energetika.html`-ben.
- 2026-07-03: Tananyag-szinkron megoldva (`vps/rebuild_tananyag_html.py`); a 15–16. lecke `QUIZ`-szerkezete javítva (tévesen a 14. leckébe ágyazódott).
  Hírek linkek a generátorba építve. Projekt-memória (CLAUDE.md/MEMORY.md) a repóba került.
