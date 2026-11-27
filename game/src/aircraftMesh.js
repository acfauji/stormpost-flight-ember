// Original twin turboprop: separate metal airframe, articulated controls and impact damage.
import {mesh,box,ellipsoid,rod,quad,transform,multiply} from './webglEngine.js';
export function buildAircraft(engine){
 const white=[.83,.86,.79],orange=[1,.28,.06],dark=[.04,.075,.095],metal=[.34,.43,.47],glass=[.08,.34,.43];
 const hull=mesh(),canopy=mesh(),gear=mesh(),disc=mesh(),blade=mesh(),flap=mesh(),tail=mesh(),trail=mesh();
 ellipsoid(hull,[0,0,0],[2.6,2.8,16],white,18,28);
 ellipsoid(hull,[0,1,-10],[2.5,2.4,5],orange,14,22);
 ellipsoid(hull,[0,-.4,3],[2.65,1.8,8],orange,14,22);
 for(let side of [-1,1]){
  for(let z of [-6,-2,2,6])ellipsoid(hull,[side*2.52,1.1,z],[.08,.65,.85],glass,8,12);
  quad(hull,[side*1,1.5,11],[side*8,1.5,14],[side*8,1.5,16],[side*1,1.5,15],white);
 }
 quad(hull,[0,1,7],[0,8,13],[0,8,16],[0,1,16],orange);
 box(hull,[0,7.6,14],[.6,.8,3.5],white);
 // Canopy panes catch the sky, with a narrow ivory center mullion.
 ellipsoid(canopy,[0,1.9,-10.1],[2.25,1.7,4.2],glass,14,24);
 rod(canopy,[-2.1,2,-11],[2.1,2,-11],.085,white);
 rod(canopy,[0,3.4,-13],[0,3.6,-7],.085,white);
 const wings=[],engines=[];
 for(let side of [-1,1]){
  const wing=mesh(),nacelle=mesh();
  const a=[side*2,2.1,-3],b=[side*22,1,1],c=[side*20,1,5],d=[side*2,2,4];
  quad(wing,a,b,c,d,white);
  quad(wing,a,d.map((v,i)=>i===1?v-.5:v),c.map((v,i)=>i===1?v-.25:v),b,white);
  box(wing,[side*20.1,1.05,2.8],[2.7,.45,4.8],orange);
  // Leading-edge boot and nacelle panel seams are modeled, not texture imports.
  rod(wing,[side*2,2.1,-3],[side*22,1,1],.17,dark,8);
  ellipsoid(nacelle,[side*9,1.4,-2],[2,2,6.5],metal,12,22);
  ellipsoid(nacelle,[side*9,1.4,-7],[1.6,1.6,2.7],orange,12,22);
  rod(nacelle,[side*9,1.4,-9],[side*9,1.4,-10],.9,metal,20,.3);
  wings.push(engine.upload(wing));engines.push(engine.upload(nacelle));
  // Wide-set main wheels remain visible below the nacelles on short final.
  rod(gear,[side*9,-.2,0],[side*9,-6.4,1],.25,metal,10);
  rod(gear,[side*6,-1.7,2],[side*9,-5.4,1],.16,metal,8);
  ellipsoid(gear,[side*9,-6.6,1],[.85,1.2,1.2],dark,12,16);
  ellipsoid(gear,[side*9.75,-6.6,1],[.08,.45,.45],metal,8,12);
 }
 rod(gear,[0,-1.6,-9],[0,-6,-9],.22,metal,10);
 ellipsoid(gear,[0,-6.2,-9],[.6,.95,.95],dark,10,16);
 rod(disc,[0,0,-.025],[0,0,.025],4.7,[.63,.77,.79],56);
 box(blade,[0,0,0],[.45,8.7,.12],dark);box(blade,[0,0,0],[8.7,.45,.12],dark);
 box(flap,[0,0,0],[7,.22,2.6],orange);box(tail,[0,0,0],[10,.16,1.3],white);
 rod(trail,[0,0,0],[0,0,36],.085,[.75,.86,.89],6,.015);
 const nav=mesh();ellipsoid(nav,[0,0,0],[.30,.25,.48],[1,.035,.025],10,14);
 const nav2=mesh();ellipsoid(nav2,[0,0,0],[.30,.25,.48],[.03,1,.49],10,14);
 const g=Object.fromEntries(Object.entries({hull,canopy,gear,disc,blade,flap,tail,trail,nav,nav2}).map(([k,m])=>[k,engine.upload(m)]));
 let gearTravel=0;
 return function drawAircraft(s,t){
  const base=transform(s.pos,[s.pitch,s.heading,s.roll]),crashed=s.status==='crashed';
  const local=(p,r=[0,0,0],scale=[1,1,1])=>multiply(base,transform(p,r,scale));
  engine.draw(g.hull,base,{metal:.7});engine.draw(g.canopy,base,{alpha:crashed?.60:.90,metal:1});
  gearTravel+=(Number(s.gear)-gearTravel)*.25;
  if(s.paused)gearTravel=Number(s.gear);
  if(gearTravel>.015)engine.draw(g.gear,local([0,0,0],[0,0,(1-gearTravel)*.55],[1,Math.max(.1,gearTravel),1]),{metal:.6});
  for(let [i,side] of [-1,1].entries()){
   const broken=crashed&&side<0;
   const wingPose=broken?local([-5,-4,1],[.14,.10,-.42]):base;
   const enginePose=broken?local([-3,-3,-1],[.27,.16,-.23]):base;
   engine.draw(wings[i],wingPose,{metal:.55});engine.draw(engines[i],enginePose,{metal:.72});
   const propPose=local([side*9+(broken?-3:0),1.4+(broken?-3:0),-9],[broken?.28:0,0,crashed?.31:t*35]);
   if(!crashed&&s.speed>20)engine.draw(g.disc,propPose,{alpha:.15,metal:.8});
   else engine.draw(g.blade,propPose,{metal:.3});
   engine.draw(g.flap,local([side*15,1,4.7],[s.flaps*.48+side*s.roll*.15,0,broken?-.5:0]),{metal:.5});
   if(!broken){
    const light=side<0?g.nav:g.nav2;
    engine.draw(light,local([side*22,1,2]),{emission:2.2});
    engine.draw(light,local([side*22,1,2],[0,0,0],[3,3,3]),{emission:2,alpha:.09,soft:true});
   }
   if(s.speed>35&&s.status==='flying')engine.draw(g.trail,local([side*21,1.2,4]),{alpha:.18});
  }
  engine.draw(g.tail,local([0,1.5,15],[s.pitch*1.8,0,0]),{metal:.4});
 };
}
