export const NOTES={
  a:{frequency:522,name:'Centro',effect:'Aura dorada',wave:'sine',pan:-.18},
  s:{frequency:396,name:'Flujo',effect:'Espirales líquidas',wave:'sine',pan:-.55},
  d:{frequency:417,name:'Materia',effect:'Constelación',wave:'sine',pan:.4},
  f:{frequency:639,name:'Profundidad',effect:'Túnel fractal',wave:'sine',pan:.65},
  q:{frequency:285,name:'Prisma',effect:'Aurora de color',wave:'sine',pan:-.65},
  w:{frequency:741,name:'Geometría',effect:'Cristales infinitos',wave:'sine',pan:-.35},
  e:{frequency:852,name:'Mirada',effect:'Ojos y loto',wave:'sine',pan:.35},
  r:{frequency:963,name:'Expansión',effect:'Ondas concéntricas',wave:'sine',pan:.18}
};
const cycle=(v,step,min,max)=>v+step>max?min:v+step;
export function pressSense(s,key){
  if(!NOTES[key]||s.blackout||s.activeKeys.includes(key))return false;
  s.activeKeys.push(key);s.lastTone=key;s.triggerAt=s.time;s.gestures++;
  s.layers??=[];
  s.layers=s.layers.includes(key)?s.layers.filter(k=>k!==key):[...s.layers,key];
  if(key==='a'){s.hue=(s.hue+.065)%1;s.bloom=cycle(s.bloom,.12,.45,.9);}
  if(key==='s')s.speed=cycle(s.speed,.16,.15,.95);
  if(key==='d')s.nodes=cycle(s.nodes,.2,.3,1);
  if(key==='f')s.cameraZoom=cycle(s.cameraZoom,.25,-.35,.7);
  if(key==='q')s.hue=(s.hue+.17)%1;
  if(key==='w')s.trance=cycle(s.trance,.23,.3,1);
  if(key==='e')s.eyesHeld=!s.eyesHeld;
  if(key==='r'){s.expansion=cycle(s.expansion,.23,.35,1);s.expandAt=s.time;}
  return true;
}
export function releaseSense(s,key){s.activeKeys=s.activeKeys.filter(k=>k!==key);}
