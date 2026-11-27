// Cockpit canopy structure, glareshield and five illuminated, physics-driven flight instruments.
import {mesh,rod,box,transform} from './webglEngine.js';
export function buildCockpit(engine){
 const frame=mesh(),slate=[.07,.11,.14];
 for(let side of [-1,1]){
  rod(frame,[side*3.7,-1,-13],[side*4,6,-16],.15,slate,8);
  rod(frame,[side*4,6,-16],[side*.9,6.3,-21],.15,slate,8);
 }
 rod(frame,[-4,6,-16],[4,6,-16],.14,slate,8);
 rod(frame,[0,6.2,-21],[0,3.7,-23],.055,slate,8);
 box(frame,[0,-.8,-15],[8,.6,3],slate);
 const geometry=engine.upload(frame);
 return {draw(s){engine.draw(geometry,transform(s.pos,[s.pitch,s.heading,s.roll]));}};
}
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
 dial(w*.655,'HEADING',((180-s.heading*180/Math.PI)%360+360)%360,360,'MAG');
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
