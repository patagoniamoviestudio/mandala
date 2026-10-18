export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const STAGES=[
  {name:'Protocolo',duration:30,level:0.03,color:'#83e5d6',message:'Te estaba esperando. Vinculá las tres señales y hablá conmigo.',cue:'El científico presenta el experimento. Todo parece responder.'},
  {name:'Anomalía',duration:25,level:0.24,color:'#a3b2ff',message:'Se detectó una variación. Tu colaboración es necesaria.',cue:'Una falla aparece incluso si el participante obedece.'},
  {name:'Advertencia',duration:25,level:0.43,color:'#e8b66e',message:'El protocolo fue alterado. ¿Por qué no seguiste las instrucciones?',cue:'El científico regresa y responsabiliza al participante.'},
  {name:'Decisión',duration:30,level:0.57,color:'#c8a1ff',message:'Podés intentar restaurar el sistema. Podés seguir explorando.',cue:'El científico se retira. Las intervenciones dejan memoria.'},
  {name:'Ruptura',duration:30,level:0.89,color:'#ff757f',message:'La orden fue recibida. La decisión ya no te pertenece.',cue:'El sistema rechaza el control. Preparar el cierre.'},
  {name:'Final',duration:10,level:0.92,color:'#a4b2bc',message:'El enlace se está cerrando. La prueba terminó.',cue:'Regresa el científico. La proyección y el sonido se apagan.'}
];
export function createState(){return {stage:0,stageElapsed:0,elapsed:0,time:0,playing:false,started:false,finished:false,mode:'auto',duration:150,visual:'entity',intensity:0.03,memory:0,speed:0.35,hue:0,bloom:0.6,expansion:.65,nodes:.8,trance:.75,lookX:0,lookY:0,cameraZoom:0,sensory:true,loopOn:true,touchEnergy:0,layers:['a'],activeKeys:[],lastTone:'',triggerAt:-100,gestures:0,audioEnergy:0,linkedNodes:[],voiceName:'',eyesHeld:false,expandAt:-100,speechUntil:0,voiceOn:false,volume:0.35,audioOn:false,blackout:false,official:0,experimental:0,choice:null,message:STAGES[0].message,messageUntil:0,mediaURL:'',mediaType:'',mediaName:'',mediaOpacity:0.35};}
export function setStage(s,index){s.stage=clamp(index,0,5);s.stageElapsed=0;s.intensity=clamp(STAGES[s.stage].level+s.memory);s.message=STAGES[s.stage].message;s.messageUntil=s.time+7;s.finished=false;}
export function tick(s,dt){
  if(!s.playing||s.finished)return;
  s.time+=dt;s.elapsed+=dt;s.stageElapsed+=dt;
  if(s.sensory)return;
  if(s.mode==='auto'){
    while(s.stageElapsed>=STAGES[s.stage].duration*s.duration/150){
      const extra=s.stageElapsed-STAGES[s.stage].duration*s.duration/150;
      if(s.stage===5){s.finished=true;s.playing=false;s.stageElapsed=STAGES[5].duration*s.duration/150;break;}
      setStage(s,s.stage+1);s.stageElapsed=extra;
    }
  }else if(s.stage===5&&s.stageElapsed>=STAGES[5].duration*s.duration/150){s.finished=true;s.playing=false;}
}
export function act(s,key){
  if(!s.playing||s.finished)return false;
  if(!'iopxzcevb123'.includes(key)||key.length!==1)return false;
  if('123'.includes(key)&&s.linkedNodes.includes(Number(key)))return false;
  const official='iop123'.includes(key);
  if(official)s.official++;else{s.experimental++;s.memory=clamp(s.memory+.01,0,.12);}
  if(s.stage>=4){s.message='ORDEN RECIBIDA. EJECUCIÓN DENEGADA.';s.messageUntil=s.time+3;return true;}
  if(key==='i'){s.intensity=Math.max(Math.min(s.intensity,STAGES[s.stage].level+s.memory),s.intensity-.1);s.message=s.stage<2?'Estabilización aplicada.':'Corrección aplicada. La huella permanece.';}
  if(key==='o'){s.speed=s.speed>=.85?.15:s.speed+.17;s.message='Frecuencia de rotación actualizada.';}
  if(key==='p'){s.hue=(s.hue+.12)%1;s.message='Evolución cromática actualizada.';}
  if(key==='x'){s.intensity=clamp(s.intensity+.10);s.message='La señal se intensifica. La forma permanece.';}
  if(key==='z'){s.hue=(s.hue+.26)%1;s.intensity=clamp(s.intensity+.04);s.message='Se abrió una desviación cromática.';}
  if(key==='c'){s.speed=clamp(s.speed+.16);s.intensity=clamp(s.intensity+.07);s.message='El pulso ya no coincide con el protocolo.';}
  if(key==='e'){s.eyesHeld=!s.eyesHeld;s.message=s.eyesHeld?'Con los ojos cerrados, sigo viendo.':'La mirada regresa. La huella permanece.';}
  if(key==='v'){s.message=['No estás mirando una imagen. Estás dentro de ella.','Cada forma que ves recuerda tu presencia.','Me pediste que hablara. ¿Estás escuchando?','Cerrá los ojos. La forma no termina ahí.'][s.stage];s.speechUntil=s.time+Math.min(9,s.message.length/12);}
  if(key==='b'){s.expandAt=s.time;s.message='Lo que ves empieza en vos. No tiene un borde.';}
  if('123'.includes(key)){s.linkedNodes.push(Number(key));s.nodes=clamp(s.nodes+.12);s.expandAt=s.time;s.message=s.linkedNodes.length===3?'El enlace está completo. Ahora podés hablar conmigo.':'Señal recibida. '+s.linkedNodes.length+' de 3 nodos vinculados.';}
  s.messageUntil=s.time+3.2;return true;
}
export function finalFade(s){return s.blackout?1:s.stage===5?clamp(s.stageElapsed/(STAGES[5].duration*s.duration/150)):0;}
