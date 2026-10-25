// Az Energetika.html shell szkriptjének ellenőrzése — kitelepítés előtt futtasd:
//   node tools/check-shell.cjs
// 1) ES2017-tel elemezhető-e (régebbi Safarik is értsék);
// 2) használ-e azonnal futó felső szintű kód (közvetlenül vagy a hívott függvényeken át)
//    olyan felső szintű var-t, ami CSAK KÉSŐBB kap értéket. iPhone Safarin a srcdoc
//    iframe-ek a shell szkript előtt elkészülhetnek, ezért a figyelők azonnal lefutnak —
//    2026-10-25-én így maradt üres a Szófelhő/Fogalomtár/Piaci térkép (HU_MON).
const fs=require('fs'), path=require('path');
let espree; for(const p of ['espree','/opt/node-tools/node_modules/espree','/opt/node22/lib/node_modules/eslint/node_modules/espree']){ try{ espree=require(p); break; }catch(e){} }
if(!espree){ console.error('espree nem található (npm i -g espree)'); process.exit(2); }
const html=fs.readFileSync(process.argv[2]||path.join(__dirname,'..','Energetika.html'),'utf8');
const src=html.slice(html.lastIndexOf('<script>')+8, html.indexOf('</script>',html.lastIndexOf('<script>')));
let ast; try{ ast=espree.parse(src,{ecmaVersion:2017,loc:true}); }catch(e){ console.error('✗ nem ES2017-kompatibilis:',e.message); process.exit(1); }
console.log('✓ ES2017-tel elemezhető');
const varPos={}, funcs={};
for(const n of ast.body){
  if(n.type==='VariableDeclaration') for(const d of n.declarations) if(d.id.type==='Identifier' && d.init) varPos[d.id.name]=varPos[d.id.name]??n.start;
  if(n.type==='FunctionDeclaration') funcs[n.id.name]=n;
}
function walk(node,cb){ if(!node||typeof node!=='object') return; if(Array.isArray(node)){ node.forEach(x=>walk(x,cb)); return; }
  if(node.type) cb(node); for(const k in node){ if(k==='loc'||k==='start'||k==='end') continue; const v=node[k]; if(v&&typeof v==='object') walk(v,cb); } }
// egy csomópontban hivatkozott azonosítók + hívott függvénynevek (a callbackekbe/listenerekbe NEM megyünk bele: azok később futnak)
function refs(node, deferredOK){
  const ids=new Set(), calls=new Set();
  (function rec(n,inDeferred){
    if(!n||typeof n!=='object') return;
    if(Array.isArray(n)){ n.forEach(x=>rec(x,inDeferred)); return; }
    if((n.type==='FunctionExpression'||n.type==='ArrowFunctionExpression') && deferredOK) { return; } // halasztott (listener/callback)
    if(n.type==='Identifier' && !inDeferred) ids.add(n.name);
    if(n.type==='CallExpression' && n.callee.type==='Identifier') calls.add(n.callee.name);
    for(const k in n){ if(['loc','start','end'].includes(k)) continue; const v=n[k]; if(v&&typeof v==='object') rec(v,inDeferred); }
  })(node,false);
  return {ids,calls};
}
const issues=[];
for(const st of ast.body){
  if(st.type==='FunctionDeclaration') continue;
  // azonnal futó IIFE-k törzse azonnal fut → bele kell nézni; a többi függvénykifejezés halasztott
  let roots=[st];
  walk(st,n=>{ if(n.type==='CallExpression' && (n.callee.type==='FunctionExpression')) roots.push(n.callee.body); });
  const seen=new Set(); const queue=[];
  for(const r of roots){ const {ids,calls}=refs(r,true); ids.forEach(i=>queue.push([i,'közvetlen'])); calls.forEach(c=>queue.push(['()'+c,'hívás'])); }
  while(queue.length){
    const [x,via]=queue.shift(); if(seen.has(x)) continue; seen.add(x);
    if(x.startsWith('()')){ const f=funcs[x.slice(2)]; if(!f) continue;
      const {ids,calls}=refs(f.body,true); ids.forEach(i=>queue.push([i,x.slice(2)])); calls.forEach(c=>queue.push(['()'+c,x.slice(2)])); continue; }
    if(varPos[x]!==undefined && varPos[x]>st.start) issues.push(`sor ${st.loc.start.line}: "${x}" (a(z) ${via} függvényen át) — csak a ${ast.body.find(n=>n.start===varPos[x]).loc.start.line}. sorban kap értéket`);
  }
}
if(issues.length){ console.error('✗ indításkor még üres változót használ:\n'+issues.join('\n')); process.exit(1); }
console.log('✓ nincs indításkor üres változó');
