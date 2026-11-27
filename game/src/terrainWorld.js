// Volcanic terrain, cliff aerodrome, threshold markings and a shader-lit wave field.
import {mesh,triangle,smoothTriangle,unit,quad,box,ellipsoid,rod,torus,transform} from './webglEngine.js';
import {buildLandmarks} from './airfieldLandmarks.js';
export const runway={x:420,y:100,z0:-1000,z1:-2250,width:68};
const peaks=[[-1280,-2050,860,950],[1570,-2900,690,850],[-1690,-3900,740,1100],[2390,-5050,1060,1300],[-2900,-5400,1120,1500],[-300,-1150,76,240],[180,-950,95,230]];
export function terrainHeight(x,z){let h=-15;for(let [cx,cz,a,r] of peaks){let d=Math.hypot((x-cx)/r,(z-cz)/r);let shape=Math.max(0,1-d);let ridge=1+.1*Math.sin(Math.atan2(z-cz,x-cx)*9+d*8);h=Math.max(h,a*Math.pow(shape,1.25)*ridge*(cx===-1280&&d<.17?.72+.28*d/.17:1)-12);}const along=Math.max(0,Math.max(z-(runway.z0-60),(runway.z1+30)-z));const across=Math.abs(x-runway.x);const edge=Math.max(across/360,along/260);const coast=100-110*Math.pow(Math.max(0,edge-.74)/.5,1.7);if(z<runway.z0+220&&z>runway.z1-260)h=Math.max(h,Math.min(100,coast));if(Math.abs(x-runway.x)<130&&z<runway.z0+45&&z>runway.z1-60)h=100;return h;}
export function buildWorld(engine){
 let terrain=mesh(),water=mesh(),structures=mesh(),light=mesh(),foam=mesh(),lava=mesh();
 const h=(x,z)=>[x,terrainHeight(x,z),z];
 const normal=p=>unit([terrainHeight(p[0]-5,p[2])-terrainHeight(p[0]+5,p[2]),10,terrainHeight(p[0],p[2]-5)-terrainHeight(p[0],p[2]+5)]);
 for(let z=-6800;z<1800;z+=50)for(let x=-4200;x<4200;x+=50){
  const a=h(x,z),b=h(x+50,z),c=h(x+50,z+50),d=h(x,z+50);
  if(Math.max(a[1],b[1],c[1],d[1])<-1)continue;
  smoothTriangle(terrain,a,d,c,[1,1,1],[a,d,c].map(normal));
  smoothTriangle(terrain,a,c,b,[1,1,1],[a,c,b].map(normal));
  // Follow the true waterline rather than painting square foam tiles.
  const points=[a,b,c,d,a];
  for(let i=0;i<4;i++){
   let u=points[i],v=points[i+1];
   if((u[1]>1)!==(v[1]>1)){
    const f=(1-u[1])/(v[1]-u[1]),xx=u[0]+(v[0]-u[0])*f,zz=u[2]+(v[2]-u[2])*f;
    const n=normal([xx,1,zz]),dx=n[2]*9,dz=-n[0]*9;
    quad(foam,[xx-dx,1.5,zz-dz],[xx+dx,1.5,zz+dz],[xx+dx+n[0]*4,1.5,zz+dz+n[2]*4],[xx-dx+n[0]*4,1.5,zz-dz+n[2]*4],[.69,.81,.74]);
   }
  }
 }
 for(let z=-9500;z<3000;z+=180)for(let x=-8000;x<8000;x+=180)quad(water,[x,0,z],[x,0,z+180],[x+180,0,z+180],[x+180,0,z],[.035,.19,.23]);
 const {x,y,z0,z1,width}=runway;box(structures,[x,y-8,(z0+z1)/2],[width+26,16,z0-z1+50],[.24,.26,.24]);box(structures,[x,y+.2,(z0+z1)/2],[width,.5,z0-z1],[.095,.12,.14]);
 for(let z=z0-60;z>z1+60;z-=95)box(structures,[x,y+.6,z],[2,.12,42],[.8,.81,.71]);for(let side of [-1,1]){box(structures,[x+side*(width/2-3),y+.5,(z0+z1)/2],[.8,.15,z0-z1-30],[.86,.84,.71]);for(let i=0;i<7;i++)box(structures,[x+side*(5+i*3.7),y+.7,z0-32],[2.4,.15,42],[.86,.86,.76]);for(let z=z0+180;z>z1;z-=58){let c=z>z0?[.9,.65,.22]:[.2,.65,1];ellipsoid(light,[x+side*(width/2+4),y+1,z],[.24,.12,.24],c,5,6);}for(let z=z0-80;z>z0-260;z-=18)box(structures,[x+side*7,y+.75,z],[1.4,.05,12],[.035,.04,.04]);}
 // Four ground-mounted PAPI housings at the touchdown zone: two white / two red.
 for(let i=0;i<4;i++){box(structures,[x-55-i*10,y+.85,z0-240],[2.2,1.1,1.5],[.16,.18,.18]);ellipsoid(light,[x-55-i*10,y+1.05,z0-239.1],[1.25,.72,.34],i<2?[1,.99,.91]:[1,.025,.008],10,14);}
 box(structures,[x+110,y+21,z0-350],[18,42,18],[.52,.5,.41]);box(structures,[x+110,y+45,z0-350],[29,10,27],[.09,.3,.34]);box(structures,[x+110,y+52,z0-350],[34,3,32],[.34,.39,.37]);rod(structures,[x+110,y+52,z0-350],[x+110,y+72,z0-350],.5,[.65,.64,.6]);box(structures,[x+120,y+5,z0-440],[60,10,40],[.4,.39,.33]);rod(structures,[x+80,y,z0-60],[x+80,y+23,z0-60],.7,[.8,.8,.7]);
 // Painted runway designator and deterministic coastal detail are physical world geometry.
 box(structures,[x-14,y+.9,z0-128],[2,.13,30],[.97,.96,.85]);
 box(structures,[x-14,y+.9,z0-113],[7,.13,2],[.97,.96,.85]);
 for(let zz of [-15,0,15])box(structures,[x+9,y+.9,z0-128+zz],[10,.13,2],[.97,.96,.85]);
 for(let xx of [4,14])box(structures,[x+xx,y+.9,z0-128],[2,.13,30],[.97,.96,.85]);
 for(let i=0;i<170;i++){let xx=Math.sin(i*12.3)*2800,zz=-500-((i*173)%4800),yy=terrainHeight(xx,zz);if(yy>4&&yy<150&&Math.abs(xx-x)>110){rod(structures,[xx,yy,zz],[xx+1,yy+9,zz],.6,[.2,.23,.16],5);ellipsoid(structures,[xx,yy+10,zz],[6,4,6],[.16,.28,.2],5,7);}}
 for(let i=0;i<130;i++){let xx=Math.sin(i*2.71)*3400,zz=-600-(i*83%5000);if(terrainHeight(xx,zz)<0){let size=8+(i%4)*4;quad(foam,[xx,2,zz],[xx+size,2,zz],[xx+size-2,2,zz+1],[xx-2,2,zz+1],[.51,.68,.66]);}}
 // Caldera is a mesh rim, not an overlay; the sunset catches its broken facets.
 torus(lava,[0,0,0],102,5,[1,.21,.015]);
 const landmarks=buildLandmarks(engine,runway,terrainHeight);
 const geo={terrain:engine.upload(terrain),water:engine.upload(water),structures:engine.upload(structures),light:engine.upload(light),foam:engine.upload(foam),lava:engine.upload(lava)};
 return {draw(t=0){
  engine.draw(geo.water,undefined,{water:true});
  engine.draw(geo.terrain,undefined,{terrain:1});engine.draw(geo.structures);
  engine.draw(geo.foam,undefined,{alpha:.48,emission:.12});
  engine.draw(geo.light,undefined,{emission:1.2});
  engine.draw(geo.lava,transform([-1280,terrainHeight(-1280,-2050)+3,-2050],[Math.PI/2,0,0]),{emission:.65+Math.sin(t)*.12});
  landmarks.draw(t);
 },runway};
}
