# ⚡ Energetika – Tudástár

Személyes energetikai tudásbázis: magyar, európai és globális energiapiac. Egyetlen egységes web-app (fejlécből váltható **Tananyag · Hírek · Mértékegységek**), interaktív kikérdezővel és élő havi hírfigyelővel.

## Olvasás (telefonról is)

A közzétett oldal a **GitHub Pages**-en:

```
https://<felhasznalonev>.github.io/energetika-tudastar/
```

A gyökér automatikusan az egységes appra (`Energetika.html`) irányít. Érdemes a telefon böngészőjében könyvjelzőnek elmenteni.

## Tartalom

| Fájl | Mi ez |
|------|-------|
| `Energetika.html` | Az egységes app: Tananyag · Hírek · Mértékegységek |
| `Energetika_Tananyag.html` | A tananyag+kikérdező önálló változata |
| `news/YYYY-MM News.md` | Havi magyar energetikai hírgyűjtő (a Hírek fül élőben ebből tölt) |
| `index.html` | Átirányítás az appra (Pages belépési pont) |
| `vps/` | VPS automatizálás (napi hír + on-demand lecke + setup) |

A **Hírek** fül minden megnyitáskor a `news/*.md` fájlokból tölt élőben a GitHubról — új hónaphoz csak egy új `YYYY-MM News.md` fájl kell.

## Automatizálás

A generálást egy mindig futó VPS végzi (Claude Code + cron): napi hír H/Sze/P 07:00, plusz on-demand lecke. A GitHub a mester példány. Részletek: `vps/VPS_SETUP.md`.

## Források és megbízhatóság

A hírtételek több független forrás összevetésével készülnek, jelöléssel:
`VERIFIED` (2+ független forrás), `PARTIALLY VERIFIED` (egy forrás), `CONFLICTING`, `UNVERIFIED`, illetve `FACT / ASSUMPTION / OPINION / ESTIMATE`.
