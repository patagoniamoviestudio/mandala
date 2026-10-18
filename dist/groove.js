export const BPM=82;
export const STEP_SECONDS=60/BPM/4;
export const PATTERNS={a:[0,4,8,12],s:[0,3,6,8,11,14],d:[2,6,10,14],f:[0,7,8,15],q:[0,5,10],w:[1,4,7,10,13],e:[0,8],r:[0,4,6,8,12,14]};
export function groove(s,time=s.time){
  const position=Math.max(0,time)/STEP_SECONDS,step=Math.floor(position)%16,phase=position-Math.floor(position),running=s.playing&&!s.blackout;
  const voices={};let energy=0;
  for(const key of s.layers||[]){const hit=PATTERNS[key]?.includes(step);const pulse=running&&s.loopOn!==false&&hit?Math.exp(-phase*5.5):0;voices[key]=pulse;energy+=pulse;}
  const beat=running&&s.loopOn!==false&&step%4===0?Math.exp(-phase*4):0;
  return {step,phase,cycle:Math.floor(position/16),beat,energy:Math.min(1,energy*.35),voices};
}
