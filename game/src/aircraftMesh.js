// Twin turboprop airframe: original articulated meshes, propellers, gear and navigation lights.
import {mesh,box,ellipsoid,rod,triangle,quad,torus,transform,multiply} from './webglEngine.js';
export function buildAircraft(engine){
 const white=[.78,.84,.8],orange=[1,.26,.055],dark=[.045,.09,.12],metal=[.32,.4,.43],glass=[.07,.32,.4];
 let body=mesh();ellipsoid(body,[0,0,0],[2.6,2.8,16],white,12,20);ellipsoid(body,[0,1,-10],[2.5,2.4,5],orange,10,16);ellipsoid(body,[0,-.4,3],[2.65,1.8,8],orange,8,16);
 for(let side of [-1,1]){
  let a=[side*2,2.1,-3],b=[side*22,1,1],c=[side*20,1,5],d=[side*2,2,4];quad(body,a,b,c,d,white);quad(body,a,d.map((v,i)=>i===1?v-.5:v),c.map((v,i)=>i===1?v-.25:v),b,white);
  box(body,[side*20.1,1.05,2.8],[2.7,.45,4.8],orange);
  ellipsoid(body,[side*9,1.4,-2],[2,2,6.5],metal,8,14);ellipsoid(body,[side*9,1.4,-7],[1.6,1.6,2.7],orange,8,14);
  for(let z of [-6,-2,2,6])ellipsoid(body,[side*2.5,1.1,z],[.07,.65,.85],glass,6,8);
  quad(body,[side*1,1.5,11],[side*8,1.5,14],[side*8,1.5,16],[side*1,1.5,15],white);
 }
 quad(body,[0,1,7],[0,8,13],[0,8,16],[0,1,16],orange);box(body,[0,7.6,14],[.6,.8,3.5],white);
 let canopy=mesh();ellipsoid(canopy,[0,1.9,-10.1],[2.25,1.7,4.2],glass,8,14);rod(canopy,[-2.1,2,-11],[2.1,2,-11],.09,white);rod(canopy,[0,3.4,-13],[0,3.6,-7],.09,white);
 let gear=mesh();for(let s of [-1,1]){rod(gear,[s*3,-1.5,2],[s*4,-5,2],.25,metal);ellipsoid(gear,[s*4,-5.2,2],[.65,1.1,1.1],dark,8,12);}rod(gear,[0,-1.6,-9],[0,-5,-9],.22,metal);ellipsoid(gear,[0,-5,-9],[.5,.85,.85],dark,8,12);
 let disc=mesh();rod(disc,[0,0,-.025],[0,0,.025],4.7,[.66,.76,.77],40);let blade=mesh();box(blade,[0,0,0],[.55,8.7,.16],dark);box(blade,[0,0,0],[8.7,.55,.16],dark);
 let control=mesh();box(control,[0,0,0],[7,.18,1.2],orange);
 let navR=mesh(),navG=mesh();ellipsoid(navR,[0,0,0],[.35,.3,.5],[1,.025,.02],6,8);ellipsoid(navG,[0,0,0],[.35,.3,.5],[.05,1,.52],6,8);
 let trail=mesh();rod(trail,[0,0,0],[0,0,40],.13,[.67,.83,.9],6,.025);
 const g=Object.fromEntries(Object.entries({body,canopy,gear,disc,blade,control,navR,navG,trail}).map(([k,v])=>[k,engine.upload(v)]));
 return function drawAircraft(s,t){let base=transform(s.pos,[s.pitch,s.heading,s.roll]);const local=(p,r=[0,0,0],scale=[1,1,1])=>multiply(base,transform(p,r,scale));engine.draw(g.body,base);engine.draw(g.canopy,base,{alpha:.87});if(s.gear)engine.draw(g.gear,base);for(let side of [-1,1]){engine.draw(g.disc,local([side*9,1.4,-9]),{alpha:.17});engine.draw(g.blade,local([side*9,1.4,-9],[0,0,t*35]));engine.draw(g.control,local([side*15,1,4.7],[s.flaps*.4+side*s.roll*.15,0,0]));engine.draw(side<0?g.navR:g.navG,local([side*22,1,2]),{emission:2});if(s.speed>35&&s.status==='flying')engine.draw(g.trail,local([side*21,1.2,4]),{alpha:.3});}engine.draw(g.control,local([0,1.5,15],[s.pitch*1.8,0,0],[1.8,1,1]));};
}
