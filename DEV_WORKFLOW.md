# Fejlesztési és üzemeltetési folyamat

## Architektúra (ki hol van)

```
   Cowork (Claude, Mac)                Telefon
   fejlesztés: kód/app/logika          olvasás (Pages) + Telegram(Anna)
        │  git push (token)                    │
        ▼                                      ▼
   ┌─────────────────  GitHub  ─────────────────┐   ← MESTER PÉLDÁNY
   │  zakitibi/energetika-tudastar (main)       │
   │  + GitHub Pages (olvasható app)            │
   └───────────────▲──────────────┬─────────────┘
        git pull   │              │  Pages kiszolgálja
                   │ push (deploy key)
             VPS (Anna / Marveen, Claude Code)  ← GENERÁTOR
             napi hír H/Sze/P 07:00 + on-demand lecke
```

- **GitHub = az egyetlen igazságforrás.** Minden ezen keresztül megy.
- **GitHub Pages** szolgálja ki az olvasható appot (`index.html` → `Energetika.html`).
- **VPS (Anna)** generál: napi hír + on-demand lecke, majd `commit` + `push` (deploy key).
- **Telefon**: olvasás Pages-en, operatív vezérlés Telegramon (Anna).

## Ki mit csinál

| Változás típusa | Hol / hogyan |
|---|---|
| Rendszer-fejlesztés (kód, app, logika, kinézet, szkriptek) | Cowork (Claude) → `git push` GitHubra. A VPS a következő futáskor `git pull`-lal átveszi. |
| Operatív (futtasd most, lecke, ütemezés-változtatás) | Telegramon Annának. |
| Tartalmi gyorsjavítás (elírás egy hírben) | `news/*.md` szerkesztése GitHubon; a következő VPS-futás pullozza és újraépíti az `Energetika.html`-t. |

A `generate_news.sh` minden futás elején `git pull`-t csinál → a fejlesztések **maguktól** kikerülnek a VPS-re. Azonnali alkalmazáshoz: `cd ~/energetika-tudastar && git pull` (vagy szólsz Annának).

## Lokális fejlesztői setup (Mac)

A projekt-mappa legyen a repo **lokális klónja** (ne a régi laza OneDrive-másolat), lehetőleg **OneDrive-on kívül** (a `.git`-et a OneDrive nem szereti):

```bash
git clone https://github.com/zakitibi/energetika-tudastar.git ~/energetika-tudastar
```

A projekt-instrukció és a memória **helyben marad**, a klón gyökerében, gitignore-olva:

```bash
cp "<régi OneDrive Energetika mappa>/CLAUDE.md"  ~/energetika-tudastar/
cp "<régi OneDrive Energetika mappa>/MEMORY.md"  ~/energetika-tudastar/
```

- `CLAUDE.md` és `MEMORY.md` a `.gitignore`-ban vannak → **soha nem kerülnek GitHubra**, csak lokális projekt-instrukció/memória maradnak.
- Ezután a Cowork-projektet ehhez a mappához kötöd.

## Push jogosultságok

- **Cowork/Claude (fejlesztés):** GitHub token (munkamenetenként megadva). Alternatíva: a kész változtatást Anna is felteheti.
- **VPS/Anna:** SSH **deploy key** (write, csak erre az egy repóra).

## Aranyszabályok

1. GitHub a mester — ne szerkessz külön, szinkronizálatlan másolatokat.
2. Fejlesztés → push → a VPS magától pull-oz.
3. Működtetés → Anna (Telegram).
4. `CLAUDE.md` / `MEMORY.md` mindig lokális marad (gitignore).
