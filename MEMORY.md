# Energetika Project Memory Index

Projekt: Energy Sector Mentor - Magyar energiapiac szakterület

## User Profile
- Name: Tibor
- Email: (privát — nem publikus)
- Role: Learning energy sector with focus on Hungarian market

## Project Setup
- Knowledge base structure: /documents, /notes, /summary
- Focus areas: Global energy → European market → Hungarian specifics
- Teaching mode: Beginner to Expert progression
- Source verification: Minimum 2 independent sources for major claims

## Lessons / Deliverables
- `/summary/01_lecke_bevezetes.docx` — 1. lecke: Bevezetés és tájékozódás (globális → EU → magyar). Készült: 2026-06-17.
  - Kulcsadatok: globális fosszilis 81,5% (EI 2025); EU szél+nap 30% > fosszilis 29% (Ember 2026); HU áramfogyasztás ~44,9 TWh, Paks ~46,7%, nettó import ~30% (MAVIR/MEKH 2024); HU gáz orosz import ~78%.
- `/summary/02_lecke_energiaforrasok.docx` — 2. lecke: Energiaforrások A-tól Z-ig (fosszilis/nukleáris/megújuló, forrásonként működés+előny/hátrány+magyar kontextus). Készült: 2026-06-17.
  - Kulcsadatok: LCOE (Lazard 2024): nap 29–92, szél 27–73, gáz ~76, szén 69–168 $/MWh; kapacitásfaktor: atom >92%, geotermikus ~65%, gáz ~60%, szél ~34%, nap ~23%; életciklus CO2: atom/szél/nap alacsony, szén 740–1689 g/kWh. HU megújuló kapacitás: nap ~8100 MW, biomassza+biogáz ~444 MW, szél ~325 MW (befagyva), víz ~62 MW; geotermikus hőhasznosítás EU-éllovas.
- `/summary/kikerdezo_1-2_lecke.html` — interaktív önellenőrző kvíz (22 kérdés) + 18 fogalom-villámkártya az 1-2. leckéből. Készült: 2026-06-19.
- `/summary/03_lecke_villamosenergia_rendszer.docx` — 3. lecke: termelés, feszültségszintek (400/220 kV), frekvencia 50 Hz, FCR/aFRR/mFRR tartalékok, MAVIR rendszerirányítás, határkeresztezés, kontinentális szinkronzóna. Készült: 2026-06-19.
- `/summary/04_lecke_energiapiacok.docx` — 4. lecke: határidős/day-ahead/intraday/kiegyenlítő piacok, merit order, marginális árazás, market coupling (SDAC), HUPX. HU day-ahead átlag 2024 ~100,9 €/MWh (júl ~135,5; nov ~163,7). Készült: 2026-06-19.
- `/summary/05_lecke_eu_energiapolitika.docx` — 5. lecke: Green Deal (2050 klímasemlegesség), Fit for 55 (-55% 2030), 2040 cél -90% (elfogadva 2026), RED III 42,5%, ETS ~70-85 €/t (2025), ETS2 2028-ra halasztva, CBAM 2026 (~75,36 €/t Q1), REPowerEU, orosz gáz kivezetés 2027 vége. Készült: 2026-06-19.
- `/summary/06_lecke_magyar_szektor.docx` — 6. lecke: MEKH, MAVIR, FGSZ, MVM-csoport, elosztók, Paks/Paks II (első betonöntés 2026.02.05, VVER-1200 III+, üzembe a 2030-as évek közepén), unbundling, NEKT, import (TurkStream/Druzhba). Készült: 2026-06-20.
- `/summary/07_lecke_energiatarolas.docx` — 7. lecke: lítiumion akku (~110-125 €/kWh 2025, ~85-90% hatásfok), szivattyús tározó, zöld hidrogén (~35-40%, 3-8 €/kg), keresletoldali válasz, V2G. Készült: 2026-06-20.
- `/summary/08_lecke_foldgaz_olaj.docx` — 8. lecke: Brent (2025 ~69 $/hordó) vs TTF (~35-45 €/MWh, 2025 -45%), LNG, gáztárolás, magyar útvonalak (TurkStream gáz ~8-8,5 mrd m³, Barátság olaj), diverzifikáció. Készült: 2026-06-20.
- `/summary/09_lecke_energiaatmenet.docx` — 9. lecke: elektrifikáció, áramigény +4,3% (2024), EV +25% (>17M), hőszivattyú EU -21%, tiszta forrás >80% a növekedésből, hidrogén nehéz iparban, kihívások (hálózat, nyersanyag). Készült: 2026-06-20.
- `/summary/kikerdezo_lecke_01..09.html` — leckénkénti interaktív kikérdező (kvíz + villámkártyák). Kumulatív: minden lecke kvíze tartalmaz ismétlő kérdést a korábbiakból, a kártyák kumulatívak. Generátor: outputs/quizgen.js + quizdata.js. Készült: 2026-06-20.
  - Alapozó sorozat (1-9. lecke) KÉSZ + kikérdezők mind. Sablon: outputs/helpers.js (docx), quizgen.js (kvíz). Lehetséges folytatás: elmélyülő modulok vagy átfogó vizsgakikérdező.

- **10–16. lecke** (2026-07): Nukleáris/Paks · Nap és szél · Rendszerirányítás és kiegyenlítő piacok · Kereskedelem, PPA · Energiabiztonság · Energiahatékonyság · Hidrogén/P2X. Forrásuk az `Energetika_Tananyag.html` (a SPA-ba a `vps/rebuild_tananyag_html.py` építi be).
- **17–21. lecke** (2026-10-21, elmélyülő modul, mind az `Energetika_Tananyag.html`-ben, 9 kérdés + 6 kártya/lecke):
  - 17. Villamos hálózatok: átvitel (750/400/220 kV, MAVIR), 6 elosztó, HMKE ≤50 kVA, 2022-es visszatáplálási tilalom, +2540 körzet (MEKH 2025.04), EU 584 Mrd EUR hálózati igény 2030-ig, okosmérő ~10% (2024).
  - 18. Az energiaszámla: MVM Next egyetemes szolgáltató, rendszerhasználati díjak (MEKH), áfa 27%, rezsicsökkentés 2523 kWh / 1729 m³, ~36 vs 70,104 Ft/kWh, 2026-ra változatlan, Rezsivédelmi Alap ~800 Mrd Ft.
  - 19. Hőenergia: fűtés-hűtés ~50% (EU), megújuló 26,2% (EU 2023) vs 18,1% (HU 2019), távhő 648 712 lakás (~15–16%), Szeged geotermia 27 251 lakás, biometán-cél 184 M m³ (2030).
  - 20. Üzemanyagpiac: Dunai Finomító ~8,1 Mt/év (2024: 7,1 Mt), AV3-tűz 2025.10, benzin 594,2 Ft/l (2026.07.20) ebből 46,1% adó, 480 Ft-os árstop 2021–22 tanulsága, védett ár 2026.03-tól.
  - 21. Prosumerek: >300 ezer háztartási naperőmű, >8 GW napelem, szaldó → bruttó (2024.01.01), Napenergia Plusz 66%, energiaközösség- és aggregátor-szabályozás (VET, 2026-os módosítás).
  - Nyitott/ellenőrizendő: a jövedéki adó 2026-os csökkentett mértékének érvényessége (forrásellentmondás); Szeged gázmegtakarítása (17 vs 27 M m³); HU fűtés-hűtés megújuló-aránya 2023-ra (csak 2019-es adat volt).

---
*Add memory file references here as they are created*
