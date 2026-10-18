import {NOTES} from './sensory.js';
import {groove,STEP_SECONDS} from './groove.js';
const target=(p,v,t,lag=.07)=>p.setTargetAtTime(v,t,lag);
export class Sound{
  constructor(){this.ctx=null;this.music=new Audio();this.music.loop=true;this.music.crossOrigin='anonymous';this.nodes=[];this.bins=new Uint8Array(256);this.musicURL='';this.keys=new Map();}
  async enable(){
    if(!this.ctx){
      const a=this.ctx=new AudioContext();
      this.master=a.createGain();this.master.gain.value=0;
      const highpass=a.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=28;
      const compressor=a.createDynamicsCompressor();compressor.threshold.value=-19;compressor.knee.value=18;compressor.ratio.value=5;compressor.attack.value=.012;compressor.release.value=.25;
      this.analyser=a.createAnalyser();this.analyser.fftSize=512;
      this.master.connect(highpass);highpass.connect(compressor);compressor.connect(this.analyser);this.analyser.connect(a.destination);
      this.space=a.createGain();this.space.gain.value=.15;
      const delay=a.createDelay(2),feedback=a.createGain(),damp=a.createBiquadFilter();delay.delayTime.value=STEP_SECONDS*3;feedback.gain.value=.27;damp.type='lowpass';damp.frequency.value=2300;
      this.space.connect(delay);delay.connect(damp);damp.connect(feedback);feedback.connect(delay);damp.connect(this.master);
      this.drone=a.createGain();this.drone.gain.value=0;this.drone.connect(this.master);this.drone.connect(this.space);
      // Harmonic reed buzz, resonant vocal tract and filtered breath: a synthetic
      // didgeridoo-inspired instrument, rather than a sample or a voice recording.
      const real=new Float32Array(40),imag=new Float32Array(40);for(let i=1;i<40;i++)imag[i]=Math.pow(i,-.72)*(i%2?1:.64);
      this.reed=a.createOscillator();this.reed.setPeriodicWave(a.createPeriodicWave(real,imag));this.reed.frequency.value=65.25;
      this.formants=[430,1050,2400].map((freq,i)=>{const f=a.createBiquadFilter(),g=a.createGain();f.type='bandpass';f.frequency.value=freq;f.Q.value=[3.5,5,7][i];g.gain.value=[.65,.48,.24][i];this.reed.connect(f);f.connect(g);g.connect(this.drone);return f;});
      const fundamental=a.createOscillator(),low=a.createGain();fundamental.type='sine';fundamental.frequency.value=65.25;low.gain.value=.3;fundamental.connect(low);low.connect(this.drone);fundamental.start();this.reed.start();
      const buffer=a.createBuffer(1,a.sampleRate*2,a.sampleRate),data=buffer.getChannelData(0);let seed=17;for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=(seed/1073741824-1)*.35;}
      const breath=a.createBufferSource(),airFilter=a.createBiquadFilter();this.air=a.createGain();this.air.gain.value=.01;breath.buffer=buffer;breath.loop=true;airFilter.type='bandpass';airFilter.frequency.value=1350;airFilter.Q.value=.8;breath.connect(airFilter);airFilter.connect(this.air);this.air.connect(this.drone);breath.start();
      const musicSource=a.createMediaElementSource(this.music),musicGain=a.createGain();musicGain.gain.value=.65;musicSource.connect(musicGain);musicGain.connect(this.master);
    }
    await this.ctx.resume();
  }
  update(s,fade){
    if(!this.ctx)return;const t=this.ctx.currentTime,g=groove(s),count=s.layers?.length||0;
    target(this.master.gain,s.audioOn&&s.playing&&!s.blackout?s.volume*(1-fade):0,t,.12);
    const movement=.5+.5*Math.sin(s.time*.63+(s.lookX||0)*1.3),held=(s.activeKeys?.length||0)*.06;
    const envelope=s.loopOn!==false?.65+g.beat*.2+g.energy*.2:.8;
    target(this.drone.gain,count?(.75+Math.min(count,5)*.04+held)*envelope:0,t,.045);
    target(this.reed.detune,Math.sin(s.time*.31)*3,t,.15);
    const bend=(s.lookY||0)*120+(s.touchEnergy||0)*170;
    target(this.formants[0].frequency,260+movement*420+g.energy*250+bend,t,.06);
    target(this.formants[1].frequency,780+(1-movement)*700+g.beat*260+bend,t,.065);
    target(this.formants[2].frequency,1800+movement*950+g.energy*400,t,.08);
    target(this.air.gain,.015+g.energy*.055+(s.touchEnergy||0)*.03,t,.1);
    for(const [key,n] of this.keys){const pulse=g.voices[key]||0;target(n.gain.gain,(.012+pulse*.027+(s.activeKeys?.includes(key)?.018:0))/Math.sqrt(Math.max(1,count*.5)),t,.045);}
    if(!s.playing||s.blackout||!s.audioOn){if(!this.music.paused){this.music.pause();this.resumeMusic=true;}}
    else if(this.resumeMusic&&this.music.src){this.resumeMusic=false;this.music.play().catch(()=>{});}
  }
  setMusic(file){if(this.musicURL)URL.revokeObjectURL(this.musicURL);this.musicURL=URL.createObjectURL(file);this.music.src=this.musicURL;this.resumeMusic=false;}
  clearMusic(){this.music.pause();this.music.removeAttribute('src');this.music.load();if(this.musicURL)URL.revokeObjectURL(this.musicURL);this.musicURL='';this.resumeMusic=false;}
  ping(index){if(!this.ctx)return;const a=this.ctx,o=a.createOscillator(),g=a.createGain(),t=a.currentTime;o.frequency.value=[392,493.88,587.33][index-1]||440;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.08,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.5);o.connect(g);g.connect(this.master);o.start();o.stop(t+.6);}
  noteOn(key){
    if(!this.ctx||!NOTES[key])return;this.noteOff(key);const n=NOTES[key],a=this.ctx,t=a.currentTime,g=a.createGain(),pan=a.createStereoPanner();pan.pan.value=n.pan*.65;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.018,t+.16);g.connect(pan);pan.connect(this.master);g.connect(this.space);
    const oscs=[];for(const [ratio,amount]of [[1,1],[.5,.13],[2,.055]]){const o=a.createOscillator(),layer=a.createGain();o.type='sine';o.frequency.value=n.frequency*ratio;layer.gain.value=amount;o.connect(layer);layer.connect(g);o.start();oscs.push(o);}this.keys.set(key,{gain:g,oscs,pan,startedAt:t});
  }
  noteOff(key){const n=this.keys.get(key);if(!n||!this.ctx)return;const t=this.ctx.currentTime;n.gain.gain.cancelAndHoldAtTime(t);target(n.gain.gain,0,t,.18);for(const o of n.oscs)o.stop(t+1.5);n.oscs[0].onended=()=>{n.gain.disconnect();n.pan.disconnect();};this.keys.delete(key);}
  releaseAll(){for(const k of [...this.keys.keys()])this.noteOff(k);}
  energy(){if(!this.analyser)return 0;this.analyser.getByteTimeDomainData(this.bins);let sum=0;for(const n of this.bins)sum+=((n-128)/128)**2;return Math.min(1,Math.sqrt(sum/this.bins.length)*7);}
  waveform(canvas){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);c.strokeStyle='#a5d6bf';c.lineWidth=1.5;c.beginPath();if(this.analyser){this.analyser.getByteTimeDomainData(this.bins);for(let i=0;i<this.bins.length;i++){const x=i/(this.bins.length-1)*w,y=(this.bins[i]-128)/128*h*.8+h/2;i?c.lineTo(x,y):c.moveTo(x,y);}}else{c.moveTo(0,h/2);c.lineTo(w,h/2);}c.stroke();}
}
