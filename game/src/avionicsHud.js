// Translucent flight-deck widgets: sparse primary data, navigation and three-contract debrief.
import {contracts} from './missionDirector.js';
const cyan='#a9e5e9',amber='#ffca83',ink='rgba(8,22,30,.38)';
function glass(ctx,x,y,w,h){
 ctx.fillStyle=ink;ctx.strokeStyle='rgba(176,217,218,.25)';ctx.lineWidth=1;
 ctx.beginPath();ctx.roundRect(x,y,w,h,6);ctx.fill();ctx.stroke();
 ctx.strokeStyle='rgba(246,204,142,.65)';ctx.beginPath();ctx.moveTo(x+12,y);ctx.lineTo(x+39,y);ctx.stroke();
}
function text(ctx,content,x,y,size=12,color=cyan,weight='400'){
 ctx.fillStyle=color;ctx.font=weight+' '+size+'px monospace';ctx.fillText(content,x,y);
}
export function drawAvionics(ctx,s,w,h){
 ctx.save();ctx.scale(w/1280,h/800);ctx.textBaseline='alphabetic';ctx.textAlign='left';
 glass(ctx,24,22,298,70);text(ctx,'STORMPOST',40,53,27,'#fff2db','700');
 text(ctx,'ISLEWATCH  /  TWIN-TURBOPROP',41,76,11,amber);
 if(s.status!=='crashed'){glass(ctx,920,22,336,70);text(ctx,contracts[s.contract-1]||contracts[0],936,48,16,'#fff0d6','700');
 text(ctx,s.route,936,74,11,cyan);text(ctx,'SCORE '+s.score,1135,74,11,amber,'700');}
 const speed=Math.round(s.speed*1.944),alt=Math.round(s.pos[1]*3.281),heading=Math.round((s.heading*180/Math.PI+540)%360);
 ctx.textAlign='center';if(s.status!=='crashed'){glass(ctx,590,24,100,58);text(ctx,String(heading).padStart(3,'0')+'°',640,51,23,cyan,'700');text(ctx,'HDG MAG',640,69,10);}
 for(let [x,label,value,unit] of s.status==='crashed'?[]:[[188,'IAS',speed,'KT'],[1092,'ALT',alt,'FT']]){
  ctx.strokeStyle='rgba(173,231,224,.42)';ctx.lineWidth=1;
  for(let j=-4;j<=4;j++)if(Math.abs(j)>1){ctx.beginPath();ctx.moveTo(x-35,331+j*19);ctx.lineTo(x-35+(j%2?8:14),331+j*19);ctx.stroke();}
  glass(ctx,x-45,300,90,62);text(ctx,value,x,327,25,'#e4f5ed','700');text(ctx,label+' / '+unit,x,348,10);
 }
 // Delicate attitude references leave the mission target and aircraft unobscured.
 ctx.strokeStyle='rgba(173,231,224,.57)';ctx.lineWidth=1.1;
 ctx.save();if(s.status==='crashed')ctx.globalAlpha=0;ctx.translate(640,325);ctx.rotate(-s.roll);ctx.translate(0,s.pitch*180);
 for(let i=-2;i<=2;i++){
  const y=i*35;ctx.beginPath();ctx.moveTo(-58,y);ctx.lineTo(-26,y);ctx.moveTo(26,y);ctx.lineTo(58,y);ctx.stroke();
 }ctx.restore();
 if(s.status==='flying'){
  const vy=355-s.verticalSpeed*2;ctx.beginPath();ctx.arc(640,vy,7,0,Math.PI*2);
  ctx.moveTo(621,vy);ctx.lineTo(633,vy);ctx.moveTo(647,vy);ctx.lineTo(659,vy);ctx.stroke();
 }
 if(s.camera!=='cockpit'&&s.status==='flying'){
  ctx.textAlign='left';glass(ctx,24,620,246,129);
  text(ctx,'POWER '+Math.round(s.throttle*100)+'%   VSI '+Math.round(s.verticalSpeed*196.85),39,645,11);
  text(ctx,'FLAPS '+Math.round(s.flaps*30)+'°   GEAR '+(s.gear?'DOWN':'UP'),39,669,11,s.gear?amber:cyan);
  text(ctx,'FUEL '+Math.round(s.fuel)+'%   HULL '+Math.round(s.hull)+'%',39,693,12,'#e4f5ed','700');
  text(ctx,'CROSSWIND '+Math.abs(s.wind).toFixed(1)+' M/S',39,717,10);
  text(ctx,'C  COCKPIT     V  ROUTE',39,738,10,'#94b4bc');
  const rx=1190,ry=670;ctx.fillStyle='rgba(8,22,30,.30)';ctx.beginPath();ctx.arc(rx,ry,58,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(139,203,205,.32)';for(let r of [20,39,58]){ctx.beginPath();ctx.arc(rx,ry,r,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle=s.storm?'rgba(255,182,83,.33)':'rgba(92,180,160,.25)';ctx.beginPath();ctx.ellipse(rx-12,ry-14,25,17,-.5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=cyan;ctx.beginPath();ctx.moveTo(rx,ry-8);ctx.lineTo(rx-4,ry+5);ctx.lineTo(rx+4,ry+5);ctx.closePath();ctx.stroke();
  ctx.textAlign='center';text(ctx,'WX / 5 NM',rx,748,10);
 }
 ctx.textAlign='center';
 if(s.warning&&s.status==='flying'){
  glass(ctx,425,112,430,29);text(ctx,s.warning,640,132,12,amber,'700');
 }
 if(s.event&&s.status==='flying')text(ctx,s.event,640,s.camera==='cockpit'?522:588,12,amber);
 if(s.status!=='flying'){
  const cx=s.status==='crashed'?334:640;glass(ctx,cx-310,635,620,119);
  const lost=s.status==='crashed';text(ctx,lost?'AIRFRAME LOST  /  HULL 0%':s.flare,cx,661,20,lost?'#ffba80':cyan,'700');
  text(ctx,lost?s.cause:s.event,cx,685,12,amber);
  text(ctx,'1 FLARE RESCUE   2 REEF RELAY   3 CLIFF DELIVERY',cx,713,12);
  text(ctx,'ENTER  RESTART SORTIE',cx,739,11,'#ecede2');
 }
 if(s.status==='crashed'){ctx.textAlign='left';glass(ctx,24,110,298,86);text(ctx,'IAS '+speed+' KT  ALT '+alt+' FT',40,135,12);text(ctx,'HDG '+heading+'°  SCORE '+s.score,40,157,12,amber);text(ctx,'FUEL '+Math.round(s.fuel)+'%  HULL '+Math.round(s.hull)+'%',40,179,12);}
 if(s.status!=='crashed'){
 ctx.textAlign='center';ctx.fillStyle='rgba(5,17,23,.35)';ctx.fillRect(0,776,1280,24);
 text(ctx,'W/S PITCH   A/D BANK   SHIFT/CTRL POWER   F FLAPS   G GEAR   C COCKPIT   SPACE DROP   V ROUTE   B BRAKE   P PAUSE',640,792,10,'#f2cb93');
 }
 ctx.restore();
}
