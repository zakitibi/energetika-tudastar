---
name: energetika-tananyag-lecke
description: Új lecke hozzáadása az Energetika_Tananyag.html-hez. Trigger: Tibor "következő lecke" vagy "csináld meg a N. leckét" kérése, vagy sorozat folytatása.
---
# Energetika tananyag lecke generálás

## Mikor használd
Ha Tibor új leckét kér az energetika tananyaghoz (`Energetika_Tananyag.html` (a repó gyökerében)).

## Eljárás

1. **ELŐSZÖR olvasd el** (kötelező, minden alkalommal):
   ```bash
   cat AGENTS.md
   cat CLAUDE.md
   cat MEMORY.md
   ```
   Az AGENTS.md a technikai belépési pont (architektúra, deploy, fájlstruktúra), a CLAUDE.md a tartalmi szabályok, a MEMORY.md a leckehaladás és projekt-memória. Ha nem olvasod el, figyelmen kívül hagyod a legfrissebb kontextust és beragadt konvenciókat.

2. **Meglévő leckék feltérképezése**:
   ```python
   grep -oP '(?<=<template id="lesson-)\d+' Energetika_Tananyag.html | sort -n
   grep -oP '\d+\. lecke – [^<"]+' Energetika_Tananyag.html | sort -u
   ```
   → megkapjuk az utolsó lecke számát és a sorozat ívét.

2. **Stílusreferencia**: az utolsó lecke template-jét minta gyanánt olvasni:
   ```python
   python3 -c "import re; c=open('Energetika_Tananyag.html').read(); m=re.search(r'<template id=\"lesson-N\">(.*?)</template>',c,re.DOTALL); print(m.group(1)[:3000])"
   ```

3. **Adatgyűjtés WebSearch-csel**: min. 2 párhuzamos keresés (magyar + EU adat).
   Jelölések kötelezők: TÉNY / BECSLÉS / VÉLEMÉNY forrással.

4. **Tartalom megírása** (HTML, inline a python scriptbe):
   - Fejléc: lecke szám, cím, alcím, dátum, adatok éve, szint
   - Szekciók: 1. Vezetői összefoglaló, 2. Egyszerű magyarázat, 3. Részletes (3.1–3.x), 4. Kulcsszámok táblázat
   - `<template id="lesson-N">...</template>` formátum

5. **HTML módosítás Python scripttel** (NEM kézzel) – 6 helyen kell módosítani:
   - `TITLES` dict: `"N": "Cím"` hozzáadása a `};` elé
   - `paintBadges` `n<=X` → `n<=N` frissítés
   - Header sub div: `"X lecke"` → `"N lecke"` szöveg
   - Sidebar: `</aside>` elé navitem(ek)
   - Templates: utolsó `</template>` után az új template(k)
   - QUIZ dict: `}}; const TITLES` elé a `"N": {questions:[...], cards:[...]}` adatok

6. **Quiz**: min. 8 kérdés `{l, q, o, a, e}` formátumban + 6 flashcard `["term", "def"]`

7. **Commit + push** (retry logikával):
   ```bash
   cd "$(git rev-parse --show-toplevel)"
   git add Energetika_Tananyag.html
   git commit -m "Tananyag: N. lecke (Téma) hozzáadva"
   git push origin main || (git pull --rebase --quiet origin main && git push origin main)
   ```

## Buktatók
- **AGENTS.md/CLAUDE.md/MEMORY.md nem olvasva**: Tibor korrekció (2026-07-03) -- a lecke elkészült, de a fájl nem frissült be magától, mert a kontextus (pl. MEMORY.md-ben tárolt állapot, AGENTS.md konvenciók) nem volt betöltve. Mindig olvasd el ELŐBB.
- **6 módosítási pont**: TITLES, paintBadges n<=X, header "X lecke", sidebar navitem, template, QUIZ. Ha valamelyik kimarad, a lecke nem jelenik meg.
- **paintBadges**: `for(let n=1;n<=X;n++)` – ha nem frissül, az új badge-ek nem jelennek meg.
- **Push rejected (fetch first)**: GitHub Pages Actions commit megelőzi a lokálisat. Fix: `git pull --rebase origin main && git push origin main`. Mindig retry logikával push-olj.
- **Python replace pontosság**: az `old_string` egyedi legyen a fájlban. `rfind`-ot használj a QUIZ végének megtalálásához (nem `find`).
- **HTML entities**: gondolatjel → `–`, bullet → `&bull;`, nem kell escape-elni a H₂-t (UTF-8 direkt OK).
- **jq és sqlite3 CLI nem elérhető** – csak python3-on keresztül.

## Ellenőrzés
```python
# Minden elem jelenlétének gyors ellenőrzése:
c = open('Energetika_Tananyag.html').read()
for n in [15, 16]:  # az új leckék számai
    assert f'id="lesson-{n}"' in c, f"lesson-{n} template hiányzik"
    assert f'"badge-{n}"' in c, f"badge-{n} hiányzik"
    assert f'"{n}": {{"questions"' in c, f"quiz-{n} hiányzik"
print("OK")
```
