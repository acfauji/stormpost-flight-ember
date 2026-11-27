// Continuous value-noise oceans and a ray-integrated maritime cloud canopy.
export const surfaceVertex=`#version 300 es
precision highp float;
in vec3 p,n,c;
uniform mat4 vp,model;
uniform float time,water;
out vec3 col,normal,world;
void main(){
 vec4 w=model*vec4(p,1.);
 world=w.xyz;
 normal=normalize(transpose(inverse(mat3(model)))*n);
 col=c;
 gl_Position=vp*w;
}`;
const noiseField=`
float hash21(vec2 p){p=fract(p*vec2(.1031,.11369));p+=dot(p,p.yx+19.19);return fract(p.x*p.y);}
float valueNoise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+1.),f.x),f.y);
}
float fbm(vec2 p){
 float v=0.,a=.55;
 mat2 turn=mat2(.80,-.60,.60,.80);
 for(int i=0;i<4;i++){v+=a*valueNoise(p);p=turn*p*2.07+vec2(11.3,7.1);a*=.47;}
 return v;
}
`;
export const surfaceFragment=`#version 300 es
precision highp float;
in vec3 col,normal,world;
uniform vec3 eye;
uniform float time,water,emission,alpha,storm,soft,terrain,metal,cloud;
out vec4 fragment;
const vec3 sunlight=vec3(1.,.72,.38);
const vec3 sun=vec3(-.59,.25,-.77);
${noiseField}
vec3 aerialPerspective(vec3 color,vec3 view){
 float distance=length(eye-world);
 float haze=1.-exp(-distance*(.000105+storm*.00019));
 float forward=max(dot(-view,normalize(sun)),0.);
 float horizon=pow(1.-abs(normalize(view).y),2.);
 vec3 dusk=mix(vec3(.105,.13,.25),vec3(.91,.49,.26),max(pow(forward,5.)*.62,horizon*.58));
 dusk=mix(dusk,vec3(.24,.29,.39),storm*.68);
 return mix(color,dusk,min(.88,haze));
}
float waveHeight(vec2 p){return fbm(p+vec2(time*.055,-time*.038))*.65+fbm(p*.51-vec2(time*.024,0.))*.35;}
void main(){
 vec3 N=normalize(normal),L=normalize(sun),E=normalize(eye-world);
 vec3 albedo=col,terrainEmission=vec3(0.);
 if(terrain>.5){
  float slope=1.-max(N.y,0.);
  float elevation=world.y;
  float variation=fbm(world.xz*.010);
  float warp=fbm(world.xz*.0045)*16.;
  float strata=.5+.5*sin((world.y+world.x*.075+world.z*.021+warp)*.115);
  vec3 grass=mix(vec3(.10,.22,.14),vec3(.34,.39,.20),variation);
  vec3 highland=mix(vec3(.13,.28,.18),vec3(.38,.43,.25),fbm(world.xz*.018));
  vec3 basalt=mix(vec3(.075,.09,.12),vec3(.23,.25,.27),variation);
  basalt*=.68+strata*.47;
  float rock=clamp(smoothstep(.12,.43,slope)+smoothstep(280.,760.,elevation)*.62,0.,1.);
  float alpine=smoothstep(250.,480.,elevation)*(1.-smoothstep(1050.,1420.,elevation));
  albedo=mix(grass,highland,alpine*.9);
  albedo=mix(albedo,basalt,rock);
  float beach=(1.-smoothstep(7.,35.,elevation))*smoothstep(-1.,4.,elevation);
  albedo=mix(albedo,vec3(.60,.48,.32),beach*.9);
  float caldera=exp(-pow((length(world.xz-vec2(-1280.,-2050.))-102.)/27.,2.));
  float rim=caldera*smoothstep(120.,300.,elevation);
  albedo=mix(albedo,vec3(.78,.29,.075),rim*.55);
  terrainEmission=vec3(1.,.25,.035)*rim*.48;
 }
 float diffuse=max(dot(N,L),0.);
 float hemi=.5+.5*N.y;
 vec3 color=albedo*(vec3(.21,.27,.32)+vec3(.23,.27,.30)*hemi+sunlight*diffuse*.76);
 color+=terrainEmission;
 float facing=max(dot(N,E),0.);
 float highlight=pow(max(dot(N,normalize(L+E)),0.),mix(32.,90.,metal));
 color+=sunlight*highlight*(.06+metal*.4);
 color+=vec3(.36,.59,.70)*pow(1.-facing,4.)*(.045+metal*.12);
 if(water>.5){
  // A nonperiodic height derivative; filter the entire normal before specular.
  float distanceToEye=length(eye-world);
  vec2 p=world.xz*.019;
  float footprint=max(length(dFdx(p)),length(dFdy(p)));
  float detail=(1.-smoothstep(.08,.72,footprint))*exp(-distanceToEye*.0005);
  float e=.13;
  vec2 slope=vec2(waveHeight(p+vec2(e,0))-waveHeight(p-vec2(e,0)),waveHeight(p+vec2(0,e))-waveHeight(p-vec2(0,e)))/(2.*e);
  N=normalize(vec3(-slope.x*.25*detail,1.,-slope.y*.25*detail));
  float fresnel=.035+.965*pow(1.-max(dot(N,E),0.),5.);
  vec3 R=reflect(-E,N);
  vec3 reflectedSky=mix(vec3(.72,.49,.29),vec3(.19,.37,.49),smoothstep(0.,.65,R.y));
  vec3 sea=mix(vec3(.018,.095,.13),vec3(.055,.22,.25),.5+.4*fbm(world.xz*.0018));
  color=mix(sea,reflectedSky,fresnel*.73);
  float roughness=.12+(1.-detail)*.14;
  float glint=pow(max(dot(reflect(-L,N),E),0.),1./(roughness*roughness));
  vec3 radiance=color+vec3(1.,.57,.20)*glint*.72;
  // Luminance compression preserves amber hue rather than clipping channels.
  color=radiance/(1.+dot(radiance,vec3(.2126,.7152,.0722))*.65);
  color*=1.-storm*.38;
 }
 if(cloud>.5){
  float wrap=clamp((dot(N,L)+.65)/1.65,0.,1.);
  color=col*mix(vec3(.32,.37,.43),vec3(.88,.69,.47),wrap);
 }
 color+=col*emission;
 color=aerialPerspective(color,E);
 float opacity=alpha;
 if(soft>.5)opacity*=smoothstep(0.,.62,abs(dot(N,E)));
 fragment=vec4(pow(max(color,vec3(0.)),vec3(.94)),opacity);
}`;
export const skyVertex=`#version 300 es
in vec2 p;
out vec2 uv;
void main(){uv=p;gl_Position=vec4(p,1.,1.);}`;
export const skyFragment=`#version 300 es
precision highp float;
in vec2 uv;
uniform vec3 forward,right,up;
uniform float aspect,field,storm,time;
out vec4 fragment;
${noiseField}
float cloudDensity(vec3 p){
 float base=fbm(p.xz*.83+vec2(time*.0013,0.));
 float towers=fbm(p.xz*1.67+vec2(4.1,11.));
 float shelf=fbm(p.xz*.47+vec2(-time*.0008,7.));
 float height=p.y;
 float crown=.38+towers*.85+storm*.26;
 float profile=smoothstep(.02,.19,height)*(1.-smoothstep(crown-.25,crown,height));
 float body=smoothstep(.38-storm*.1,.64,base+towers*.18);
 float bank=smoothstep(.50,.72,shelf+towers*.14)*(1.-smoothstep(.83,.98,height));
 float erosion=fbm(p.xz*4.3+vec2(height*2.4,-height*1.8));
 return max(0.,(body*profile+bank*.38*(1.-profile*.3))-erosion*.16)*1.55;
}
void main(){
 vec3 ray=normalize(forward+right*uv.x*aspect*field+up*uv.y*field);
 vec3 L=normalize(vec3(-.59,.25,-.77));
 float height=max(ray.y,0.);
 float zenith=pow(smoothstep(.012,.88,height),.72);
 vec3 sky=mix(vec3(.94,.50,.25),vec3(.075,.09,.24),zenith);
 float angle=max(dot(ray,L),0.);
 float haze=exp(-height*34.)*(1.-storm*.72);
 sky=mix(sky,vec3(.98,.65,.37),haze*.42);
 sky+=vec3(.30,.34,.62)*pow(angle,7.)*.075;
 sky+=vec3(1.,.43,.13)*pow(angle,20.)*.34*(1.-storm*.55);
 sky=mix(sky,vec3(.15,.20,.32)+height*.055,storm*.82);
 sky+=vec3(1.,.54,.25)*pow(angle,260.)*(1.-storm)*.40;
 sky=mix(sky,vec3(.99,.77,.50),smoothstep(.9993,.99985,angle)*(1.-storm)*.84);
 if(ray.y>.015){
  float transmittance=1.;vec3 light=vec3(0.);
  for(int i=0;i<10;i++){
   float h=.075+float(i)*.11;
   vec3 p=vec3(ray.x*(h+.55)/(ray.y+.18),h,ray.z*(h+.55)/(ray.y+.18));
   p.xz+=vec2(1.8,3.4);
   float density=cloudDensity(p);
   float shade=cloudDensity(p+vec3(L.x*.12,.13,L.z*.12));
   vec3 warm=mix(vec3(.41,.48,.55),vec3(.98,.77,.51),exp(-shade*4.)*.8);
   warm=mix(warm,vec3(.20,.26,.33),storm*.64);
   // Warm lower scattering and silver edges make the cloud volumes legible.
   warm+=vec3(.21,.10,.025)*(1.-h)*exp(-shade*3.)*(1.-storm*.6);
   float opacity=1.-exp(-density*.7);
   light+=transmittance*opacity*warm;transmittance*=1.-opacity;
  }
  sky=mix(sky,sky*transmittance+light,smoothstep(.012,.16,ray.y));
 }
 float flash=pow(max(0.,sin(time*1.7)),38.)*storm;
 sky+=vec3(.25,.33,.43)*flash*exp(-length(uv-vec2(-.24,.3))*2.);
 float peak=max(max(sky.r,sky.g),sky.b);
 sky/=1.+max(peak-.82,0.)*.72;
 fragment=vec4(max(sky,vec3(0.)),1.);
}`;
