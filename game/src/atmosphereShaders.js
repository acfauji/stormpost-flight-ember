// Original GLSL ES 3: height/slope biomes, aerial perspective and a sunlit wave field.
export const surfaceVertex=`#version 300 es
precision highp float;
in vec3 p,n,c;
uniform mat4 vp,model;
uniform float time,water;
out vec3 col,normal,world;
void main(){
 vec3 q=p;
 if(water>.5)q.y+=sin(q.x*.012+time*.8)*1.6+sin(q.z*.022-time*.7)*1.0;
 vec4 w=model*vec4(q,1.);
 world=w.xyz;
 normal=normalize(transpose(inverse(mat3(model)))*n);
 col=c;
 gl_Position=vp*w;
}`;
export const surfaceFragment=`#version 300 es
precision highp float;
in vec3 col,normal,world;
uniform vec3 eye;
uniform float time,water,emission,alpha,storm,soft,terrain,metal,cloud;
out vec4 fragment;
const vec3 sunlight=vec3(1.0,.74,.43);
const vec3 sun=vec3(-.59,.25,-.77);
float grain(vec2 p){return .5+.5*sin(p.x*1.77+sin(p.y*.81))*sin(p.y*1.41);}
vec3 aerialPerspective(vec3 color,vec3 view){
 float distanceToEye=length(eye-world);
 float haze=1.-exp(-distanceToEye*(.00017+storm*.00019));
 float forward=pow(max(dot(-view,normalize(sun)),0.),8.);
 vec3 dusk=mix(vec3(.46,.58,.65),vec3(.91,.63,.35),forward*.75);
 dusk=mix(dusk,vec3(.27,.36,.43),storm*.7);
 return mix(color,dusk,min(.94,haze));
}
void main(){
 vec3 N=normalize(normal),L=normalize(sun),E=normalize(eye-world);
 vec3 albedo=col;
 if(terrain>.5){
  float slope=1.-max(N.y,0.);
  float variation=grain(world.xz*.05);
  vec3 grass=mix(vec3(.18,.30,.15),vec3(.36,.42,.21),variation*.45);
  vec3 basalt=mix(vec3(.16,.19,.21),vec3(.29,.29,.27),variation);
  float rock=smoothstep(.16,.48,slope)+smoothstep(350.,760.,world.y)*.5;
  albedo=mix(grass,basalt,clamp(rock,0.,1.));
  albedo=mix(vec3(.70,.63,.44),albedo,smoothstep(5.,38.,world.y));
  albedo*=.9+.1*variation;
 }
 float diffuse=max(dot(N,L),0.);
 float hemi=.5+.5*N.y;
 vec3 color=albedo*(vec3(.16,.23,.29)+vec3(.22,.28,.31)*hemi+sunlight*diffuse*.82);
 float facing=max(dot(N,E),0.);
 float highlight=pow(max(dot(N,normalize(L+E)),0.),mix(32.,110.,metal));
 color+=sunlight*highlight*(.09+metal*.72);
 color+=vec3(.36,.59,.70)*pow(1.-facing,4.)*(.045+metal*.12);
 if(water>.5){
  float a=world.x*.036+world.z*.019+time*.95;
  float b=world.z*.061-world.x*.025-time*.7;
  float c=world.x*.12+world.z*.097+time*1.9;
  N=normalize(vec3(.10*cos(a)+.035*cos(c),1.,.085*sin(b)+.025*sin(c)));
  float fresnel=.035+.965*pow(1.-max(dot(N,E),0.),5.);
  vec3 reflection=reflect(-E,N);
  vec3 reflectedSky=mix(vec3(.84,.58,.34),vec3(.20,.40,.53),smoothstep(0.,.75,reflection.y));
  vec3 sea=mix(vec3(.025,.12,.15),vec3(.07,.28,.29),max(N.y*.7,0.));
  color=mix(sea,reflectedSky,fresnel*.82);
  float sparkle=pow(max(dot(N,normalize(E+L)),0.),150.);
  float sunTrack=pow(max(dot(reflect(-L,N),E),0.),70.);
  color+=sunlight*(sparkle*2.7+sunTrack*.5);
  // Fade subpixel wave detail instead of drawing periodic white bands.
  float footprint=max(fwidth(a),fwidth(b));
  color=mix(color,mix(sea,reflectedSky,fresnel*.82),smoothstep(.4,1.5,footprint)*.7);
  color=mix(color,color*.53,storm*.65);
 }
 if(cloud>.5){
  float wrap=clamp((dot(N,L)+.65)/1.65,0.,1.);
  vec3 shade=mix(vec3(.35,.40,.47),vec3(.98,.81,.58),wrap);
  color=shade*col;
  color+=sunlight*pow(1.-abs(dot(N,E)),4.)*.11;
 }
 color+=col*emission;
 color=aerialPerspective(color,E);
 float opacity=alpha;
 if(soft>.5)opacity*=smoothstep(.03,.57,abs(dot(N,E)));
 fragment=vec4(pow(max(color,vec3(0.)),vec3(.92)),opacity);
}`;
export const skyVertex=`#version 300 es
in vec2 p;
out vec2 uv;
void main(){uv=p;gl_Position=vec4(p,1.,1.);}`;
export const skyFragment=`#version 300 es
precision highp float;
in vec2 uv;
uniform vec3 forward,right,up;
uniform float aspect,field,storm;
out vec4 fragment;
void main(){
 vec3 ray=normalize(forward+right*uv.x*aspect*field+up*uv.y*field);
 vec3 L=normalize(vec3(-.59,.25,-.77));
 float height=max(ray.y,0.);
 vec3 sky=mix(vec3(.91,.65,.40),vec3(.15,.34,.51),pow(smoothstep(0.,.8,height),.55));
 float angle=max(dot(ray,L),0.);
 sky+=vec3(1.,.53,.20)*pow(angle,13.)*.38;
 sky+=vec3(1.,.76,.43)*pow(angle,250.)*.5;
 sky+=vec3(1.,.95,.75)*smoothstep(.9991,.9998,angle)*pow(1.-storm,4.);
 sky=mix(sky,vec3(.15,.24,.33)+height*.07,storm*.89);
 fragment=vec4(sky,1.);
}`;
