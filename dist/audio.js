import {NOTES} from './sensory.js';
export class Sound{
  constructor(){this.ctx=null;this.music=new Audio();this.music.loop=true;this.music.crossOrigin='anonymous';this.nodes=[];this.bins=new Uint8Array(128);this.musicURL='';this.keys=new Map();}
  async enable(){
    if(!this.ctx){
      this.ctx=new AudioContext();const a=this.ctx;
      this.master=a.createGain();this.master.gain.value=0;
      const compressor=a.createDynamicsCompressor();compressor.threshold.value=-15;compressor.ratio.value=6;
      this.analyser=a.createAnalyser();this.analyser.fftSize=256;
      this.master.connect(compressor);compressor.connect(this.analyser);this.analyser.connect(a.destination);
      this.filter=a.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=1600;this.filter.Q.value=1;this.filter.connect(this.master);
      for(const [i,f]of [55,110,164.81,220,329.63].entries()){
        const osc=a.createOscillator(),gain=a.createGain();osc.type=i<2?'sine':'triangle';osc.frequency.value=f;gain.gain.value=i<2?.11:.025;osc.connect(gain);gain.connect(this.filter);osc.start();this.nodes.push({osc,gain,base:f});
      }
      const lfo=a.createOscillator(),depth=a.createGain();lfo.frequency.value=.17;depth.gain.value=230;lfo.connect(depth);depth.connect(this.filter.frequency);lfo.start();
      const musicSource=a.createMediaElementSource(this.music);const musicGain=a.createGain();musicGain.gain.value=.65;musicSource.connect(musicGain);musicGain.connect(this.master);
    }
    await this.ctx.resume();
  }
  update(s,fade){
    if(!this.ctx)return;const a=this.ctx,t=a.currentTime;
    this.master.gain.setTargetAtTime(s.audioOn&&s.playing&&!s.blackout?s.volume*(1-fade):0,t,.22);
    this.filter.frequency.setTargetAtTime(800+s.intensity*2100+Math.sin(s.time*.5)*80,t,.3);
    this.nodes.forEach((n,i)=>{n.osc.detune.setTargetAtTime(s.intensity*(i%2?1:-1)*(18+i*9)+Math.sin(s.time*(.4+i*.13))*s.intensity*18,t,.3);n.gain.gain.setTargetAtTime((i<2?.11:.025)*(1+Math.sin(s.time*(1.1+s.speed*3))*s.intensity*.45),t,.2);});
    if(!s.playing||s.blackout||!s.audioOn){if(!this.music.paused){this.music.pause();this.resumeMusic=true;}}
    else if(this.resumeMusic&&this.music.src){this.resumeMusic=false;this.music.play().catch(()=>{});}
  }
  setMusic(file){if(this.musicURL)URL.revokeObjectURL(this.musicURL);this.musicURL=URL.createObjectURL(file);this.music.src=this.musicURL;this.resumeMusic=false;}
  clearMusic(){this.music.pause();this.music.removeAttribute('src');this.music.load();if(this.musicURL)URL.revokeObjectURL(this.musicURL);this.musicURL='';this.resumeMusic=false;}
  ping(index){if(!this.ctx)return;const a=this.ctx,o=a.createOscillator(),g=a.createGain(),t=a.currentTime;o.type='sine';o.frequency.value=[392,493.88,587.33][index-1]||440;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.18,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+.7);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.75);}
  noteOn(key){if(!this.ctx||!NOTES[key])return;this.noteOff(key);const n=NOTES[key],a=this.ctx,t=a.currentTime,g=a.createGain(),pan=a.createStereoPanner();pan.pan.value=n.pan;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.11,t+.09);g.gain.setTargetAtTime(.065,t+.15,.65);g.connect(pan);pan.connect(this.master);const oscs=[];for(const [ratio,gain,type] of [[1,1,n.wave],[2,.22,'sine']]){const o=a.createOscillator(),layer=a.createGain();o.type=type;o.frequency.value=n.frequency*ratio;layer.gain.value=gain;o.connect(layer);layer.connect(g);o.start();oscs.push(o);}this.keys.set(key,{gain:g,oscs,pan,startedAt:t});}
  noteOff(key){const n=this.keys.get(key);if(!n||!this.ctx)return;const t=this.ctx.currentTime,release=Math.max(t,n.startedAt+.12);n.gain.gain.cancelScheduledValues(release);n.gain.gain.setTargetAtTime(.00001,release,.35);for(const o of n.oscs)o.stop(t+2.2);this.keys.delete(key);}
  releaseAll(){for(const k of [...this.keys.keys()])this.noteOff(k);}
  energy(){if(!this.analyser)return 0;this.analyser.getByteTimeDomainData(this.bins);let sum=0;for(const n of this.bins)sum+=((n-128)/128)**2;return Math.min(1,Math.sqrt(sum/this.bins.length)*7);}
  waveform(canvas){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);c.strokeStyle='#86cfbb';c.lineWidth=1.2;c.beginPath();if(this.analyser){this.analyser.getByteTimeDomainData(this.bins);for(let i=0;i<this.bins.length;i++){const x=i/(this.bins.length-1)*w,y=(this.bins[i]-128)/128*h*.8+h/2;i?c.lineTo(x,y):c.moveTo(x,y);}}else{c.moveTo(0,h/2);c.lineTo(w,h/2);}c.stroke();}
}
