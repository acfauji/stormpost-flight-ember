// STORMPOST: fixed-step flight simulation, pilot controls and maritime rendering.
import {createEngine} from './webglEngine.js';
import {buildWorld} from './terrainWorld.js';
import {buildAircraft} from './aircraftMesh.js';
import {buildAtmosphere} from './weatherAtmosphere.js';
import {initialFlight,updateAerodynamics} from './aerodynamics.js';
import {createCameraRig} from './cameraRig.js';
import {buildCockpit,drawCockpitInstruments} from './cockpitView.js';
import {createMissionDirector} from './missionDirector.js';
import {resolveContact,buildImpactEffects} from './landingAndCrash.js';
import {drawAvionics} from './avionicsHud.js';
import {createAudioSynth} from './audioSynth.js';
const canvas=document.getElementById('flight-view');
const overlay=document.getElementById('instruments'),ctx=overlay.getContext('2d');
const engine=createEngine(canvas),world=buildWorld(engine),drawAircraft=buildAircraft(engine);
const atmosphere=buildAtmosphere(engine),cockpit=buildCockpit(engine),missions=createMissionDirector(engine);
const impact=buildImpactEffects(engine),camera=createCameraRig(),audio=createAudioSynth();
const keys=new Set();
let state=initialFlight(2),last=performance.now(),clock=0,accumulator=0;
const mouse={down:false,x:0,y:0};
function pilotInput(){
 return {
  roll:(keys.has('KeyA')?1:0)-(keys.has('KeyD')?1:0)+(mouse.down?mouse.x:0),
  pitch:(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+(mouse.down?-mouse.y:0),
  throttle:(keys.has('ShiftLeft')?1:0)-(keys.has('ControlLeft')?1:0)
 };
}
function restart(contract=state.contract){
 state=initialFlight(contract);missions.reset();camera.reset();clock=0;accumulator=0;audio.start();
}
function readFlight(){
 return JSON.parse(JSON.stringify({...state,clock,glError:engine.getError(),supplies:missions.supplies}));
}
function integrateFlight(){
 const dt=.02;
 if(!state.paused){
  clock+=dt;state.brake=keys.has('KeyB');
  updateAerodynamics(state,pilotInput(),dt);
  resolveContact(state,dt);missions.update(state,dt);
 }
 state.storm=state.route==='STORM CORRIDOR'&&state.pos[2]<-420&&state.pos[0]<100&&state.status==='flying';
 audio.update(state);
}
function advanceFlight(ticks=1){
 // Embedders share the same fixed integrator as the interactive animation loop.
 if(!Number.isInteger(ticks)||ticks<0||ticks>5000)throw Error('Flight ticks must be an integer in [0,5000]');
 for(let i=0;i<ticks;i++)integrateFlight();
 return readFlight();
}
function renderFlight(){
 const w=innerWidth,h=innerHeight;
 if(overlay.width!==w||overlay.height!==h){overlay.width=w;overlay.height=h;}
 const cam=camera.update(state,.02);
 engine.begin(cam,clock,state.storm?.85:0);
 world.draw(clock);atmosphere.draw(state,clock);missions.draw(state);
 if(state.camera==='cockpit')cockpit.draw(state);else drawAircraft(state,clock);
 impact.draw(state,clock);ctx.clearRect(0,0,w,h);
 if(state.storm)atmosphere.rain(ctx,w,h,clock);
 if(state.camera==='cockpit')drawCockpitInstruments(ctx,state,w,h);
 drawAvionics(ctx,state,w,h);
 document.getElementById('flight-status').textContent=state.event||state.warning||state.status;
}
function frame(now){
 accumulator+=Math.min(.12,Math.max(0,(now-last)/1000));last=now;
 while(accumulator>=.02){integrateFlight();accumulator-=.02;}
 renderFlight();requestAnimationFrame(frame);
}
window.addEventListener('keydown',e=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 keys.add(e.code);if(e.repeat)return;audio.start();
 if(e.code==='Enter'){if(state.status!=='flying')restart();else state.paused=false;}
 if(/^Digit[123]$/.test(e.code))restart(Number(e.code.slice(-1)));
 if(e.code==='KeyC'){state.camera=state.camera==='chase'?'cockpit':'chase';camera.reset();}
 if(e.code==='KeyG')state.gear=!state.gear;
 if(e.code==='KeyF')state.flaps=state.flaps?0:1;
 if(e.code==='KeyP')state.paused=!state.paused;
 if(e.code==='KeyV')state.route=state.route==='SAFE LOOP'?'STORM CORRIDOR':'SAFE LOOP';
 if(e.code==='KeyM')audio.toggle();
 if(e.code==='KeyQ'){state.look=state.look===-1?0:-1;camera.reset();}
 if(e.code==='KeyE'){state.look=state.look===1?0:1;camera.reset();}
 if(e.code==='Space')missions.drop(state);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();mouse.down=false;});
canvas.addEventListener('pointerdown',e=>{mouse.down=true;audio.start();canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{mouse.x=(e.clientX/innerWidth-.5)*2;mouse.y=(e.clientY/innerHeight-.5)*2;});
window.addEventListener('pointerup',()=>mouse.down=false);
window.stormpost=Object.freeze({state:readFlight,advanceFlight,render:renderFlight});
renderFlight();requestAnimationFrame(frame);
