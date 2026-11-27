// Built coastal navigation: lighthouse, harbor, tower radar, runway lights and windsock.
import {mesh,box,rod,ellipsoid,transform} from './webglEngine.js';
export function buildLandmarks(engine,runway,height){
 const stone=[.60,.58,.49],ivory=[.88,.83,.66],dark=[.11,.17,.20],amber=[1,.59,.16];
 const buildings=mesh(),lamps=mesh(),radar=mesh(),sock=mesh(),beam=mesh();
 const lx=180,lz=-950,ly=Math.max(3,height(lx,lz));
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
 const g=Object.fromEntries(Object.entries({buildings,lamps,radar,sock,beam}).map(([k,m])=>[k,engine.upload(m)]));
 return {draw(t){
  engine.draw(g.buildings);engine.draw(g.lamps,undefined,{emission:1.6});
  engine.draw(g.radar,transform([tx,ty,tz],[0,t*.4,0]),{metal:.5});
  engine.draw(g.sock,transform([runway.x+80,runway.y+22,runway.z0-60],[0,.35+Math.sin(t*.7)*.12,Math.sin(t*2)*.025]));
  engine.draw(g.beam,transform([lx,ly+51,lz],[0,t*.24,0]),{emission:.9,alpha:.045});
 }};
}
