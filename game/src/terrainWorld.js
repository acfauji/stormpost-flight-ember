// Volcanic terrain, cliff aerodrome, threshold markings and a shader-lit wave field.
import {mesh,triangle,quad,box,ellipsoid,rod,torus,transform} from './webglEngine.js';
export const runway={x:420,y:100,z0:-1000,z1:-2250,width:68};
const peaks=[[-720,-1800,830,670],[1050,-2600,720,820],[-1500,-3700,600,950],[2100,-4900,950,1200],[-2600,-5200,1000,1300],[550,-1700,110,680],[-300,-1150,95,270]];
export function terrainHeight(x,z){let h=-15;for(let [cx,cz,a,r] of peaks){let d=Math.hypot((x-cx)/r,(z-cz)/r);let shape=Math.max(0,1-d);let ridge=1+.1*Math.sin(Math.atan2(z-cz,x-cx)*9+d*8);h=Math.max(h,a*Math.pow(shape,1.25)*ridge*(cx===-720&&d<.17?.72+.28*d/.17:1)-12);}if(Math.abs(x-runway.x)<85&&z<runway.z0+80&&z>runway.z1-100)h=100;return h;}
export function buildWorld(engine){
 let terrain=mesh(),water=mesh(),structures=mesh(),light=mesh(),foam=mesh(),lava=mesh();
 const h=(x,z)=>[x,terrainHeight(x,z),z];
 for(let z=-6800;z<1800;z+=75)for(let x=-4200;x<4200;x+=75){let a=h(x,z),b=h(x+75,z),c=h(x+75,z+75),d=h(x,z+75);if(Math.max(a[1],b[1],c[1],d[1])<-1)continue;let y=(a[1]+b[1]+c[1]+d[1])/4,noise=.035*Math.sin(x*31+z*.8);let color=y>450?[.27+noise,.28+noise,.29+noise]:y>150?[.23+noise,.29+noise,.25+noise]:[.28+noise,.39+noise,.29+noise];triangle(terrain,a,d,c,color);triangle(terrain,a,c,b,color);if(y<35&&y>-5)quad(foam,[x,1,z],[x+75,1,z],[x+75,1,z+14],[x,1,z+14],[.65,.77,.7]);}
 for(let z=-8500;z<2600;z+=120)for(let x=-7000;x<7000;x+=120)quad(water,[x,0,z],[x,0,z+120],[x+120,0,z+120],[x+120,0,z],[.035,.19,.23]);
 const {x,y,z0,z1,width}=runway;box(structures,[x,y-8,(z0+z1)/2],[width+26,16,z0-z1+50],[.24,.26,.24]);box(structures,[x,y+.2,(z0+z1)/2],[width,.5,z0-z1],[.095,.12,.14]);
 for(let z=z0-60;z>z1+60;z-=95)box(structures,[x,y+.6,z],[2,.12,42],[.8,.81,.71]);for(let side of [-1,1]){box(structures,[x+side*(width/2-3),y+.5,(z0+z1)/2],[.8,.15,z0-z1-30],[.86,.84,.71]);for(let i=0;i<7;i++)box(structures,[x+side*(5+i*3.7),y+.7,z0-32],[2.4,.15,42],[.86,.86,.76]);for(let z=z0+180;z>z1;z-=58){let c=z>z0?[.9,.65,.22]:[.2,.65,1];ellipsoid(light,[x+side*(width/2+4),y+1,z],[1.4,.9,1.4],c,5,6);}for(let z=z0-80;z>z0-260;z-=18)box(structures,[x+side*7,y+.75,z],[1.4,.05,12],[.035,.04,.04]);}
 for(let i=0;i<4;i++){box(structures,[x-55-i*6,y+1,z0-130],[3,2,3],[.16,.18,.18]);ellipsoid(light,[x-55-i*6,y+2,z0-127],[1.6,1,1],i<2?[1,.05,.02]:[1,.85,.65],5,8);}
 box(structures,[x+110,y+21,z0-350],[18,42,18],[.52,.5,.41]);box(structures,[x+110,y+45,z0-350],[29,10,27],[.09,.3,.34]);box(structures,[x+110,y+52,z0-350],[34,3,32],[.34,.39,.37]);rod(structures,[x+110,y+52,z0-350],[x+110,y+72,z0-350],.5,[.65,.64,.6]);box(structures,[x+120,y+5,z0-440],[60,10,40],[.4,.39,.33]);rod(structures,[x+80,y,z0-60],[x+80,y+23,z0-60],.7,[.8,.8,.7]);rod(structures,[x+80,y+22,z0-60],[x+94,y+20,z0-60],3,[1,.28,.06],12,1);
 // Painted runway designator and deterministic coastal detail are physical world geometry.
 box(structures,[x-8,y+.8,z0-95],[2.8,.12,22],[.86,.86,.76]);
 for(let zz of [-10,0,10])box(structures,[x+5,y+.8,z0-95+zz],[10,.12,2.5],[.86,.86,.76]);
 for(let xx of [0,10])box(structures,[x+xx,y+.8,z0-95],[2.5,.12,20],[.86,.86,.76]);
 for(let i=0;i<170;i++){let xx=Math.sin(i*12.3)*2800,zz=-500-((i*173)%4800),yy=terrainHeight(xx,zz);if(yy>4&&yy<150&&Math.abs(xx-x)>110){rod(structures,[xx,yy,zz],[xx+1,yy+9,zz],.6,[.2,.23,.16],5);ellipsoid(structures,[xx,yy+10,zz],[6,4,6],[.16,.28,.2],5,7);}}
 for(let i=0;i<130;i++){let xx=Math.sin(i*2.71)*3400,zz=-600-(i*83%5000);if(terrainHeight(xx,zz)<0){let size=8+(i%4)*4;quad(foam,[xx,2,zz],[xx+size,2,zz],[xx+size-2,2,zz+1],[xx-2,2,zz+1],[.51,.68,.66]);}}
 // Caldera is a mesh rim, not an overlay; the sunset catches its broken facets.
 torus(lava,[0,0,0],102,5,[1,.21,.015]);
 const geo={terrain:engine.upload(terrain),water:engine.upload(water),structures:engine.upload(structures),light:engine.upload(light),foam:engine.upload(foam),lava:engine.upload(lava)};
 return {draw(){engine.draw(geo.water,undefined,{water:true});engine.draw(geo.terrain);engine.draw(geo.structures);engine.draw(geo.foam,undefined,{alpha:.45});engine.draw(geo.light,undefined,{emission:1.8});engine.draw(geo.lava,transform([-720,675,-1800],[Math.PI/2,0,0]),{emission:1.1});},runway};
}
