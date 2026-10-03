// Local procedural art: no texture downloads, image assets or per-frame allocations.
export const skyVertex = `
varying vec3 vWorld;
void main() {
  vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
export const skyFragment = `
uniform float uTime;
uniform float uEnergy;
uniform float uScene;
varying vec3 vWorld;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);
}
vec3 daylight(vec3 d) {
  float x=atan(d.x,-d.z), y=asin(clamp(d.y,-1.0,1.0));
  vec3 top=vec3(.30,.48,.49), horizon=vec3(.81,.78,.60);
  if(uScene==1.0) { top=vec3(.08,.17,.13);horizon=vec3(.40,.49,.31); }
  if(uScene==2.0) { top=vec3(.25,.21,.35);horizon=vec3(.86,.39,.22); }
  if(uScene==3.0) { top=vec3(.44,.54,.63);horizon=vec3(.86,.72,.73); }
  if(uScene==4.0) { top=vec3(.18,.29,.34);horizon=vec3(.53,.64,.61); }
  vec3 color=mix(horizon,top,smoothstep(-.1,1.1,y));
  float c=noise(vec2(x*3.0+uTime*.008,y*11.0));
  c=c*.7+noise(vec2(x*8.0-uTime*.012,y*26.0))*.3;
  float clouds=smoothstep(.43,.78,c)*smoothstep(.03,.16,y)*(1.0-smoothstep(.55,.9,y));
  color=mix(color,uScene==4.0?vec3(.32,.41,.44):vec3(.91,.84,.73),clouds*(uScene==4.0?.75:.42));
  vec3 sunDir=normalize(vec3(.45,uScene==2.0?.18:.34,-1.0));
  float sun=length(d-sunDir), radius=uScene==2.0?.063:.037;
  color+=vec3(.37,.26,.10)*exp(-sun*12.0);
  color=mix(color,vec3(1.0,.92,.66),1.0-smoothstep(radius,radius+.002,sun));
  if(uScene==4.0) {
    float r=length(vec2(x*.82,y-.02));
    vec3 rainbow=vec3(0.0);
    rainbow+=vec3(.35,.12,.05)*exp(-pow((r-.52)*110.0,2.0));
    rainbow+=vec3(.26,.25,.05)*exp(-pow((r-.508)*110.0,2.0));
    rainbow+=vec3(.05,.24,.12)*exp(-pow((r-.496)*110.0,2.0));
    rainbow+=vec3(.09,.12,.30)*exp(-pow((r-.484)*110.0,2.0));
    color+=rainbow*smoothstep(.0,.2,y)*.65;
  }
  return color;
}

void main() {
  vec3 d = normalize(vWorld);
  vec3 color;
  if(uScene >= 0.0) { color = daylight(d); } else {
  float h = max(d.y, 0.0);
  color = mix(vec3(.035,.093,.105), vec3(.004,.012,.038), smoothstep(0.0,.8,h));
  float x = atan(d.x, -d.z);
  float y = asin(clamp(d.y,-1.0,1.0));
  float t = uTime * .045;
  for(int i=0; i<3; i++) {
    float f = float(i);
    float curve = .34 + f*.13 + .12*sin(x*2.2+t+f*1.7) + .05*sin(x*5.0-t*.7+f);
    float dist = y-curve;
    float curtain = exp(-abs(dist)*11.0) * smoothstep(-.055,.02,dist);
    float folds = .62+.24*sin(x*38.0+sin(x*9.0+t)*4.0+t)+.14*sin(x*79.0-t*2.0);
    float envelope = exp(-pow((x-.15+f*.18)/1.25,4.0));
    vec3 tint = mix(vec3(.08,.63,.37),vec3(.15,.3,.57),clamp(dist*4.0+f*.2,0.0,1.0));
    color += tint * curtain * folds * envelope * (.55 + uEnergy*.08);
  }
  vec2 starUv = vec2(x,y)*210.0;
  vec2 cell = floor(starUv);
  float seed = hash(cell);
  float star = 1.0-smoothstep(.02,.16,length(fract(starUv)-.5));
  color += vec3(.65,.75,.72)*star*step(.985,seed)*smoothstep(.04,.28,h)*(.65+.35*sin(uTime*.3+seed*89.0));
  float moon = length(d-normalize(vec3(.47,.38,-1.0)));
  color += vec3(.68,.72,.51)*(1.0-smoothstep(.024,.026,moon));
  color += vec3(.16,.22,.14)*exp(-moon*24.0)*.35;
  color += (hash(gl_FragCoord.xy)-.5)/500.0;
  }
  gl_FragColor = vec4(color,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export const waterVertex = `
uniform mat4 textureMatrix;
varying vec4 vMirror;
varying vec3 vWorld;
void main() {
  vMirror = textureMatrix * vec4(position,1.0);
  vWorld = (modelMatrix * vec4(position,1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;
export const waterFragment = `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec4 uRipples[8];
uniform vec3 uTint;
uniform float uReflection;
uniform float uRain;
varying vec4 vMirror;
varying vec3 vWorld;
void main() {
  vec2 p = vWorld.xz;
  float t = uTime;
  vec2 wave = vec2(sin(p.y*1.8+t*.6)+sin(p.x*.9+p.y*.8-t*.4),cos(p.x*1.2+t*.3))*.0018;
  float glow = 0.0;
  for (int i=0;i<8;i++) {
    float age = t-uRipples[i].z;
    float distance = length(p-uRipples[i].xy);
    float front = distance-age*2.1;
    float ring = exp(-front*front*14.0) * exp(-age*.65) * step(0.0,age) * uRipples[i].w;
    wave += normalize(p-uRipples[i].xy+vec2(.001)) * ring*.008;
    glow += ring*.12;
  }
  vec2 cell=floor(p/4.0);
  float age=fract(t*.65+fract(sin(dot(cell,vec2(12.9898,78.233)))*43758.5453));
  float dist=length(fract(p/4.0)-.5)*4.0-age*2.4;
  glow+=exp(-dist*dist*70.0)*(1.0-age)*.18*uRain;
  vec2 uv = vMirror.xy/vMirror.w;
  vec3 reflection = texture2D(tDiffuse,uv+wave).rgb;
  float bands = .94+.06*sin(p.y*14.0+sin(p.x*.7+t)*1.5-t);
  vec3 color = mix(uTint,reflection*bands,uReflection);
  color += vec3(.28,.65,.46)*glow;
  float near = 1.0-smoothstep(-12.0,26.0,p.y);
  color *= .68+.32*near;
  gl_FragColor = vec4(color,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export const glowVertex = `
attribute float aAlpha;
uniform float uOpacity;
uniform float uSize;
varying float vAlpha;
void main() {
  vAlpha = aAlpha*uOpacity;
  vec4 p = modelViewMatrix * vec4(position,1.0);
  gl_PointSize = clamp(uSize*300.0/-p.z,1.0,28.0);
  gl_Position = projectionMatrix*p;
}`;
export const glowFragment = `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord-.5)*2.0;
  if(d>1.0) discard;
  float glow = exp(-d*d*5.0)*.45 + (1.0-smoothstep(.0,.22,d))*.55;
  gl_FragColor = vec4(uColor,glow*vAlpha);
}`;
