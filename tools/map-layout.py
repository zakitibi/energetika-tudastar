"""Piaci térkép elrendezés-optimalizáló.

Az Energetika.html MP_NODES / MP_EDGES adataiból olyan x-pozíciókat (sávon belül) és
él-görbítéseket keres, amelyeknél egyik él sem fut át idegen szereplő dobozán, az azonos
pár élei nem fedik egymást, és a dobozok nem lógnak egymásba. A fájlt NEM írja át: a
javasolt értékeket kiírja, azokat kell átvezetni a MP_NODES x-eibe és a MP_EDGES 5. elemébe.

Használat (a repó gyökeréből):  python3 tools/map-layout.py [iterációk=24000] [vászonszélesség=1900] [seed=11]
Futásidő: kb. 2,5 perc / 24000 iteráció. Érdemes 2-3 kört futtatni (az eredmény a kiinduló állapot).
"""
import re,random,math,json,sys
s=open('Energetika.html',encoding='utf-8').read()
nodes={}
for m in re.finditer(r"^\s*(\w+):\s*\['([^']*)','([^']*)',(\d),(\d+),(\d+),",s,re.M):
    nodes[m.group(1)]=dict(label=m.group(2),lane=int(m.group(4)),x=int(m.group(5)),y=int(m.group(6)))
edges=[]; FILE_BEND={}
for i,m in enumerate(re.finditer(r"^\s*\['(\w+)','(\w+)','(reg|ctl|pay|own)','[^']*'(?:,(-?\d+))?\]",s,re.M)):
    edges.append((m.group(1),m.group(2),m.group(3))); FILE_BEND[i]=int(m.group(4) or 0)
CW=float(sys.argv[2]) if len(sys.argv)>2 else 1900
def W(id): return max(220,len(nodes[id]['label'])*9.5+40)
pairs={}
for i,(a,b,t) in enumerate(edges): pairs.setdefault('|'.join(sorted([a,b])),[]).append(i)
B0={}
for k,ids in pairs.items():
    a0=k.split('|')[0]
    for j,i in enumerate(ids):
        v=0 if len(ids)==1 else (j-(len(ids)-1)/2)*70
        B0[i]=v if edges[i][0]==a0 else -v
U=[k/30 for k in range(1,30)]
def curve(X,Bd,i):
    a,b,t=edges[i]; ax,ay=X[a],nodes[a]['y']; bx,by=X[b],nodes[b]['y']
    mx,my=(ax+bx)/2,(ay+by)/2; dx,dy=bx-ax,by-ay; L=math.hypot(dx,dy) or 1
    cx,cy=mx-dy/L*Bd[i],my+dx/L*Bd[i]
    return [((1-u)**2*ax+2*(1-u)*u*cx+u*u*bx,(1-u)**2*ay+2*(1-u)*u*cy+u*u*by) for u in U],L
def hitlist(X,Bd):
    out=[]
    for i,(a,b,t) in enumerate(edges):
        pts,L=curve(X,Bd,i)
        for n,d in nodes.items():
            if n in (a,b): continue
            if any(abs(px-X[n])<W(n)/2+14 and abs(py-d['y'])<47 for px,py in pts): out.append((i,a,b,n))
        # ne lépjen ki a vászonról
    return out
def canon(i,Bd):   # a pár kanonikus irányára vetített görbítés
    a,b,t=edges[i]; return Bd[i] if a<b else -Bd[i]
def cost(X,Bd):
    c=len(hitlist(X,Bd))*100
    for i in range(len(edges)):
        pts,L=curve(X,Bd,i); c+=L*0.02+abs(Bd[i])*0.04
        for px,py in pts:
            if px<10 or px>CW-10: c+=5
    for k,ids in pairs.items():                      # azonos pár élei ne fedjék egymást
        for p in range(len(ids)):
            for q in range(p+1,len(ids)):
                d=abs(canon(ids[p],Bd)-canon(ids[q],Bd))
                if d<60: c+=(60-d)*5
    for lane in range(6):
        ids=sorted([n for n in nodes if nodes[n]['lane']==lane],key=lambda n:X[n])
        for p,q in zip(ids,ids[1:]):
            gap=X[q]-X[p]-(W(p)+W(q))/2
            if gap<40: c+=(40-gap)*20
        for n in ids:
            if X[n]-W(n)/2<190: c+=(190-(X[n]-W(n)/2))*20
            if X[n]+W(n)/2>CW-20: c+=(X[n]+W(n)/2-(CW-20))*20
    return c
X={n:d['x'] for n,d in nodes.items()}                 # a fájl jelenlegi állapotából indul
Bd={i:(FILE_BEND[i] if any(FILE_BEND.values()) else B0[i]) for i in range(len(edges))}
print("KIINDULÓ: költség",round(cost(X,Bd)),"| átfutások:",len(hitlist(X,Bd)))
random.seed(int(sys.argv[3]) if len(sys.argv)>3 else 11); bc=cost(X,Bd); N=int(sys.argv[1]) if len(sys.argv)>1 else 24000
for it in range(N):
    X2=dict(X); B2=dict(Bd)
    if random.random()<.5:
        n=random.choice(list(nodes)); X2[n]+=random.gauss(0,80 if it<N//2 else 25)
        if random.random()<.1:
            m=random.choice([k for k in nodes if nodes[k]['lane']==nodes[n]['lane']]); X2[n],X2[m]=X2[m],X2[n]
    else:
        i=random.randrange(len(edges)); B2[i]+=random.gauss(0,70 if it<N//2 else 25); B2[i]=max(-320,min(320,B2[i]))
    c=cost(X2,B2)
    if c<bc: X,Bd,bc=X2,B2,c
hl=hitlist(X,Bd)
print("OPTIMALIZÁLT: költség",round(bc),"| átfutások:",len(hl))
for i,a,b,n in hl: print("  maradt:",a,"→",b,"átfut:",n)
print("JAVASOLT x-ek (MP_NODES):",json.dumps({n:round(v) for n,v in X.items()}))
print("JAVASOLT görbítések (MP_EDGES 5. elem, az élek sorrendjében):",[round(Bd[i]) for i in range(len(edges))])
