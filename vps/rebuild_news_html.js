#!/usr/bin/env node
// Energetika.html Hírek-adatának frissítése a news/*.md fájlokból.
// A napokat (dátum/fejléc/HTML/szöveg) újragenerálja; a hónap kulcsszavait
// megőrzi a fájl korábbi állapotából (ha van), különben mechanikusan képzi.
const fs=require('fs'), path=require('path');
const ROOT=path.resolve(__dirname,'..');
const FP=path.join(ROOT,'Energetika.html');

function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function inline(s){s=esc(s);s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');s=s.replace(/\*([^*]+)\*/g,'<em>$1</em>');s=s.replace(/(https?:\/\/[^\s<>"]+)/g,'<a href="$1" target="_blank" rel="noopener" onclick="window.top.open(this.href,\'_blank\');return false;">$1</a>');return s;}
function mdToHtml(md){
  const lines=md.split('\n'),out=[];let inList=false;
  const close=()=>{if(inList){out.push('</ul>');inList=false;}};
  for(let i=0;i<lines.length;i++){const t=lines[i].replace(/\s+$/,'');
    if(/^###\s+/.test(t)){close();out.push('<h3>'+inline(t.replace(/^###\s+/,''))+'</h3>');}
    else if(/^-\s+/.test(t)){if(!inList){out.push('<ul>');inList=true;}out.push('<li>'+inline(t.replace(/^-\s+/,''))+'</li>');}
    else if(/^-{3,}\s*$/.test(t)){close();out.push('<hr />');}
    else if(t===''){close();}
    else{close();out.push('<p>'+inline(t)+'</p>');}
  }
  close();return out.join('\n');
}
function parseMonth(md){
  const parts=md.split(/\n(?=##\s+\d{4}-\d{2}-\d{2})/);
  const head=parts[0];
  const tm=head.match(/^#\s+(.+)$/m);const title=tm?tm[1].trim():'';
  const intro=head.split('\n').filter(l=>/^>/.test(l)).map(l=>l.replace(/^>\s?/,'').trim()).filter(Boolean).join(' ');
  const days=[],kw={};
  for(let i=1;i<parts.length;i++){const blk=parts[i];
    const hm=blk.match(/^##\s+(\d{4}-\d{2}-\d{2})[^\n]*/);if(!hm)continue;
    const date=hm[1],day=date.slice(8,10),header=hm[0].replace(/^##\s+/,'').trim();
    const body=blk.slice(hm[0].length).replace(/^\s+/,'');
    const html=mdToHtml(body);const text=html.replace(/<[^>]+>/g,' ').toLowerCase();
    days.push({date,day,header,html,text});
    let m;const re=/\*\*Kulcsszavak:\*\*\s*([^\n]+)/g;
    while((m=re.exec(body))){m[1].split(',').forEach(k=>{k=k.trim().toLowerCase();if(k)kw[k]=(kw[k]||0)+1;});}
  }
  const keywords=Object.entries(kw).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'hu'));
  return {title,intro,days,keywords};
}
function buildNEWS(){
  const dir=path.join(ROOT,'news');
  const NEWS={};
  fs.readdirSync(dir).filter(f=>/\.md$/i.test(f)).forEach(f=>{
    const m=f.match(/(\d{4})-(\d{2})/);if(!m)return;
    (NEWS[m[1]]=NEWS[m[1]]||{})[m[2]]=parseMonth(fs.readFileSync(path.join(dir,f),'utf8'));});
  return NEWS;
}
function unesc(x){return x.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&#39;/g,"'").replace(/&amp;/g,'&');}
function escF(x){return x.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');}
function locateSrc(html){
  const mi=html.indexOf('id="view-news"');
  const s=html.indexOf('srcdoc="',mi)+'srcdoc="'.length;
  const e=html.indexOf('"',s);
  return {s,e,src:unesc(html.slice(s,e))};
}
function extractNEWS(src){
  const ki=src.indexOf('const NEWS = ');if(ki<0)return null;
  const bi=src.indexOf('{',ki);let d=0,inS=false,e=false,end=-1;
  for(let k=bi;k<src.length;k++){const c=src[k];
    if(inS){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')inS=false;continue;}
    if(c==='"'){inS=true;continue;}
    if(c==='{')d++;else if(c==='}'){d--;if(d===0){end=k+1;break;}}}
  return {bi,end,obj:JSON.parse(src.slice(bi,end))};
}
function run(){
  const NEWS=buildNEWS();
  const html=fs.readFileSync(FP,'utf8');
  const {s,e,src}=locateSrc(html);
  const ex=extractNEWS(src);
  // meglévő kulcsszavak megőrzése hónaponként
  if(ex&&ex.obj){for(const y in NEWS){for(const m in NEWS[y]){
    if(ex.obj[y]&&ex.obj[y][m]&&Array.isArray(ex.obj[y][m].keywords))NEWS[y][m].keywords=ex.obj[y][m].keywords;
  }}}
  const newSrc=src.slice(0,ex.bi)+JSON.stringify(NEWS)+src.slice(ex.end);
  const out=html.slice(0,s)+escF(newSrc)+html.slice(e);
  fs.writeFileSync(FP,out);
  if(process.argv.includes('--dump'))fs.writeFileSync('/tmp/new_news.json',JSON.stringify(NEWS));
  console.log('Energetika.html frissítve | méret:',out.length);
  Object.keys(NEWS).sort().forEach(y=>Object.keys(NEWS[y]).sort().forEach(m=>{
    const o=NEWS[y][m];console.log('  '+y+'-'+m+' -> napok:',o.days.length,'| kulcsszavak:',o.keywords.length);}));
}
if(require.main===module) run();
module.exports={buildNEWS,parseMonth};
