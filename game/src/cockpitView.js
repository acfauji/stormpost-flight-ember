// Cockpit canopy structure, glareshield and five illuminated, physics-driven flight instruments.
import {mesh,rod,box,torus,transform,multiply} from './webglEngine.js';
export function buildCockpit(engine){let m=mesh(),frame=[.09,.14,.15];for(let s of [-1,1]){rod(m,[s*3.5,-1,-13],[s*3.8,6,-16],.18,frame,8);rod(m,[s*3.8,6,-16],[s*.8,6.3,-21],.18,frame,8);}rod(m,[-4,6,-16],[4,6,-16],.19,frame,8);rod(m,[0,6.2,-21],[0,1,-23],.1,frame,8);box(m,[0,-.6,-15],[8,1,3],frame);box(m,[0,.1,-21],[4.8,.5,5],[.92,.31,.06]);let g=engine.upload(m),dial=mesh(),needle=mesh();rod(dial,[0,0,-.06],[0,0,0],.55,[.025,.06,.065],32);torus(dial,[0,0,.015],.55,.035,[.4,.55,.48],36);for(let i=0;i<12;i++){let a=i*Math.PI/6;rod(dial,[Math.sin(a)*.44,Math.cos(a)*.44,.03],[Math.sin(a)*.5,Math.cos(a)*.5,.03],.008,[.7,.95,.8],4);}rod(needle,[0,-.1,.06],[0,.4,.06],.015,[1,.7,.2],5);let dg=engine.upload(dial),ng=engine.upload(needle);return {draw(s){let base=transform(s.pos,[s.pitch,s.heading,s.roll]);engine.draw(g,base);let values=[s.speed/125,s.roll/3+.5,s.pos[1]/1500,(s.heading/(Math.PI*2)+1.5)%1,s.throttle];for(let i=0;i<5;i++){let mount=multiply(base,transform([(i-2)*1.35,.5,-16.8]));engine.draw(dg,mount,{emission:.3});engine.draw(ng,multiply(mount,transform([0,0,0],[0,0,2.4-values[i]*4.8])),{emission:.5});}}};}
export function drawCockpitInstruments(ctx,s,w,h){
 const top=h*.70,R=Math.min(w*.061,h*.097),cy=top+R+35;
 ctx.save();
 const panel=ctx.createLinearGradient(0,top,0,h);
 panel.addColorStop(0,'#22343a');panel.addColorStop(.08,'#101d24');panel.addColorStop(1,'#071017');
 ctx.fillStyle=panel;ctx.strokeStyle='#637275';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(w*.06,top+17);ctx.lineTo(w*.28,top);ctx.lineTo(w*.72,top);ctx.lineTo(w*.94,top+17);ctx.lineTo(w,h);ctx.closePath();ctx.fill();ctx.stroke();
 const bezel=x=>{
  const rim=ctx.createLinearGradient(x-R,cy-R,x+R,cy+R);
  rim.addColorStop(0,'#82938d');rim.addColorStop(.13,'#203339');rim.addColorStop(.55,'#071015');rim.addColorStop(1,'#52706b');
  ctx.fillStyle=rim;ctx.beginPath();ctx.arc(x,cy,R+8,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#061119';ctx.beginPath();ctx.arc(x,cy,R,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(103,202,192,.5)';ctx.lineWidth=1;ctx.stroke();
  for(let a of [.25,2.89,3.39,6.03]){
   ctx.fillStyle='#8b938a';ctx.beginPath();ctx.arc(x+Math.cos(a)*(R+4),cy+Math.sin(a)*(R+4),1.5,0,Math.PI*2);ctx.fill();
  }
 };
 const label=(t,x,y,size,color='#aacccc')=>{ctx.fillStyle=color;ctx.font=size+'px monospace';ctx.textAlign='center';ctx.fillText(t,x,y);};
 const dial=(x,name,value,max,unit,color='#b6e4d8')=>{
  bezel(x);
  for(let i=0;i<=40;i++){
   const a=-Math.PI*.78+i*Math.PI*1.56/40,major=i%4===0;
   ctx.strokeStyle=major?'#b8d4cd':'#57787a';ctx.lineWidth=major?1.8:.8;
   ctx.beginPath();ctx.moveTo(x+Math.sin(a)*R*(major?.78:.86),cy-Math.cos(a)*R*(major?.78:.86));
   ctx.lineTo(x+Math.sin(a)*R*.94,cy-Math.cos(a)*R*.94);ctx.stroke();
   if(major&&i%8===0)label(Math.round(max*i/40),x+Math.sin(a)*R*.64,cy-Math.cos(a)*R*.64+3,8);
  }
  const a=-Math.PI*.78+Math.max(0,Math.min(1,value/max))*Math.PI*1.56;
  ctx.strokeStyle='#ffd291';ctx.lineWidth=2.3;ctx.shadowColor='#ffb75f';ctx.shadowBlur=7;
  ctx.beginPath();ctx.moveTo(x-Math.sin(a)*R*.15,cy+Math.cos(a)*R*.15);ctx.lineTo(x+Math.sin(a)*R*.74,cy-Math.cos(a)*R*.74);ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle='#b8c8bd';ctx.beginPath();ctx.arc(x,cy,3,0,Math.PI*2);ctx.fill();
  label(name,x,cy-R*.35,10);label(Math.round(value),x,cy+R*.34,19,'#e8f4df');label(unit,x,cy+R*.59,9);
 };
 dial(w*.19,'AIRSPEED',s.speed*1.944,240,'KNOTS');
 dial(w*.50,'ALTIMETER',s.pos[1]*3.281,4000,'FEET');
 dial(w*.655,'HEADING',(s.heading*180/Math.PI+540)%360,360,'MAG');
 dial(w*.81,'ENGINE',s.throttle*100,100,'RPM %');
 const x=w*.345;bezel(x);ctx.save();ctx.beginPath();ctx.arc(x,cy,R-2,0,Math.PI*2);ctx.clip();
 ctx.translate(x,cy);ctx.rotate(s.roll);ctx.translate(0,s.pitch*100);
 const sky=ctx.createLinearGradient(0,-R,0,R);sky.addColorStop(0,'#164057');sky.addColorStop(1,'#638695');
 ctx.fillStyle=sky;ctx.fillRect(-R*3,-R*3,R*6,R*3);
 ctx.fillStyle='#8c6846';ctx.fillRect(-R*3,0,R*6,R*3);
 ctx.strokeStyle='#d9f0d9';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-R,0);ctx.lineTo(R,0);ctx.stroke();
 for(let i=-3;i<=3;i++)if(i){ctx.beginPath();ctx.moveTo(-13,i*15);ctx.lineTo(13,i*15);ctx.stroke();}
 ctx.restore();ctx.strokeStyle='#ffe0a1';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(x-32,cy);ctx.lineTo(x-10,cy);ctx.lineTo(x,cy+7);ctx.lineTo(x+10,cy);ctx.lineTo(x+32,cy);ctx.stroke();
 label('ATTITUDE',x,cy+R*.65,9);
 label('FUEL '+Math.round(s.fuel)+'%    HULL '+Math.round(s.hull)+'%    '+(s.gear?'GEAR LOCKED':'GEAR UP')+'    FLAPS '+Math.round(s.flaps*30)+'°',w*.5,h-23,12,'#b8e1dc');
 ctx.restore();
}
