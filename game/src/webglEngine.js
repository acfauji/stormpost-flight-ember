// Original WebGL 2 renderer: smooth geometry and purpose-built atmosphere materials.
import {surfaceVertex,surfaceFragment,skyVertex,skyFragment} from './atmosphereShaders.js';
export const V=(x=0,y=0,z=0)=>[x,y,z];
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,k)=>a.map(v=>v*k);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const unit=a=>mul(a,1/(Math.hypot(...a)||1));
export function identity(){return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];}
export function multiply(a,b){let r=Array(16).fill(0);for(let c=0;c<4;c++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)r[c*4+row]+=a[k*4+row]*b[c*4+k];return r;}
export function transform(pos=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){let [p,h,r]=rotation,cp=Math.cos(p),sp=Math.sin(p),ch=Math.cos(h),sh=Math.sin(h),cr=Math.cos(r),sr=Math.sin(r);let rx=[1,0,0,0,0,cp,sp,0,0,-sp,cp,0,0,0,0,1],ry=[ch,0,-sh,0,0,1,0,0,sh,0,ch,0,0,0,0,1],rz=[cr,sr,0,0,-sr,cr,0,0,0,0,1,0,0,0,0,1];let m=multiply(ry,multiply(rx,rz));for(let c=0;c<3;c++)for(let j=0;j<3;j++)m[c*4+j]*=scale[c];m[12]=pos[0];m[13]=pos[1];m[14]=pos[2];return m;}
export function lookAt(eye,target,up){let z=unit(sub(eye,target)),x=unit(cross(up,z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
export function perspective(fov,aspect,near=.5,far=15000){let f=1/Math.tan(fov/2),k=1/(near-far);return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*k,-1,0,0,2*far*near*k,0];}
export function mesh(){return {v:[],n:[],c:[]};}
export function triangle(m,a,b,c,color,normal){let n=normal||unit(cross(sub(b,a),sub(c,a)));for(let p of [a,b,c]){m.v.push(...p);m.n.push(...n);m.c.push(...color);}}
export function quad(m,a,b,c,d,color){triangle(m,a,b,c,color);triangle(m,a,c,d,color);}
export function box(m,pos,size,color){let [x,y,z]=pos,[a,b,c]=size.map(v=>v/2);let p=[[-a,-b,-c],[a,-b,-c],[a,b,-c],[-a,b,-c],[-a,-b,c],[a,-b,c],[a,b,c],[-a,b,c]].map(q=>add(q,[x,y,z]));for(let f of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]])quad(m,...f.map(i=>p[i]),color);}
export function smoothTriangle(m,a,b,c,color,normals){
 for(let [i,p] of [a,b,c].entries()){m.v.push(...p);m.n.push(...normals[i]);m.c.push(...color);}
}
export function ellipsoid(m,pos,size,color,lat=14,lon=24){
 const pt=(i,j)=>add(pos,[Math.sin(i*Math.PI/lat)*Math.cos(j*2*Math.PI/lon)*size[0],Math.cos(i*Math.PI/lat)*size[1],Math.sin(i*Math.PI/lat)*Math.sin(j*2*Math.PI/lon)*size[2]]);
 const normal=p=>unit(p.map((v,k)=>(v-pos[k])/(size[k]*size[k])));
 for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){
  let a=pt(i,j),b=pt(i+1,j),c=pt(i+1,j+1),d=pt(i,j+1);
  smoothTriangle(m,a,b,c,color,[a,b,c].map(normal));
  smoothTriangle(m,a,c,d,color,[a,c,d].map(normal));
 }
}
export function rod(m,a,b,r,color,sides=10,r2=r){let axis=unit(sub(b,a)),u=unit(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),v=cross(axis,u);for(let i=0;i<sides;i++){let t=i*2*Math.PI/sides,t2=(i+1)*2*Math.PI/sides;let q=(p,r,t)=>add(p,add(mul(u,Math.cos(t)*r),mul(v,Math.sin(t)*r)));quad(m,q(a,r,t),q(b,r2,t),q(b,r2,t2),q(a,r,t2),color);triangle(m,a,q(a,r,t2),q(a,r,t),color);triangle(m,b,q(b,r2,t),q(b,r2,t2),color);}}
export function torus(m,center,r,t,color,segments=64){for(let i=0;i<segments;i++)for(let j=0;j<6;j++){const p=(i,j)=>{let a=i*2*Math.PI/segments,b=j*Math.PI/3;return add(center,[(r+t*Math.cos(b))*Math.cos(a),(r+t*Math.cos(b))*Math.sin(a),t*Math.sin(b)]);};quad(m,p(i,j),p(i+1,j),p(i+1,j+1),p(i,j+1),color);}}
export function createEngine(canvas){
 const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,preserveDrawingBuffer:true});
 if(!gl)throw Error('STORMPOST needs WebGL 2');
 const compile=(type,src)=>{
  const shader=gl.createShader(type);gl.shaderSource(shader,src);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
  return shader;
 };
 const link=(vertex,fragment)=>{
  const program=gl.createProgram();
  gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));
  gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  return program;
 };
 const program=link(surfaceVertex,surfaceFragment),sky=link(skyVertex,skyFragment);
 const names=['vp','model','time','water','eye','emission','alpha','storm','soft','terrain','metal','cloud'];
 const loc=Object.fromEntries(names.map(k=>[k,gl.getUniformLocation(program,k)]));
 const skyNames=['forward','right','up','aspect','field','storm'];
 const skyLoc=Object.fromEntries(skyNames.map(k=>[k,gl.getUniformLocation(sky,k)]));
 const attrs=['p','n','c'].map(k=>gl.getAttribLocation(program,k));
 const skyAttr=gl.getAttribLocation(sky,'p'),sb=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,sb);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 function upload(m){
  const buffers=[m.v,m.n,m.c].map(a=>{
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(a),gl.STATIC_DRAW);return buffer;
  });
  return {buffers,count:m.v.length/3};
 }
 let view;
 function begin(camera,t,storm=0){
  if(canvas.width!==canvas.clientWidth||canvas.height!==canvas.clientHeight){
   canvas.width=canvas.clientWidth;canvas.height=canvas.clientHeight;
  }
  gl.viewport(0,0,canvas.width,canvas.height);gl.depthMask(true);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
  gl.useProgram(sky);gl.bindBuffer(gl.ARRAY_BUFFER,sb);
  for(let i of attrs)gl.disableVertexAttribArray(i);
  gl.enableVertexAttribArray(skyAttr);gl.vertexAttribPointer(skyAttr,2,gl.FLOAT,false,0,0);
  const forward=unit(sub(camera.target,camera.eye)),right=unit(cross(forward,camera.up)),up=cross(right,forward);
  gl.uniform3fv(skyLoc.forward,forward);gl.uniform3fv(skyLoc.right,right);gl.uniform3fv(skyLoc.up,up);
  gl.uniform1f(skyLoc.aspect,canvas.width/canvas.height);gl.uniform1f(skyLoc.field,Math.tan((camera.fov||.92)/2));
  gl.uniform1f(skyLoc.storm,storm);gl.drawArrays(gl.TRIANGLES,0,6);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.useProgram(program);
  view=multiply(perspective(camera.fov||.92,canvas.width/canvas.height),lookAt(camera.eye,camera.target,camera.up));
  gl.uniformMatrix4fv(loc.vp,false,view);gl.uniform3fv(loc.eye,camera.eye);
  gl.uniform1f(loc.time,t);gl.uniform1f(loc.storm,storm);
 }
 function draw(geometry,model=identity(),options={}){
  gl.uniformMatrix4fv(loc.model,false,model);
  for(let k of ['water','emission','soft','terrain','metal','cloud'])gl.uniform1f(loc[k],Number(options[k]||0));
  gl.uniform1f(loc.alpha,options.alpha??1);
  if((options.alpha??1)<1){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}
  else{gl.disable(gl.BLEND);gl.depthMask(true);}
  for(let i=0;i<3;i++){
   gl.bindBuffer(gl.ARRAY_BUFFER,geometry.buffers[i]);gl.enableVertexAttribArray(attrs[i]);
   gl.vertexAttribPointer(attrs[i],3,gl.FLOAT,false,0,0);
  }
  gl.drawArrays(gl.TRIANGLES,0,geometry.count);gl.depthMask(true);
 }
 function project(p){
  const v=[...p,1],q=[0,0,0,0];
  for(let i=0;i<4;i++)for(let k=0;k<4;k++)q[i]+=view[k*4+i]*v[k];
  return {x:(q[0]/q[3]*.5+.5)*canvas.width,y:(.5-q[1]/q[3]*.5)*canvas.height,visible:q[3]>0};
 }
 return {gl,upload,begin,draw,project,getError:()=>gl.getError()};
}
