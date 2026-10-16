import {STAGES,createState,setStage,tick,act,clamp,finalFade} from './engine.js';
import {Visuals} from './visuals.js';
import {Sound} from './audio.js';
import {Voice} from './voice.js';
import {NOTES,pressSense,releaseSense} from './sensory.js';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const projectionMode=params.has('projection');
const channelId=params.get('projection')||crypto.randomUUID();
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('mandala-'+channelId):null;
let state=createState(),studio=false,projectionWindow=null,lastBroadcast=0,lastIncoming=0,renderTime=0,mediaSource='',mediaElement=null,toastTimer,hadConnection=false;
let lastTick=performance.now(),lastUI=0;
const sound=new Sound();
const voice=new Voice();let lastVoiceStage=-1;
voice.onError=()=>toast('La voz no está disponible en este navegador. La animación facial sigue activa.');
let voiceOptions='';voice.onVoices=()=>updateUI();
const movementKeys=new Set();
const inputHeld=new Set();
let visual;
try{visual=new Visuals($('visual'));}catch(error){$('rendererLabel').textContent='Error de visual';toast('No se pudo iniciar la visual. Probá habilitar la aceleración gráfica.');console.error(error);}
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
document.body.classList.add('intro-mode');
$('rendererLabel').innerHTML=visual?.gl?'WEBGL<span>VISUALES EN TIEMPO REAL</span>':'CANVAS 2D<span>COMPATIBILIDAD VISUAL</span>';
$('timeline').innerHTML=STAGES.map((s,i)=>`<button class="phase" data-stage="${i}" aria-label="Ir a fase ${i+1}: ${s.name}"><small>0${i+1}</small><b>${s.name}</b><span class="phase-fill"></span></button>`).join('');
$('instrumentKeys').innerHTML=Object.entries(NOTES).map(([k,n])=>`<button data-sense="${k}"><kbd>${k.toUpperCase()}</kbd><span>${n.name}<small>${n.effect} · ${Math.round(n.frequency)} Hz</small></span></button>`).join('');
$('startGame').innerHTML='<span aria-hidden="true">▶</span>';$('startGame').setAttribute('aria-label','Iniciar experiencia audiovisual');

function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4200);}
function notify(){if(channel&&!projectionMode)channel.postMessage({type:'state',state});}
function message(text){state.message=text;state.messageUntil=state.time+5;notify();}
function timeText(t){return `${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;}
function showView(value){
  studio=value;$('studio').hidden=!value;$('game').hidden=value;
  $('studioView').classList.toggle('selected',value);$('playView').classList.toggle('selected',!value);
  if(value){$('studioSceneSlot').append($('scene'));document.body.classList.remove('intro-mode');}
  else{$('game').prepend($('scene'));document.body.classList.toggle('intro-mode',!state.started);}
  updateUI();requestAnimationFrame(()=>visual?.size());
}
async function enableAudio(){try{await sound.enable();voice.bind(sound.ctx,sound.master);state.audioOn=true;return true;}catch{state.audioOn=false;toast('El navegador no habilitó el audio. Volvé a tocar Sonido.');return false;}}
async function toggleAudio(){if(state.audioOn)state.audioOn=false;else{await enableAudio();lastVoiceStage=-1;}voice.update(state);updateUI();notify();}
function speak(text){state.speechUntil=state.time+Math.min(12,Math.max(2.5,text.length/11));voice.speak(text,state);notify();}
async function start(){
  if(state.finished)reset();
  state.started=true;state.playing=true;lastTick=performance.now();
  document.body.classList.remove('intro-mode');
  // Web Audio is enabled only inside an explicit user action.
  await enableAudio();updateUI();notify();requestAnimationFrame(()=>visual?.size());
}
function togglePlay(){if(!state.started){start();return;}state.playing=!state.playing;if(!state.playing)releaseEverything();lastTick=performance.now();updateUI();notify();}
function reset(){
  voice.stop();lastVoiceStage=-1;
  releaseEverything();
  const settings={};for(const key of ['visual','hue','speed','bloom','volume','audioOn','duration','mode','mediaURL','mediaType','mediaName','mediaOpacity','expansion','nodes','trance','voiceOn','voiceName','sensory'])settings[key]=state[key];
  state=Object.assign(createState(),settings);sound.music.pause();sound.resumeMusic=false;if(sound.music.src)sound.music.currentTime=0;
  document.body.classList.toggle('intro-mode',!studio);updateUI();notify();
}
function command(key){
  if(projectionMode){channel?.postMessage({type:'key',key});return;}
  if(act(state,key)){document.querySelectorAll(`[data-key="${key}"]`).forEach(b=>{b.classList.add('pressed');setTimeout(()=>b.classList.remove('pressed'),160);});if('123'.includes(key)&&state.stage<4){sound.ping(Number(key));if(state.linkedNodes.length===3)speak(state.message);}if(key==='v'&&state.stage<4){speak(state.message);lastVoiceStage=state.stage;}notify();updateUI();}
}
async function beginSense(key){
  if(projectionMode){inputHeld.add(key);channel?.postMessage({type:'senseDown',key});return;}
  if(inputHeld.has(key)||!NOTES[key])return;inputHeld.add(key);
  if(!state.started)await start();else if(!state.playing){state.playing=true;lastTick=performance.now();await enableAudio();}
  if(inputHeld.has(key)&&pressSense(state,key)){sound.noteOn(key);notify();updateUI();}
}
function endSense(key){
  if(projectionMode){inputHeld.delete(key);channel?.postMessage({type:'senseUp',key});return;}
  inputHeld.delete(key);releaseSense(state,key);sound.noteOff(key);notify();updateUI();
}
function releaseEverything(){if(projectionMode)for(const key of inputHeld)channel?.postMessage({type:'senseUp',key});inputHeld.clear();sound.releaseAll();state.activeKeys=[];notify();}
function choose(value){if(state.stage!==3||state.choice||!state.playing)return;state.choice=value;
  if(value==='restore'){state.intensity=Math.max(.45,state.intensity-.12);message('Restauración solicitada. El sistema conserva lo ocurrido.');}
  else{state.intensity=clamp(state.intensity+.16);message('Elegiste explorar. El sistema ya lo había previsto.');}
  updateUI();
}
function syncMedia(){
  if(mediaSource===state.mediaURL)return;mediaSource=state.mediaURL;$('mediaLayer').replaceChildren();mediaElement=null;
  if(!mediaSource)return;
  mediaElement=document.createElement(state.mediaType==='video'?'video':'img');
  if(state.mediaType==='video'){mediaElement.loop=true;mediaElement.muted=true;mediaElement.playsInline=true;mediaElement.autoplay=true;}
  mediaElement.src=mediaSource;mediaElement.alt='Material visual de la sesión';mediaElement.onerror=()=>{toast('No se pudo leer ese material visual. Probá otro formato.');};
  $('mediaLayer').append(mediaElement);
}
function updateUI(){
  const stage=STAGES[state.stage];document.documentElement.style.setProperty('--stage',stage.color);
  document.body.classList.toggle('sensory-mode',state.sensory&&!studio);document.body.classList.toggle('sensory-session',state.sensory);
  document.body.classList.toggle('entity-game',state.visual==='entity');
  document.body.classList.toggle('playing',state.started&&!state.finished&&!studio&&!projectionMode);
  $('intro').hidden=state.started||studio||projectionMode;$('gameHud').hidden=!state.started||state.finished;
  $('ending').hidden=!state.finished||studio||projectionMode;
  $('participantControls').hidden=!state.started||state.finished||studio||projectionMode;
  $('gameStage').textContent=stage.name;$('gameStageNumber').textContent=`FASE 0${state.stage+1} / 06`;
  const phaseProgress=clamp(state.stageElapsed/(stage.duration*state.duration/150))*100;
  $('gameProgress').style.width=phaseProgress+'%';
  $('gameMessage').textContent=state.time<state.messageUntil?state.message:stage.message;
  $('pauseGame').textContent=state.playing?'Ⅱ Pausar':'▶ Continuar';
  $('connectionLabel').textContent=state.finished?'Registro cerrado':state.playing?'Experimento en curso':state.started?'Experimento en pausa':'Sistema en espera';
  $('transportPlay').textContent=state.finished?'↻ Otra sesión':state.playing?'Ⅱ Pausar':state.started?'▶ Continuar':'▶ Iniciar';
  $('clock').innerHTML=`${timeText(state.elapsed)} <small>/ ${state.sensory?'libre':timeText(state.duration)}</small>`;
  $('cueLabel').textContent=`0${state.stage+1} / ${stage.name.toUpperCase()}`;$('cueText').textContent=stage.cue;
  $('nextStage').disabled=state.stage===5;
  $('mode').value=state.sensory?'sensory':state.mode;$('duration').value=String(state.duration);
  $('duration').disabled=state.started;
  document.querySelectorAll('[data-stage]').forEach(b=>{const i=Number(b.dataset.stage);b.classList.toggle('active',i===state.stage);b.classList.toggle('done',i<state.stage);b.setAttribute('aria-current',i===state.stage?'step':'false');b.querySelector('.phase-fill').style.width=i<state.stage?'100%':i===state.stage?phaseProgress+'%':'0';});
  document.querySelectorAll('[data-visual]').forEach(b=>{b.classList.toggle('selected',b.dataset.visual===state.visual);b.setAttribute('aria-pressed',String(b.dataset.visual===state.visual));});
  for(const key of ['intensity','speed','hue','bloom','volume','mediaOpacity','expansion','nodes','trance']){
    if(document.activeElement!==$(key))$(key).value=state[key];
    $(key+'Out').textContent=key==='hue'?Math.round(state[key]*360)+'°':Math.round(state[key]*100)+'%';
  }
  $('blackout').setAttribute('aria-pressed',String(state.blackout));
  $('blackoutLayer').style.opacity=String(Math.max(state.blackout?1:0,finalFade(state)));
  $('audioToggle').setAttribute('aria-pressed',String(state.audioOn));$('audioToggle').setAttribute('aria-label',state.audioOn?'Desactivar sonido':'Activar sonido');
  $('audioStatus').textContent=state.blackout?'Silenciado · negro':state.audioOn?(state.playing?'Síntesis activa':'Listo · en pausa'):'En espera';
  $('footerAudio').textContent=state.audioOn?'≋ Sonido activado':'◌ Sonido desactivado';
  $('decision').hidden=state.stage!==3||!!state.choice||!state.playing;
  $('officialTotal').textContent=state.official;$('experimentalTotal').textContent=state.experimental;
  $('endingText').textContent=state.experimental===0?'Seguiste el protocolo. La alteración ocurrió de todos modos. El registro te señala como responsable.':'Exploraste los límites del sistema. Quedó una huella de cada intervención. El registro te señala como responsable.';
  $('mediaName').textContent=state.mediaName||'Sin capa cargada';$('mediaRemove').disabled=!state.mediaURL;$('mediaLayer').style.opacity=state.mediaOpacity;syncMedia();
  if(mediaElement?.tagName==='VIDEO'){if(state.playing&&!state.blackout&&mediaElement.paused)mediaElement.play().catch(()=>{});else if(!state.playing||state.blackout)mediaElement.pause();}
  $('musicPlay').textContent=sound.music.paused?'▶ Pista':'Ⅱ Pista';
  $('faceControls').hidden=state.visual!=='entity';$('entityOptions').hidden=state.visual!=='entity';
  document.querySelectorAll('.eye-label').forEach(e=>e.textContent=state.eyesHeld?'Abrir ojos':'Cerrar ojos');
  $('voiceToggle').setAttribute('aria-pressed',String(state.voiceOn));
  const voices=voice.voices(),selectedVoice=voice.selected(state),signature=voices.map(v=>v.name).join('|');
  if(signature!==voiceOptions){voiceOptions=signature;$('voiceSelect').replaceChildren();const auto=document.createElement('option');auto.value='';auto.textContent='Automática · femenina';$('voiceSelect').append(auto);for(const v of voices){const option=document.createElement('option');option.value=v.name;option.textContent=v.name+' · '+v.lang;$('voiceSelect').append(option);}}
  $('voiceSelect').value=state.voiceName;
  $('voiceStatus').textContent=!state.voiceOn?'Voz desactivada':!state.voiceName&&voice.manifestVoice?voice.manifestVoice:selectedVoice?selectedVoice.name:'Sin voz compatible';
  document.querySelectorAll('.expression-buttons button').forEach(b=>b.disabled=!state.playing||state.finished);
  $('signalCount').textContent=state.linkedNodes.length+' / 3';
  $('missionText').textContent=state.stage===0?(state.linkedNodes.length<3?'Vinculá los tres nodos del halo.':'Enlace completo. Hablá con ella [V].'):['','Escuchá. Ella recuerda tu señal.','El sistema te está observando.','Elegí cómo continuar el contacto.','Observá. Ella tomó el control.','Esperá el cierre del enlace.'][state.stage];
  $('nodeControls').hidden=!state.started||state.finished||studio||projectionMode||state.visual!=='entity';
  $('sensoryKeybed').hidden=!state.sensory||studio||projectionMode;
  $('sensoryPause').innerHTML=state.playing?'Ⅱ':'▶';$('sensoryPause').setAttribute('aria-label',state.playing?'Pausar experiencia':'Continuar experiencia');
  document.querySelectorAll('[data-sense]').forEach(b=>{const active=state.activeKeys.includes(b.dataset.sense);b.classList.toggle('pressed',active);b.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('.orbit-node').forEach(b=>{const linked=state.linkedNodes.includes(Number(b.dataset.key));b.classList.toggle('linked',linked);b.classList.toggle('locked',state.stage>=4);b.querySelector('i').textContent=linked?'ENLAZADO':state.stage>=4?'BLOQUEADO':'ENLAZAR';b.disabled=linked||!state.playing;});
}

if(projectionMode){
  document.body.classList.add('projection-mode');document.body.classList.remove('intro-mode');
  const waiting=document.createElement('div');waiting.className='projection-wait';waiting.id='projectionWait';waiting.textContent='Esperando conexión con el estudio…';$('scene').append(waiting);
  channel?.postMessage({type:'hello'});
  $('scene').addEventListener('dblclick',()=>{$('scene').requestFullscreen?.().catch(()=>{});});
  setInterval(()=>{if(lastIncoming&&Date.now()-lastIncoming>3500){waiting.hidden=false;waiting.textContent='Conexión con el estudio interrumpida. Volvé a la ventana principal.';state.blackout=true;updateUI();}},1000);
}else{
  $('studioView').onclick=()=>showView(true);$('playView').onclick=()=>showView(false);
  $('openStudio').onclick=()=>showView(true);$('sensoryPause').onclick=togglePlay;
  $('startGame').onclick=start;$('replay').onclick=()=>{reset();start();};$('pauseGame').onclick=togglePlay;
  $('transportPlay').onclick=()=>{if(state.finished){reset();start();}else togglePlay();};$('reset').onclick=reset;
  $('audioToggle').onclick=toggleAudio;$('footerAudio').onclick=toggleAudio;
  $('voiceToggle').onclick=()=>{state.voiceOn=!state.voiceOn;lastVoiceStage=-1;voice.update(state);notify();updateUI();};
  $('voiceSelect').onchange=e=>{state.voiceName=e.target.value;lastVoiceStage=-1;voice.stop();notify();updateUI();};
  $('scene').addEventListener('pointermove',e=>{if(!state.playing||studio)return;const r=$('scene').getBoundingClientRect();state.lookX=clamp((e.clientX-r.left)/r.width*2-1,-1,1);state.lookY=clamp(1-(e.clientY-r.top)/r.height*2,-1,1);});
  $('scene').addEventListener('pointerleave',()=>{state.lookX=0;state.lookY=0;});
  document.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>command(b.dataset.key));
  document.querySelectorAll('[data-sense]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);beginSense(b.dataset.sense);};b.onpointerup=()=>endSense(b.dataset.sense);b.onpointercancel=()=>endSense(b.dataset.sense);b.onlostpointercapture=()=>endSense(b.dataset.sense);});
  document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>choose(b.dataset.choice));
  document.querySelectorAll('[data-visual]').forEach(b=>b.onclick=()=>{state.visual=b.dataset.visual;notify();updateUI();});
  for(const key of ['intensity','speed','hue','bloom','volume','mediaOpacity','expansion','nodes','trance'])$(key).oninput=e=>{state[key]=Number(e.target.value);notify();updateUI();};
  document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{state.sensory=false;setStage(state,Number(b.dataset.stage));state.started=true;notify();updateUI();});
  $('mode').onchange=e=>{state.sensory=e.target.value==='sensory';if(!state.sensory)state.mode=e.target.value;state.elapsed=0;state.stageElapsed=0;notify();updateUI();};$('duration').onchange=e=>{if(!state.started)state.duration=Number(e.target.value);notify();};
  $('nextStage').onclick=()=>{if(state.stage<5){setStage(state,state.stage+1);notify();updateUI();}};
  $('blackout').onclick=()=>{state.blackout=!state.blackout;notify();updateUI();};
  $('projection').onclick=()=>{
    if(!channel){toast('Este navegador no permite sincronizar ventanas.');return;}
    const url=new URL(location.href);url.search='';url.searchParams.set('projection',channelId);
    $('projectionLink').href=url.href;$('projectionLink').hidden=false;
    projectionWindow=window.open(url.href,'mandala-projection','popup,width=1280,height=720');
    if(!projectionWindow)toast('Permití ventanas emergentes para abrir la proyección.');else toast('Mové la proyección al segundo monitor. Doble clic para pantalla completa.');
  };
  $('musicFile').onchange=e=>{
    const f=e.target.files[0];if(!f)return;
    if(f.size>150*1024*1024){toast('Elegí un audio de menos de 150 MB.');return;}
    sound.setMusic(f);$('musicName').textContent=f.name;$('musicPlay').disabled=false;$('musicRemove').disabled=false;e.target.value='';toast('Pista cargada. Tocá Pista para reproducirla.');
  };
  sound.music.onerror=()=>toast('Ese formato de audio no se pudo reproducir. Probá MP3 o WAV.');
  $('musicPlay').onclick=async()=>{
    if(!sound.music.paused){sound.music.pause();sound.resumeMusic=false;}
    else{if(!state.audioOn)await enableAudio();if(!state.started){state.started=true;document.body.classList.remove('intro-mode');}state.playing=true;lastTick=performance.now();try{await sound.music.play();}catch{toast('No se pudo reproducir la pista. Probá otro archivo de audio.');}}
    updateUI();notify();
  };
  $('musicRemove').onclick=()=>{sound.clearMusic();$('musicName').textContent='Sin pista cargada';$('musicPlay').disabled=true;$('musicRemove').disabled=true;updateUI();};
  $('mediaFile').onchange=e=>{
    const f=e.target.files[0];if(!f)return;if(!f.type.startsWith('image/')&&!f.type.startsWith('video/')){toast('Elegí una imagen o un video compatible.');return;}
    if(f.size>250*1024*1024){toast('Elegí un archivo de menos de 250 MB.');return;}
    if(state.mediaURL)URL.revokeObjectURL(state.mediaURL);state.mediaURL=URL.createObjectURL(f);state.mediaType=f.type.startsWith('video/')?'video':'image';state.mediaName=f.name;e.target.value='';updateUI();notify();
  };
  $('mediaRemove').onclick=()=>{if(state.mediaURL)URL.revokeObjectURL(state.mediaURL);state.mediaURL='';state.mediaName='';state.mediaType='';updateUI();notify();};
}
channel&&(channel.onmessage=e=>{
  if(projectionMode&&e.data.type==='state'){
    state=e.data.state;hadConnection=true;lastIncoming=Date.now();$('projectionWait').hidden=true;renderTime=state.time;updateUI();
  }else if(!projectionMode&&e.data.type==='hello'){notify();}
  else if(!projectionMode&&e.data.type==='key')command(e.data.key);
  else if(!projectionMode&&e.data.type==='senseDown')beginSense(e.data.key);
  else if(!projectionMode&&e.data.type==='senseUp')endSense(e.data.key);
});
$('helpButton').onclick=()=>$('help').showModal();$('closeHelp').onclick=()=>$('help').close();
$('help').addEventListener('click',e=>{if(e.target===$('help'))$('help').close();});
$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else $('scene').requestFullscreen?.().catch(()=>toast('La pantalla completa no está disponible en este navegador.'));};
document.addEventListener('keydown',e=>{
  if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||$('help').open)return;
  const k=e.key.toLowerCase();if(state.sensory&&NOTES[k]){e.preventDefault();beginSense(k);return;}if(state.sensory){if(!projectionMode&&e.code==='Space'){e.preventDefault();togglePlay();}return;}
  if(!projectionMode&&'wasd'.includes(k)&&k.length===1){e.preventDefault();movementKeys.add(k);return;}
  if(!projectionMode&&e.code==='Space'){e.preventDefault();if(state.started)togglePlay();return;}
  if(k==='f'){e.preventDefault();$('fullscreen').click();return;}
  if('iopxzcevb123'.includes(k)&&k.length===1){e.preventDefault();command(k);}
});
document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();movementKeys.delete(k);if(NOTES[k])endSense(k);});window.addEventListener('blur',()=>{movementKeys.clear();releaseEverything();});
// The narrative clock runs separately from rendering so a projection keeps progressing
// when the controller tab is in the background.
if(!projectionMode)setInterval(()=>{const now=performance.now();const dt=(now-lastTick)/1000;lastTick=now;if(state.playing){if(movementKeys.has('w'))state.cameraZoom=clamp(state.cameraZoom+dt*.8,-.8,.8);if(movementKeys.has('s'))state.cameraZoom=clamp(state.cameraZoom-dt*.8,-.8,.8);if(movementKeys.has('a'))state.lookX=clamp(state.lookX-dt*.8,-1,1);if(movementKeys.has('d'))state.lookX=clamp(state.lookX+dt*.8,-1,1);}tick(state,dt);sound.update(state,finalFade(state));voice.update(state);if(state.playing&&state.audioOn&&state.voiceOn&&state.visual==='entity'&&lastVoiceStage!==state.stage){lastVoiceStage=state.stage;speak(STAGES[state.stage].message);}updateUI();notify();},100);
function frame(now){
  if(!projectionMode)voice.frame(state);
  if(!projectionMode)state.audioEnergy=sound.energy();
  const t=projectionMode?state.time+(state.playing?Math.min((Date.now()-lastIncoming)/1000,.5):0):state.time;
  const idle=state.started?t:now/1000;
  visual?.draw(state,reducedMotion?idle*.12:idle,finalFade(state));
  if(studio&&now-lastUI>65){sound.waveform($('waveform'));lastUI=now;}
  requestAnimationFrame(frame);
}
updateUI();requestAnimationFrame(frame);
