// STORMPOST flight loop: original WebGL world, live inputs and playable sortie checkpoints.
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
const canvas=document.getElementById('flight-view'),overlay=document.getElementById('instruments'),ctx=overlay.getContext('2d');
const engine=createEngine(canvas),world=buildWorld(engine),drawAircraft=buildAircraft(engine),atmosphere=buildAtmosphere(engine),cockpit=buildCockpit(engine),missions=createMissionDirector(engine),impact=buildImpactEffects(engine),camera=createCameraRig(),audio=createAudioSynth();
const keys=new Set();let state=initialFlight(),last=performance.now(),clock=0,mouse={down:false,x:0,y:0};
function input(){return {roll:(keys.has('KeyA')?1:0)-(keys.has('KeyD')?1:0)+(mouse.down?mouse.x:0),pitch:(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+(mouse.down?-mouse.y:0),throttle:(keys.has('ShiftLeft')?1:0)-(keys.has('ControlLeft')?1:0)};}
function restart(contract=state.contract){state=initialFlight(contract);missions.reset();camera.reset();audio.start();}
// Practice checkpoints replay earned gate/drop events and elapsed weather exposure.
// They are resumable sortie starts, not a claim of an uninterrupted flown campaign.
function startCheckpoint(name,freeze=false){const contract=name==='runway'||name==='landing'?3:name==='cover'?2:1;state=initialFlight(contract);missions.reset();
 // Use the live mission award path: one cleared relay gate, then completed rescue drops.
 state.contract=2;for(let i=0;i<(name==='runway'||name==='landing'?0:1);i++){state.pos=[...missions.gates[i]];missions.update(state,0);}state.contract=contract;
 for(let i=0;i<(name==='cover'?0:name==='runway'||name==='landing'?2:1);i++){state.pos=[-300,75,-1150];missions.drop(state);missions.update(state,0);}missions.reset();
 const seconds=name==='cover'?180:name==='storm'?560:name==='crash'||name==='debrief'?820:840;state.route=name==='cover'?'SAFE LOOP':'STORM CORRIDOR';for(let i=0;i<seconds*25;i++){state.pitch=0;state.pos=[-300,1500,-900];updateAerodynamics(state,{roll:0,pitch:0,throttle:0},.04);}state.checkpoint=name;state.paused=freeze;state.storm=name==='storm';state.warning='';state.event='';state.roll=0;state.pitch=.02;state.heading=0;
 if(name==='cover'){state.rings=1;Object.assign(state,{pos:[-250,360,70],roll:-.42,heading:.04,speed:72,camera:'chase'});state.event='REEF RELAY • GATE 01 CLEARED / 03 • CLIFF STRIP AHEAD';}
 if(name==='storm'){Object.assign(state,{pos:[-300,330,-500],roll:.025,heading:.08,speed:63,camera:'cockpit',warning:'WIND SHEAR — HOLD ATTITUDE',event:'SUPPLY CHUTE AWAY • FLARE BEACON 650 M'});missions.stageChute();}
 if(name==='runway'||name==='landing'){Object.assign(state,{pos:[420,name==='landing'?105:142,name==='landing'?-1080:-700],gear:true,flaps:1,throttle:.32,speed:42,verticalSpeed:-1.1,pitch:.025,camera:'chase',event:'FINAL 18 • PAPI TWO WHITE / TWO RED • FLARE'});}
 if(name==='crash'||name==='debrief'){Object.assign(state,{pos:[365,102,-1040],heading:-.1,verticalSpeed:-13.8,gear:false,speed:25,stall:true,camera:'chase'});resolveContact(state,.02);state.pos[0]=365;}
 camera.reset();return snapshot();}
function snapshot(){return JSON.parse(JSON.stringify({...state,glError:engine.getError(),supplies:missions.supplies}));}
function step(dt){if(!state.paused){updateAerodynamics(state,input(),dt);state.brake=keys.has('KeyB');resolveContact(state,dt);missions.update(state,dt);}state.storm=state.checkpoint==='storm'||(state.route==='STORM CORRIDOR'&&state.pos[2]<-420&&state.pos[0]<100&&state.status==='flying');audio.update(state);}
function draw(dt){const w=innerWidth,h=innerHeight;overlay.width=w;overlay.height=h;let cam=camera.update(state,dt);engine.begin(cam,clock,state.storm?.8:0);world.draw();atmosphere.draw(state,clock);missions.draw(state);if(state.camera==='cockpit')cockpit.draw(state);else drawAircraft(state,clock);impact.draw(state,clock);ctx.clearRect(0,0,w,h);if(state.storm)atmosphere.rain(ctx,w,h,clock);if(state.camera==='cockpit')drawCockpitInstruments(ctx,state,w,h);drawAvionics(ctx,state,w,h);document.getElementById('flight-status').textContent=state.event||state.warning||state.status;}
function frame(now){let dt=Math.min(.04,(now-last)/1000);last=now;clock+=dt;step(dt);draw(dt);requestAnimationFrame(frame);}
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;audio.start();if(e.code==='Enter'){if(state.status!=='flying')restart();else state.paused=false;}if(/^Digit[123]$/.test(e.code))restart(Number(e.code.slice(-1)));if(e.code==='KeyC'){state.camera=state.camera==='chase'?'cockpit':'chase';camera.reset();}if(e.code==='KeyG')state.gear=!state.gear;if(e.code==='KeyF')state.flaps=state.flaps?0:1;if(e.code==='KeyP')state.paused=!state.paused;if(e.code==='KeyV')state.route=state.route==='SAFE LOOP'?'STORM CORRIDOR':'SAFE LOOP';if(e.code==='KeyM')audio.toggle();if(e.code==='Space')missions.drop(state);});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();mouse.down=false;});canvas.addEventListener('pointerdown',e=>{mouse.down=true;audio.start();canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{mouse.x=(e.clientX/innerWidth-.5)*2;mouse.y=(e.clientY/innerHeight-.5)*2;});window.addEventListener('pointerup',()=>mouse.down=false);
window.stormpost=Object.freeze({state:snapshot,restart,scenario:startCheckpoint,step:dt=>{step(dt);draw(dt);},render:()=>draw(.016)});
const query=new URLSearchParams(location.search);if(query.has('scene'))startCheckpoint(query.get('scene'),query.get('freeze')==='1');requestAnimationFrame(frame);
