const clamp=x=>Math.max(0,Math.min(1,x));
export function facePose(s,t){
  // A complete blink has a closing stroke, a short hold and a slower opening.
  const cycle=((t+1.7)%5.8+5.8)%5.8;
  let blink=0;
  if(cycle<.1)blink=cycle/.1;
  else if(cycle<.18)blink=1;
  else if(cycle<.37)blink=1-(cycle-.18)/.19;
  const dreaming=s.stage>=3?(.5+.5*Math.sin(t*.28))*.7:0;
  const eyes=s.eyesHeld?1:Math.max(blink,dreaming*(s.trance??.55));
  const talking=s.playing&&s.time<(s.speechUntil||0);
  const syllable=.26+.43*Math.pow(Math.sin(t*9.1),2)+.24*Math.pow(Math.sin(t*14.3+.8),2);
  const mouth=talking?clamp(s.speechEnergy==null?syllable:s.speechEnergy):0;
  const pulse=Math.max(0,1-(s.time-(s.expandAt??-100))/4);
  return {eyes:clamp(eyes),mouth,expansion:clamp((s.expansion??.42)+pulse*.5),nodes:clamp(s.nodes??.55),trance:clamp(s.trance??.55)};
}
