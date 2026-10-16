export const NOTES={
  a:{frequency:65.406,name:'Raíz',effect:'Luz cálida',wave:'sine',pan:-.65},
  s:{frequency:77.782,name:'Flujo',effect:'Órbitas',wave:'sine',pan:-.4},
  d:{frequency:98,name:'Materia',effect:'Nodos',wave:'triangle',pan:.15},
  f:{frequency:116.541,name:'Profundidad',effect:'Cámara',wave:'sine',pan:.65},
  q:{frequency:130.813,name:'Aura',effect:'Paleta',wave:'triangle',pan:-.75},
  w:{frequency:155.563,name:'Onda',effect:'Geometría',wave:'sine',pan:-.2},
  e:{frequency:195.998,name:'Mirada',effect:'Párpados',wave:'triangle',pan:.4},
  r:{frequency:233.082,name:'Expansión',effect:'Halo',wave:'sine',pan:.8}
};
const cycle=(v,step,min,max)=>v+step>max?min:v+step;
export function pressSense(s,key){
  if(!NOTES[key]||s.blackout||s.activeKeys.includes(key))return false;
  s.activeKeys.push(key);s.lastTone=key;s.triggerAt=s.time;s.gestures++;
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
