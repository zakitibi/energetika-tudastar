---
name: energetika-srcdoc-edit
description: Energetika.html srcdoc-jának módosítása (CSS/JS/HTML) Python script-tel, a rebuild_news_html.js NEWS JSON frissítése nélkül. Akkor használd ha az iframe tartalmát kell változtatni (nem a híreket).
---
# Energetika.html srcdoc szerkesztése

## Mikor használd
- Az Energetika.html news/tan/units iFrame srcdoc CSS/HTML/JS változtatásánál
- NEM a hírek (NEWS JSON) frissítésekor -- arra `node vps/rebuild_news_html.js`

## Eljárás

```python
with open('Energetika.html', encoding='utf-8') as f:
    html = f.read()

# 1. Srcdoc határok meghatározása (id="view-news" / view-tan / view-units)
mi = html.find('id="view-news"')
si = html.find('srcdoc="', mi) + len('srcdoc="')
raw_after = html[si:]
# Vége: az első " ami NEM &quot; entitás része
ei = 0
while True:
    pos = raw_after.find('"', ei)
    if raw_after[max(0,pos-5):pos+1] == '&quot;':
        ei = pos + 1; continue
    ei = pos; break
srcdoc_raw = raw_after[:ei]

# 2. Dekódolás
def decode(s):
    return s.replace('&lt;','<').replace('&gt;','>').replace('&quot;','"').replace('&amp;','&').replace('&#x27;',"'")
def encode(s):
    return s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;').replace("'",'&#x27;')

src = decode(srcdoc_raw)

# 3. Módosítás (old_str → new_str csere)
src = src.replace(OLD_STRING, NEW_STRING)

# 4. Visszakódolás + visszaírás
new_srcdoc = encode(src)
new_html = html[:si] + new_srcdoc + html[si+ei:]
with open('Energetika.html', 'w', encoding='utf-8') as f:
    f.write(new_html)
```

## Buktatók
- A JS `localStorage.getItem('energetika_view')` és más egyszeres idézőjeles string-ek `&#x27;` formában vannak tárolva az encode után -- ne keress rájuk `'` karakterrel az srcdoc_raw-ban
- A JS végső sorát (`renderAll();` + `</script>`) kell megkeresni a toggle handler hozzáadásához, nem egy általános `try{var v=...` stringet (az can differ)
- A rebuild_news_html.js CSAK a `const NEWS = {...}` objektumot cseréli az srcdoc-ban, a CSS/HTML/JS módosítások megmaradnak rebuild után is
- Az `encode()` a `'` karaktert `&#x27;`-re alakítja -- a window.top.open onclick-ben a `\'` escape nem szükséges, de az encode ezt kezeli
- iOS Safari srcdoc iframe: popup-blocker megkerülése: `onclick="window.top.open(this.href,'_blank');return false;"` az anchor tagokon
- Mobilos srcdoc scroll: a `html,body{height:auto;overflow-y:auto}` + `display:flex;flex-direction:column` grid kombinációval működik

## Ellenőrzés
```bash
node vps/rebuild_news_html.js
# Ellenőrzés: a módosítás megmaradt-e rebuild után?
python3 -c "print('navtoggle' in open('Energetika.html').read())"
git add Energetika.html && git push origin main
```
