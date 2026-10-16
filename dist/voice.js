const FEMALE=/(helena|sabina|elvira|dalia|paulina|monica|mónica|luciana|elena|laura|conchita|lupe|catalina|maria|maría|ximena|paloma|lucia|lucía|isabella|camila|female|mujer|zira|samantha|susan|google español|google español de estados unidos)/i;
export function chooseVoice(voices,name=''){
  return voices.find(v=>v.name===name)||voices.find(v=>/^es/i.test(v.lang)&&FEMALE.test(v.name))||voices.find(v=>FEMALE.test(v.name))||null;
}
export class Voice{
  constructor(){this.synth=typeof window.speechSynthesis!=='undefined'?window.speechSynthesis:null;this.current=null;this.paused=false;this.onError=null;this.onVoices=null;this.clip=new Audio();this.clip.preload='auto';this.clips={};this.manifestVoice='';this.ticket=0;if(this.synth)this.synth.addEventListener('voiceschanged',()=>this.onVoices?.());this.ready=fetch(new URL('./assets/voice/manifest.json',import.meta.url)).then(r=>r.ok?r.json():null).then(m=>{if(m){this.clips=m.clips;this.manifestVoice=m.voice;this.onVoices?.();}}).catch(()=>{});}
  voices(){return this.synth?.getVoices()||[];}
  selected(state){return chooseVoice(this.voices(),state.voiceName);}
  bind(ctx,destination){if(this.source)return;this.source=ctx.createMediaElementSource(this.clip);this.analyser=ctx.createAnalyser();this.analyser.fftSize=256;this.samples=new Uint8Array(256);const gain=ctx.createGain();gain.gain.value=.85;this.source.connect(this.analyser);this.analyser.connect(gain);gain.connect(destination);}
  async speak(text,state){
    if(!state.voiceOn||!state.audioOn||!state.playing||state.blackout)return;
    this.stop();const ticket=this.ticket;await this.ready;if(ticket!==this.ticket||!state.playing||state.blackout)return;
    const asset=this.clips[text];
    if(asset&&!state.voiceName){
      this.clip.src=new URL('./assets/voice/'+asset.file,import.meta.url).href;this.clip.volume=this.source?1:Math.min(1,state.volume*1.5);
      this.clipActive=true;this.clip.onended=()=>{if(ticket===this.ticket){this.clipActive=false;state.speechUntil=state.time;state.speechEnergy=null;}};
      this.clip.onloadedmetadata=()=>{if(ticket===this.ticket)state.speechUntil=state.time+this.clip.duration+.2;};
      try{await this.clip.play();if(ticket===this.ticket)state.speechUntil=state.time+Math.max(this.clip.duration||0,3);}catch{this.clipActive=false;this.native(text,state);}return;
    }
    this.native(text,state);
  }
  native(text,state){
    if(!this.synth)return;
    const selected=this.selected(state);if(!selected){this.onError?.();return;}
    const u=new SpeechSynthesisUtterance(text);
    u.voice=selected;u.lang=selected.lang;u.rate=.96;u.pitch=1.04;u.volume=Math.min(1,state.volume*1.5);
    this.current=u;u.onstart=()=>{if(this.current===u)state.speechUntil=state.time+Math.max(4,text.length/10);};u.onboundary=()=>{if(this.current===u)state.speechUntil=Math.max(state.speechUntil,state.time+1.2);};
    u.onend=()=>{if(this.current===u){this.current=null;state.speechUntil=state.time;}};
    u.onerror=e=>{if(this.current===u){this.current=null;if(!['canceled','interrupted'].includes(e.error))this.onError?.();}};
    this.synth.speak(u);
  }
  update(state){
    if(this.clipActive){
      if(!state.voiceOn||!state.audioOn||state.blackout||state.finished||state.visual!=='entity'){this.stop();state.speechEnergy=null;return;}
      if(!state.playing&&!this.paused){this.clip.pause();this.paused=true;}
      else if(state.playing&&this.paused){this.clip.play().catch(()=>{});this.paused=false;}
    }
    if(!this.current)return;
    if(!state.voiceOn||!state.audioOn||state.blackout||state.finished||state.visual!=='entity'){this.stop();return;}
    if(!state.playing&&!this.paused){this.synth.pause();this.paused=true;}
    else if(state.playing&&this.paused){this.synth.resume();this.paused=false;}
  }
  frame(state){if(this.clipActive&&!this.clip.paused&&this.analyser){this.analyser.getByteTimeDomainData(this.samples);let sum=0;for(const n of this.samples)sum+=((n-128)/128)**2;state.speechEnergy=Math.min(1,Math.sqrt(sum/this.samples.length)*5);}else state.speechEnergy=this.clipActive?0:null;}
  stop(){this.ticket++;this.clip.pause();this.clipActive=false;if(this.current){this.current=null;this.synth.cancel();}this.paused=false;}
}
