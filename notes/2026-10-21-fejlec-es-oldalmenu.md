# Fejléc, bal oldali fiók, cache — átadás (2026-10-20/21)

> **Hol a kötelező olvasmány:** a *jelenlegi állapot* leírása az `AGENTS.md` **3b.** szakaszában
> van, és azt kell karbantartani. Ez a fájl a **miért**-eket, a session alatt kiderült
> buktatókat és a nyitott pontokat rögzíti, hogy a következő agent/chat ne derítse ki újra.

## 1. Mi készült el

Az `Energetika.html` SPA-shellje (a fejléc + a nem generált záró `<script>`) kapott egy
teljes navigációs réteget, egy feltöltött UI-minta („Fejléc, oldalmenü és frissítés —
átadható UI-minta") alapján, a statikus GitHub Pages környezetre szabva:

| Elem | Hol |
|---|---|
| ☰ menügomb + bal oldali fiók (drawer) | `Energetika.html` shell, `#drawer` |
| ⓘ info-ablak (live állapotból épül) | `#info-overlay` / `#info-panel` |
| Leckeválasztó a fejlécben (alcím + legördülő) | `#lessonpick` / `#lessonmenu` |
| „Naptár" menüpont (a Hírek navigátorát nyitja) | `MENU[].act === 'cal'` |
| Frissítési állapot + valódi frissítés a fiók alján | `.drawer-state`, `#reloadbtn2` |
| 1 napig érvényes gyorsítótár | **`sw.js`** (új fájl a repó gyökerében) |

Commitok: `cdb4e45` (fiók átszabása, cache), `2db99fe` (leckeválasztó, naptár ikon).
Az első kör (`116b15c` + merge `6935bb7`) már a `main`-ben van.

## 2. Mit vettünk át a mintából és mit nem

**Átvéve** (a minta indoklásával együtt, mert ezek nem ízlés kérdései):

- **A navigáció egy forrásból jön.** A `MENU` tömbből épül a fülsor ÉS a fiók listája is.
  Hat oldal hat menümásolata hat hely, ahol el lehet felejteni egy bejegyzést.
- **Az overlay-k sima `<div>`-ek, nem `<dialog>`.** A Safari csak 15.4-ben kapott
  `showModal()`-t — egy régebbi iPhone-on a gomb némán nem csinálna semmit.
- **`window.pageLock` egy helyen**, mert három felület használja. iOS-en az
  `overflow:hidden` a `body`-n nem tartja meg a lapot.
- **„Előbb a keret, utána a tartalom"** minden ablaknál, ami hálózatot hív (az ⓘ panel
  azonnal megjelenik, a tartalma `requestAnimationFrame`-ben épül).
- **Glif és szín együtt** minden állapotjelzésnél (az ⓘ panel ● / ▲ sorai).
- **A választóvonal a `group` váltásánál**, rövid vonalként — fajtaváltás, nem szekcióhatár.
- **Az aktuális nézet jelölve van, nem elrejtve.**
- **A lábrészben a két elem testvér**, nem egymásba ágyazva (`<button>` egy `<a>`-ban
  érvénytelen, és a link nyerne).

**Nem vettük át:**

- **Az „egy gombos frissítés" (deploy) mintát.** Az csak ott értelmes, ahol a felülethez
  való hozzáférés önmagában deploy-jogosultság (tailnet/VPN). Ez a lap publikus, és nincs
  mögötte backend. Helyette a ↻ a *gyorsítótárat* üríti és hálózatról tölt újra.
- **A közös, külön fájlba kiemelt `menu.js`-t.** Az `Energetika_Tananyag.html` `srcdoc`-ként
  van beágyazva, ott a relatív `<script src>` nem oldódna fel (`about:srcdoc` bázis), ezért
  a shell egyfájlos maradt, a repó felépítéséhez igazodva.
- **A „naprakész" állapotjelzést a ↻ ikonon.** Statikus lap mögött nincs verzió-API —
  amit nem tudunk, azt nem állítjuk; az ikon nem kap hamis zöld pipát.

## 3. Döntések, amiket érdemes tudni

- **A `MENU` tömb a szerződés.** Új nézet = egy `MENU`-sor (`id`, `gl` emoji, `label`,
  `tab`, `group`, `src`) + egy `<div class="view" id="view-<id>">`. Semmit ne írj kézzel
  a fülsorba vagy a fiókba.
- **A fiók ikonjai emojik, a fejléc gombjai inline SVG-k.** Ez tudatos: a fülsor emojijai a
  lap meglévő arculata, a fejlécben viszont `currentColor`-t öröklő rajz kell.
- **A leckelista sehol nincs lemásolva.** A fejléc legördülője *minden nyitáskor* a
  Tananyag-iframe `.navitem` elemeiből épül, a választás a nézet `selectLesson(n)`
  függvényét hívja. Új lecke automatikusan megjelenik, és nincs mit szinkronban tartani.
  Visszafelé egy `MutationObserver` figyeli a `.navitem.active` osztályt.
- **A Naptár menüpont művelet, nem nézet** (`MENU[].act`), és 900 px fölött rejtve van,
  mert ott a Hírek navigátora amúgy is állandóan látszik.
- **A srcdoc iframe-ek azonos eredetűek**, ezért a shell közvetlenül beléjük nyúlhat
  (`contentDocument`, `contentWindow.selectLesson`). Ez a Naptár és a leckeválasztó alapja.
- **Cache-kompromisszum:** 24 óránál fiatalabb példány azonnal a cache-ből megy ki, de a
  háttérben frissül, tehát egy új hír **legkésőbb a következő betöltéskor** látszik — vagy
  azonnal a ↻-val. Ez tudatos csere: a gyors/offline indulásért cserébe legfeljebb egy
  betöltésnyi késés.

## 4. Buktatók, amik ebben a sessionben derültek ki

- **Branch-ről nem lehet Pages-re deployolni.** A `workflow_dispatch` elindul, de a job
  2 másodperc alatt elbukik, logok nélkül; az annotáció mondja meg az okát:
  *„Branch … is not allowed to deploy to github-pages due to environment protection rules."*
  A `github-pages` environment csak az alapértelmezett ágról enged. Feloldás (a tulajdonos
  dolga): Settings → Environments → `github-pages` → Deployment branches → `claude/*`.
  Amíg ez nincs, az élő teszt = merge a `main`-be.
- **A felhős session klónja elavult lehet.** Ez a konténer szeptember 22-i `main`-ről
  indult, miközben a `main` 13 commitot kapott (napi hírek). **Minden munka előtt**
  `git fetch origin main`, és arra építkezz — különben a push/merge visszaforgat egy
  hónapnyi hírt.
- **A `zakitibi.github.io` nincs engedélyezve a session egress proxyján** (403), tehát a
  kész lapot innen nem lehet megnyitni. A `raw.githubusercontent.com` viszont igen — a
  deployolt fájl tartalma ezen keresztül ellenőrizhető (bájtra összehasonlítva a tesztelttel).
- **A `rebuild_*` szkriptek horgonyai sérülékenyek.** A `rebuild_tananyag_html.py` az
  `id="view-tan"><iframe title="Tananyag" srcdoc="` sztringre és a `"></iframe></div>`
  lezárásra épül, a `rebuild_news_html.js` az `id="view-news"` + `srcdoc="` párosra.
  Ezeket a markupokat ne írd át. Minden shell-módosítás után futtasd le mindkettőt, és
  **a fájlnak bájtra változatlannak kell maradnia** (ld. lent).

## 5. Hogyan teszteld (gép nélkül nem megy, ez a session sem tudta)

```bash
git fetch origin main && git checkout main && git pull
python3 -m http.server 8000
# http://localhost:8000/Energetika.html   (a service workerhez localhost vagy https kell)
```

**Generátor-körforgás — ez a legfontosabb regressziós teszt:**

```bash
cp Energetika.html /tmp/before.html
node vps/rebuild_news_html.js            && diff -q /tmp/before.html Energetika.html
mkdir -p /tmp/rt && cp Energetika.html Energetika_Tananyag.html /tmp/rt/
REPO_DIR=/tmp/rt python3 vps/rebuild_tananyag_html.py && diff -q /tmp/rt/Energetika.html Energetika.html
# mindkettőnek no-opnak kell lennie
```

**Böngészős füstteszt** (Playwright, headless Chromium — a session ezt használta):
nyisd meg a lapot 1280×800-on és 390×780-on, és nézd meg, hogy
(1) nincs `pageerror`/console error, (2) a ☰ nyit/zár (overlay, Escape, menüpont),
(3) a fülsor és a fiók ugyanazt a 4 nézetet adja, (4) a leckeválasztó alcíme követi a
nézet oldalsávját és fordítva, (5) a Naptár nyit-zár a Hírek nézetben (<900 px),
(6) a második betöltés után a fiók lábrésze „letöltve …"-t ír, (7) a ↻ után az URL
`?v=<ts>` és a cache újraépül.

## 6. Nyitott pontok / ötletek

- **Szófelhő:** egy szóra kattintva még nem történik semmi. Kézenfekvő folytatás: a Hírek
  nézetbe ugrás az adott kulcsszóra szűrve. A kulcsszavak írásmódja nem egységes
  (`Paks` / `Paksi Atomerőmű` / `Paks II`, `MVM` / `MVM Group`) — ezeket a felhő külön
  szónak veszi; egy kis szinonima-térkép összevonhatná őket.

- **iOS Safari nincs letesztelve.** A minta több döntése (overlay `<dialog>` helyett,
  `pageLock`) kifejezetten iOS miatt van, de headless Chromiumban ez nem jön ki.
  Ha valaki iPhone-on nézi, erre figyeljen.
- **A Tananyag-nézet saját „☰ Leckék" gombja el van rejtve** (2026-10-21, kérésre), így
  mobilon a fejléc legördülője az egyetlen leckeválasztó. Ezzel a **haladás-százalékok
  (badge-ek) mobilon nem látszanak** — ha kellenek, a legördülő `lessons()` függvénye
  átemelheti a `.navbadge` szövegét és színét.
- **A Kvíz fül nem kapott leckeválasztót** (kumulatív kikérdező, saját logikával).
- **A `sw.js` cache-neve `energetika-v1`.** Ha a cache szerkezete változik, emelni kell,
  különben a régi bejegyzések félreértelmeződnek.
- Az ⓘ panel „Bekötve" listája a `MENU[].src` címkékből jön — ha új nézet kerül be,
  ezt is töltsd ki, különben üres marad a forrás neve.
