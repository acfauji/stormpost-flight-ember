// Lift, drag, angle of attack, coordinated turns, crosswind and ground effect.
import {terrainHeight} from './terrainWorld.js';
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function initialFlight(contract=1){return {pos:[-250,360,240],pitch:.035,roll:-.16,heading:.04,speed:72,verticalSpeed:0,throttle:.72,flaps:0,gear:false,fuel:100,hull:100,status:'flying',contract,route:'STORM CORRIDOR',elapsed:0,stall:false,aoa:0,score:0,drop:false,brake:false,camera:'chase',wind:0,cause:'',flare:'',paused:false};}
export function updateAerodynamics(s,input,dt){
 if(s.status!=='flying'||s.paused)return;dt=Math.min(dt,.04);s.elapsed+=dt;
 s.throttle=clamp(s.throttle+input.throttle*dt*.22,0,1);let rollTarget=clamp(input.roll,-1,1)*.95;s.roll+=(rollTarget-s.roll)*dt*2.1;s.pitch=clamp(s.pitch+input.pitch*dt*.34,-.48,.48);
 let storm=s.route==='STORM CORRIDOR'&&s.pos[2]<-420&&s.pos[0]<100;let gust=storm?Math.sin(s.elapsed*1.9)*4.5:Math.sin(s.elapsed*.4)*1.6;s.wind=gust;
 let agl=s.pos[1]-Math.max(0,terrainHeight(s.pos[0],s.pos[2]));let groundEffect=agl<22?1.12:1;
 s.aoa=s.pitch-Math.atan2(s.verticalSpeed,s.speed);let stallSpeed=35-s.flaps*7;s.stall=s.speed<stallSpeed||s.aoa>.34;
 let drag=.0015*s.speed*s.speed+.9*s.gear+1.5*s.flaps+Math.abs(s.roll)*.5;let thrust=s.fuel>0?s.throttle*12:0;s.speed=clamp(s.speed+(thrust-drag-Math.sin(s.pitch)*9.81)*dt,5,145);
 const shadowLift=Math.max(0,1-Math.hypot(s.pos[0]+720,s.pos[2]+1800)/700)*3.2;let desiredV=shadowLift+s.speed*Math.sin(s.pitch)+(s.speed-58)*.035*groundEffect+s.flaps*1.4-(s.stall?12:0)+(storm?Math.sin(s.elapsed*2.3)*2:0);s.verticalSpeed+=(desiredV-s.verticalSpeed)*dt*1.7;s.pos[1]+=s.verticalSpeed*dt;
 s.heading-=Math.sin(s.roll)*dt*(.32*65/Math.max(25,s.speed));s.pos[0]+=Math.sin(s.heading)*s.speed*dt+gust*dt;s.pos[2]-=Math.cos(s.heading)*s.speed*dt;
 // Accelerated sortie clock: throttle burn plus sustained storm power demand;
 // structural fatigue accrues only during actual severe wind-shear exposure.
 s.fuel=clamp(s.fuel-dt*(.065+s.throttle*.06+(storm?.40:0))*(s.route==='SAFE LOOP'?1.13:1),0,100);if(storm&&Math.abs(gust)>4)s.hull=clamp(s.hull-dt*1.3,0,100);
 if(s.fuel===0)s.warning='FUEL EXHAUSTED — BEST GLIDE';else if(s.stall)s.warning='STALL — LOWER NOSE / ADD POWER';else if(storm)s.warning='WIND SHEAR — HOLD ATTITUDE';else s.warning='';
}
