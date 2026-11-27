// Built coastal navigation: lighthouse, harbor, tower radar, runway lights and windsock.
import {mesh,box,rod,ellipsoid,transform,quad} from './webglEngine.js';
export function buildLandmarks(engine,runway,height){
 const stone=[.60,.58,.49],ivory=[.88,.83,.66],dark=[.11,.17,.20],amber=[1,.59,.16];
 const buildings=mesh(),lamps=mesh(),radar=mesh(),sock=mesh(),beam=mesh(),trees=mesh();
 const groves=[[-930,-1480],[-1380,-2460],[1080,-2880],[-2180,-3660],[2050,-4320],[-520,-4700],[800,-5300],[-2780,-5200]];
 for(let grove=0;grove<groves.length;grove++){
  const [gx,gz]=groves[grove];
  for(let i=0;i<11;i++){
   const a=i*2.399+grove*.67,x=gx+Math.cos(a)*(35+(i%3)*17),z=gz+Math.sin(a)*(38+(i%4)*13),y=height(x,z);
   if(y<8)continue;
   const trunk=6+(i%3)*1.5;
   rod(trees,[x,y,z],[x,y+trunk,z],.8,[.23,.19,.14],7);
   for(let tier=0;tier<3;tier++){
    const base=y+trunk-2+tier*7,radius=7.8-tier*.75+(i%3)*.65;
    rod(trees,[x,base,z],[x,y+trunk+10+tier*1.3,z],radius,[.065+tier*.012,.19+tier*.016,.15+tier*.012],9,.18);
   }
  }
 }
 const lx=140,lz=-1690,ly=Math.max(3,height(lx,lz));
 for(let j=0;j<6;j++)rod(buildings,[lx,ly+j*8,lz],[lx,ly+(j+1)*8,lz],7-j*.45,j%2?ivory:[.25,.30,.30],18,6.55-j*.45);
 rod(buildings,[lx,ly+48,lz],[lx,ly+53,lz],7.5,dark,20);
 rod(lamps,[lx,ly+49,lz],[lx,ly+52,lz],5,amber,20);
 rod(buildings,[lx,ly+54,lz],[lx,ly+58,lz],8,dark,20,0);
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;
  rod(buildings,[lx+Math.sin(a)*8,ly+47,lz+Math.cos(a)*8],[lx+Math.sin(a)*8,ly+50,lz+Math.cos(a)*8],.16,ivory,4);
 }
 box(buildings,[lx+15,ly+5,lz+8],[18,10,13],ivory);
 box(buildings,[lx+15,ly+11,lz+8],[21,2,17],[.37,.22,.16]);
 rod(beam,[0,0,0],[0,0,-180],.8,[1,.77,.36],16,20);
 // Pier timber, mooring posts and two modest workboats sit below the cliff strip.
 for(let j=0;j<18;j++)box(buildings,[800,4,-1540+j*5],[15,.6,4.7],[.35,.27,.19]);
 for(let j=0;j<5;j++)for(let side of [-1,1])rod(buildings,[800+side*6,-3,-1540+j*20],[800+side*6,8,-1540+j*20],.6,stone,6);
 for(let j=0;j<2;j++){
  ellipsoid(buildings,[820+j*19,2.5,-1510+j*26],[5,3,13],[.70,.73,.66],8,14);
  box(buildings,[820+j*19,6,-1511+j*26],[6,5,9],ivory);
 }
 // Three insulated coastal hangars frame the approach without closing the runway corridor.
 for(const [hx,hz,scale] of [[runway.x+175,-1040,1],[runway.x+182,-1370,.88],[runway.x-184,-1190,.76]]){
  const gy=runway.y;
  box(buildings,[hx,gy+13,hz],[82*scale,26*scale,68*scale],[.33,.38,.38]);
  const half=41*scale,depth=34*scale,wall=gy+26*scale,ridge=gy+39*scale;
  quad(buildings,[hx-half,wall,hz-depth],[hx, ridge,hz-depth],[hx, ridge,hz+depth],[hx-half,wall,hz+depth],[.42,.46,.43]);
  quad(buildings,[hx, ridge,hz-depth],[hx+half,wall,hz-depth],[hx+half,wall,hz+depth],[hx,ridge,hz+depth],[.38,.42,.40]);
  box(buildings,[hx,gy+10*scale,hz+depth+.8],[49*scale,18*scale,1.2],[.085,.13,.15]);
  for(let k=-1;k<=1;k++)box(buildings,[hx+k*17*scale,gy+18*scale,hz+depth+1.6],[1.2,2.2,1],[.9,.56,.23]);
 }
 // A double tank, pump island and pipe run identify the island's fuel depot.
 for(const [fx,fz] of [[runway.x+300,-1290],[runway.x+300,-1352]]){
  rod(buildings,[fx,runway.y+1,fz],[fx,runway.y+21,fz],10,[.64,.66,.59],18,10);
  rod(buildings,[fx-12,runway.y+2,fz],[fx+12,runway.y+2,fz],1.1,[.31,.37,.35],8);
  box(buildings,[fx,runway.y+1.5,fz+13],[18,3,8],[.24,.29,.28]);
 }
 for(let j=0;j<5;j++)box(buildings,[runway.x+265,runway.y+.7,-1260-j*18],[2,.3,12],[.94,.47,.12]);
 const tx=runway.x+110,tz=runway.z0-350,ty=runway.y+73;
 box(radar,[0,0,0],[24,1,1.2],[.63,.78,.73]);
 rod(radar,[0,0,0],[0,4,0],.4,dark,6);
 rod(sock,[0,0,0],[17,-2,0],2.1,[1,.39,.08],12,.7);
 for(let i=0;i<4;i++)rod(sock,[i*4,-i*.45,0],[i*4+1.6,-i*.45-.2,0],2.1-i*.31,ivory,12,1.9-i*.31);
 // Precision touchdown blocks and flush centerline lamps.
 for(let side of [-1,1])for(let j=0;j<3;j++){
  box(buildings,[runway.x+side*19,runway.y+.85,runway.z0-220-j*90],[5,.12,30],ivory);
 }
 for(let z=runway.z0-70;z>runway.z1+30;z-=45)ellipsoid(lamps,[runway.x,runway.y+1,z],[.12,.07,.12],[.68,.88,1],6,8);
 const g=Object.fromEntries(Object.entries({buildings,lamps,radar,sock,beam,trees}).map(([k,m])=>[k,engine.upload(m)]));
 return {draw(t){
  engine.draw(g.trees);
  engine.draw(g.buildings);engine.draw(g.lamps,undefined,{emission:1.6});
  engine.draw(g.radar,transform([tx,ty,tz],[0,t*.4,0]),{metal:.5});
  engine.draw(g.sock,transform([runway.x+80,runway.y+22,runway.z0-60],[0,.35+Math.sin(t*.7)*.12,Math.sin(t*2)*.025]));
  engine.draw(g.beam,transform([lx,ly+51,lz],[0,t*.24,0]),{emission:.9,alpha:.045});
 }};
}
