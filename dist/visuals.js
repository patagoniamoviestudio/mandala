import {facePose} from './face-motion.js';
const TAU=Math.PI*2;
function petal(ctx,inner,outer,width){
  const d=outer-inner;
  ctx.beginPath();ctx.moveTo(0,-inner);
  ctx.bezierCurveTo(-width*.75,-inner-d*.21,-width,-outer+d*.24,0,-outer);
  ctx.bezierCurveTo(width,-outer+d*.24,width*.75,-inner-d*.21,0,-inner);ctx.closePath();
}
function mandalaTexture(){
  const c=document.createElement('canvas');c.width=c.height=1200;const x=c.getContext('2d');x.translate(600,600);
  const rings=[
    {n:48,i:405,o:549,w:26,c:['#083a45','#d47d23','#fff3a2','#cc6c16'],r:0},
    {n:24,i:303,o:476,w:49,c:['#06242d','#078a86','#63efb5','#165762'],r:.065},
    {n:16,i:195,o:411,w:75,c:['#101645','#2838a0','#b078fc','#2035a4'],r:0},
    {n:16,i:177,o:340,w:56,c:['#170b38','#4948c7','#27d4e6','#443a96'],r:TAU/32},
    {n:24,i:115,o:239,w:30,c:['#36102d','#b3414d','#ffc36b','#6e2544'],r:0},
    {n:32,i:71,o:170,w:17,c:['#142858','#5166ba','#ef9ee5','#274797'],r:.03},
    {n:24,i:28,o:97,w:12,c:['#0b4140','#1e9e9d','#e8ce75','#803f8c'],r:0}
  ];
  for(const ring of rings){
    x.save();x.rotate(ring.r);
    for(let j=0;j<ring.n;j++){
      x.save();x.rotate(j*TAU/ring.n);
      const g=x.createLinearGradient(0,-ring.i,0,-ring.o);g.addColorStop(0,ring.c[0]);g.addColorStop(.32,ring.c[1]);g.addColorStop(.72,ring.c[2]);g.addColorStop(1,ring.c[3]);
      petal(x,ring.i,ring.o,ring.w);x.fillStyle=g;x.shadowColor=ring.c[1];x.shadowBlur=8;x.fill();x.shadowBlur=0;x.strokeStyle='#f7d991';x.lineWidth=1.8;x.stroke();
      for(let k=1;k<=4;k++){
        const d=ring.o-ring.i;petal(x,ring.i+d*k*.055,ring.o-d*k*.052,ring.w*(1-k*.16));
        x.strokeStyle=k%2?'#060b39cc':ring.c[2];x.lineWidth=k===1?3:1;x.stroke();
      }
      x.beginPath();x.moveTo(0,-ring.i-12);x.quadraticCurveTo(-ring.w*.14,-(ring.i+ring.o)*.5,0,-ring.o+15);x.strokeStyle='#f0dea577';x.lineWidth=.8;x.stroke();
      const d=ring.o-ring.i;
      for(let k=0;k<7;k++){
        const rr=ring.i+d*(.27+k*.075),ww=Math.sin((rr-ring.i)/d*Math.PI)*ring.w*.45;
        x.beginPath();x.moveTo(0,-rr);x.quadraticCurveTo(ww*.5,-rr-9,ww,-rr-19);x.moveTo(0,-rr);x.quadraticCurveTo(-ww*.5,-rr-9,-ww,-rr-19);x.strokeStyle=ring.c[2]+'8c';x.lineWidth=.6;x.stroke();
      }
      for(let k=0;k<5;k++){const rr=ring.i+d*(.28+k*.13);x.beginPath();x.arc(0,-rr,1.1,0,TAU);x.fillStyle='#fcf2c9';x.fill();}
      x.restore();
    }
    x.restore();
    x.beginPath();x.arc(0,0,ring.i+4,0,TAU);x.strokeStyle=ring.c[2];x.lineWidth=2;x.stroke();
  }
  for(let r=30;r>4;r-=4){x.beginPath();x.arc(0,0,r,0,TAU);x.fillStyle=['#3152b1','#4ed8be','#a16ac7','#e8b868'][(r/2)%4];x.fill();}
  const glow=x.createRadialGradient(0,0,0,0,0,18);glow.addColorStop(0,'#fff5ce');glow.addColorStop(.3,'#8fffdc');glow.addColorStop(1,'#134b68');x.beginPath();x.arc(0,0,12,0,TAU);x.fillStyle=glow;x.fill();
  for(let j=0;j<96;j++){const a=j*TAU/96,r=560+(j%2)*9;x.beginPath();x.arc(Math.cos(a)*r,Math.sin(a)*r,j%2?1:2,0,TAU);x.fillStyle=j%2?'#5f80d4':'#e3dba1';x.fill();}
  return c;
}
const fragment=`precision mediump float;
uniform vec2 res,camera;uniform float time,level,hue,bloom,style,speed,fade,eyeClose,mouthOpen,expansion,nodes,trance,cameraZoom,audioEnergy,charge,triggerTime;uniform sampler2D art;
vec3 spectrum(float t){return .52+.48*cos(t+vec3(0.,2.094,4.188));}
vec3 hueRotate(vec3 c,float a){vec3 k=normalize(vec3(1.));return c*cos(a)+cross(k,c)*sin(a)+k*dot(k,c)*(1.-cos(a));}
float segment(vec2 p,vec2 a,vec2 b){vec2 q=p-a,v=b-a;return length(q-v*clamp(dot(q,v)/dot(v,v),0.,1.));}
vec2 hash2(float n){return fract(sin(vec2(n*127.1,n*311.7))*43758.5453);}
vec3 expression(vec2 uv){
 vec2 st=clamp(uv,.002,.998)*.5;
 vec3 neutral=texture2D(art,st).rgb;
 vec3 eyes=texture2D(art,st+vec2(.5,0.)).rgb;
 vec3 mouth=texture2D(art,st+vec2(0.,.5)).rgb;
 vec3 both=texture2D(art,st+vec2(.5,.5)).rgb;
 float eyeMask=max(1.-smoothstep(.7,1.2,length((uv-vec2(.405,.435))/vec2(.101,.049))),1.-smoothstep(.7,1.2,length((uv-vec2(.595,.435))/vec2(.101,.049))));
 float mouthMask=1.-smoothstep(.65,1.2,length((uv-vec2(.5,.634))/vec2(.106,.077)));
 vec3 col=mix(neutral,eyes,eyeClose*eyeMask);
 return mix(col,mix(mouth,both,eyeClose*eyeMask),mouthOpen*mouthMask);
}
void main(){
 vec2 p=(gl_FragCoord.xy-.5*res)/min(res.x,res.y)*2.;float r=length(p),theta=atan(p.y,p.x);
 vec2 q=p;
 vec3 background=vec3(.004,.009,.015);
 float mist=exp(-pow(p.x*.7,2.)-pow(p.y+.3,2.))*(.025+.008*sin(time*.13+p.x*2.));
 background+=vec3(.13,.45,.5)*mist;
 float shafts=pow(abs(sin(theta*4.+time*.009)),28.)*exp(-r*.7)*.025;
 background+=vec3(.65,.42,.18)*shafts;
 vec3 c=background;
 if(style<.5){
   float angle=theta+time*.025*speed;
   q=vec2(cos(angle),sin(angle))*r/(1.+sin(time*.6)*.006);
   vec2 uv=q*.52+.5;uv.y=1.-uv.y;
   vec4 tex=texture2D(art,clamp(uv,0.,1.));
   float inBounds=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
   c+=max(vec3(0.),hueRotate(tex.rgb,hue*6.283))*tex.a*inBounds*(.75+bloom*.5);
 }else{
   // Rigid camera motion only. The portrait's geometry is never stretched or rippled.
   vec2 drift=vec2(sin(time*.16)*.012,sin(time*.21)*.006)+camera*.035;
   q=(p-drift)/(1.015+cameraZoom*.13+sin(time*.65)*.003);
   float roll=sin(time*.12)*.002; q=mat2(cos(roll),-sin(roll),sin(roll),cos(roll))*q;
   vec2 uv=q*.5+.5;uv.y=1.-uv.y;
   float edge=1.-smoothstep(.91,1.12,max(abs(q.x),abs(q.y)));
   float inside=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
   vec3 portrait=expression(uv)*(.82+bloom*.4);
   c=mix(c,portrait,edge*inside);
   float faceMask=exp(-pow(p.x/.48,4.)-pow((p.y+.03)/.7,4.));
   for(int i=0;i<12;i++){
     float id=float(i),angle=id*.523599+time*.065*(.5+speed);
     float radius=.88+expansion*.21+sin(time*.32)*.025;
     vec2 pos=vec2(cos(angle)*radius,sin(angle)*radius*.83+ .19)-camera*.025;
     float nextAngle=angle+.523599;
     vec2 other=vec2(cos(nextAngle)*radius,sin(nextAngle)*radius*.83+.19)-camera*.025;
     float distance=length(p-pos);float depth=.8+.25*sin(angle);
     float bead=.00018*depth/(distance*distance+.00032);
     float wire=exp(-segment(p,pos,other)*250.);
     vec3 tone=spectrum(id*.5+hue*6.283+time*.08);
     c+=tone*(bead+wire*.09)*nodes*(1.-faceMask*.94);
   }
   for(int j=0;j<3;j++){
     float phase=fract(time*.045+float(j)/3.);
     float radius=.60+phase*1.4+expansion*.14;
     float ellipse=length((p-vec2(0.,.18))/vec2(1.,.88));
     float ring=exp(-pow((ellipse-radius)/.0028,2.));
     c+=spectrum(float(j)*1.3+hue*6.283)*ring*sin(phase*3.14159)*.06*trance*(1.-faceMask);
   }
 }
 // Floating motes occupy different depth layers and move independently of the face.
 for(int k=0;k<48;k++){
   vec2 seed=hash2(float(k)+1.);float z=.25+seed.x*.75;
   vec2 pos=vec2((seed.x*2.-1.)*2.6,mod(seed.y*3.6+time*.025*(.3+z),3.6)-1.8);
   pos.x+=sin(time*.2+float(k))*.07;pos-=camera*.055*z;
   float d=length(p-pos);float mote=exp(-d*d/(.000007+z*.000018));
   c+=mix(vec3(.3,.8,.74),vec3(.95,.66,.28),seed.y)*mote*(.18+.35*z);
 }
 // Psychedelic light lives in its own spatial field; it never warps portrait UVs.
 vec2 root=p-vec2(0.,.14);float radial=length(root),angle=atan(root.y,root.x);
 float faceProtect=exp(-pow(p.x/.43,4.)-pow((p.y+.02)/.66,4.));
 float surround=1.-faceProtect*.88;
 float petals=sin(angle*16.+time*.12+sin(angle*8.+time*.07)*trance*.4);
 float rings=sin(log(1.+radial)*18.-time*(.35+speed*.2)+petals*(.35+expansion*.3));
 float lace=exp(-abs(rings)*27.);
 vec2 z=vec2(root.x,root.y)*1.4;float lattice=0.;
 for(int k=0;k<4;k++){
   float a=.65+sin(time*.06)*.12;z=mat2(cos(a),-sin(a),sin(a),cos(a))*abs(z)-vec2(.65,.42);
   lattice+=exp(-abs(length(z)-.36)*75.)*.25;
   z*=1.22;
 }
 vec3 aurora=spectrum(angle*1.5+radial*5.-time*.14+hue*6.283);
 float strength=.24+trance*.45+charge*.35+audioEnergy*.5;
 c+=aurora*(lace*.42+lattice*.7)*surround*strength; c+=spectrum(hue*6.283+radial*.7)*exp(-pow(radial-1.2,2.)*1.5)*.025*trance;
 float pulseRadius=.2+triggerTime*.8;
 float pulse=exp(-pow((radial-pulseRadius)/.018,2.))*(1.-smoothstep(2.,3.2,triggerTime));
 c+=spectrum(hue*6.283+radial*4.)*pulse*surround*.32;
 vec3 movingLight=mix(vec3(.75,.94,1.15),vec3(1.12,.84,1.03),.5+.5*sin(angle+time*.19+hue*6.283));
 c*=mix(vec3(1.),movingLight,.12+charge*.35+audioEnergy*.15);
 float vignette=1.-smoothstep(.4,2.7,r)*.28;
 c=max(c,vec3(0.));c=c/(1.+c*.12);
 gl_FragColor=vec4(c*vignette*(1.-fade),1.);
}`;
export class Visuals{
  constructor(canvas){
    this.canvas=canvas;this.floral=mandalaTexture();this.entity=null;this.lastStyle='';this.failed=false;
    const img=new Image();img.onload=()=>{this.entity=img;this.lastStyle='';};img.onerror=()=>{this.failed=true;};img.src=new URL('./assets/entity-cinematic-atlas.png',import.meta.url).href;
    this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'});
    if(this.gl){
      const g=this.gl;const shader=(type,source)=>{const s=g.createShader(type);g.shaderSource(s,source);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));return s;};
      this.program=g.createProgram();g.attachShader(this.program,shader(g.VERTEX_SHADER,'attribute vec2 pos;void main(){gl_Position=vec4(pos,0.,1.);}'));g.attachShader(this.program,shader(g.FRAGMENT_SHADER,fragment));g.linkProgram(this.program);if(!g.getProgramParameter(this.program,g.LINK_STATUS))throw Error(g.getProgramInfoLog(this.program));g.useProgram(this.program);
      const b=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,b);g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),g.STATIC_DRAW);const a=g.getAttribLocation(this.program,'pos');g.enableVertexAttribArray(a);g.vertexAttribPointer(a,2,g.FLOAT,false,0,0);
      this.texture=g.createTexture();g.bindTexture(g.TEXTURE_2D,this.texture);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);this.loc={};for(const k of ['res','time','level','hue','bloom','style','speed','fade','eyeClose','mouthOpen','expansion','nodes','trance','camera','cameraZoom','audioEnergy','charge','triggerTime'])this.loc[k]=g.getUniformLocation(this.program,k);
    }else this.ctx=canvas.getContext('2d');
    this.resize=new ResizeObserver(()=>this.size());this.resize.observe(canvas);this.size();
  }
  size(){const d=Math.min(devicePixelRatio||1,1.5);this.canvas.width=Math.max(1,Math.round(this.canvas.clientWidth*d));this.canvas.height=Math.max(1,Math.round(this.canvas.clientHeight*d));if(this.gl)this.gl.viewport(0,0,this.canvas.width,this.canvas.height);}
  draw(s,t,fade=0){
    const entity=s.visual==='entity'&&this.entity;const source=entity?this.entity:this.floral;
    const pose=facePose(s,t);const now=performance.now(),dt=Math.min(.08,(now-(this.previousFrame??now-16))/1000);this.previousFrame=now;const smooth=1-Math.exp(-dt*15);this.eyePosition=(this.eyePosition??0)+(pose.eyes-(this.eyePosition??0))*smooth;this.mouthPosition=(this.mouthPosition??0)+(pose.mouth-(this.mouthPosition??0))*smooth;this.camX=(this.camX??0)+((s.lookX||0)-(this.camX??0))*(1-Math.exp(-dt*3));this.camY=(this.camY??0)+((s.lookY||0)-(this.camY??0))*(1-Math.exp(-dt*3));this.camZoom=(this.camZoom??0)+((s.cameraZoom||0)-(this.camZoom??0))*(1-Math.exp(-dt*4));this.motion??={};for(const key of ['hue','bloom','nodes','trance','expansion','speed','audioEnergy']){const target=key==='expansion'?pose.expansion:(s[key]??0);this.motion[key]??=target;let delta=target-this.motion[key];if(key==='hue'){if(delta>.5)delta-=1;if(delta<-.5)delta+=1;}this.motion[key]+=delta*(1-Math.exp(-dt*(key==='audioEnergy'?8:2.8)));}this.charge=(this.charge??0)+(Math.min(1,(s.activeKeys?.length||0)/4)-(this.charge??0))*(1-Math.exp(-dt*3));
    if(this.gl){const g=this.gl;g.useProgram(this.program);g.bindTexture(g.TEXTURE_2D,this.texture);const style=entity?'entity':'floral';if(this.lastStyle!==style){g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,source);this.lastStyle=style;}g.uniform2f(this.loc.res,this.canvas.width,this.canvas.height);for(const [k,v]of Object.entries({time:t,level:s.intensity,hue:this.motion.hue,bloom:this.motion.bloom,style:entity?1:0,speed:this.motion.speed,fade,eyeClose:this.eyePosition,mouthOpen:this.mouthPosition,expansion:this.motion.expansion,nodes:this.motion.nodes,trance:this.motion.trance,cameraZoom:this.camZoom,audioEnergy:this.motion.audioEnergy,charge:this.charge,triggerTime:Math.max(0,s.time-(s.triggerAt??-100))}))g.uniform1f(this.loc[k],v);g.uniform2f(this.loc.camera,this.camX,this.camY);g.drawArrays(g.TRIANGLES,0,6);
    }else{const c=this.ctx,w=this.canvas.width,h=this.canvas.height;const dim=Math.min(w,h)*.95;c.clearRect(0,0,w,h);c.fillStyle='#010307';c.fillRect(0,0,w,h);c.save();c.globalAlpha=1-fade;c.translate(w/2,h/2);if(!entity)c.rotate(t*.025*s.speed);c.filter=`hue-rotate(${s.hue*360}deg) brightness(${.65+s.bloom*.7})`;if(entity)c.drawImage(source,0,0,source.width/2,source.height/2,-dim/2,-dim/2,dim,dim);else c.drawImage(source,-dim/2,-dim/2,dim,dim);c.restore();}
  }
}
