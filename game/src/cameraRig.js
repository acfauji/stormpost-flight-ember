// Spring-damped chase and pilot-selectable cockpit look directions.
import {transform} from './webglEngine.js';
export function aircraftPoint(s,p){
 const m=transform(s.pos,[s.pitch,s.heading,s.roll]);
 return [0,1,2].map(i=>m[i]*p[0]+m[4+i]*p[1]+m[8+i]*p[2]+m[12+i]);
}
export function createCameraRig(){
 let eye=null;
 return {reset(){eye=null;},update(s,dt){
  const cockpit=s.camera==='cockpit',crashed=s.status==='crashed';
  const desired=aircraftPoint(s,cockpit?[0,2.5,-10.5]:crashed?[78,20,72]:s.gear?[0,14,64]:[16,19,77]);
  // A stationary renderer still follows flight state; no stored camera can lag a long tick batch.
  if(!eye||s.paused||Math.hypot(...desired.map((v,i)=>v-eye[i]))>40)eye=desired;
  else eye=eye.map((v,i)=>v+(desired[i]-v)*(1-Math.exp(-dt*8)));
  let target=cockpit?aircraftPoint(s,[(s.look||0)*140,2,s.look?-35:-150]):crashed?aircraftPoint(s,[-4,8,0]):aircraftPoint(s,[0,-1,-65]);
  const bank=cockpit?s.roll:s.roll*.23;
  return {eye,target,up:[-Math.sin(bank),Math.cos(bank),0],fov:cockpit?1.12:.91};
 }};
}
