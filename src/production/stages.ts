import {parseProject,type ProductionProject} from './manifest.js';
export type Stage={id:string;sceneId:string;from:number;to:number;kind:'animation'|'hold'};
export function compileStages(value:ProductionProject):Stage[]{
 const p=parseProject(value),stages:Stage[]=[];
 for(const s of p.scenes){const events=p.events.filter(e=>e.sceneId===s.id).map(e=>{if(e.precision==='unresolved')throw new Error(`unresolved_event:${e.id}`);const from=p.cues.find(c=>c.id===e.cueId)!.startFrame+e.offsetFrames;return {from,to:from+e.durationFrames};});
  if(p.render.theme==='broadcast-v1')events.push({from:s.from,to:Math.min(s.from+18,s.from+s.durationFrames)});
  const cuts=[...new Set([s.from,s.from+s.durationFrames,...events.flatMap(e=>[e.from,e.to]),...p.cues.flatMap(c=>[c.startFrame,c.endFrame]).filter(f=>f>s.from&&f<s.from+s.durationFrames)])].sort((a,b)=>a-b);
  for(let i=0;i<cuts.length-1;i++){const from=cuts[i]!,to=cuts[i+1]!;stages.push({id:`${s.id}-${from}-${to}`,sceneId:s.id,from,to,kind:events.some(e=>from<e.to&&to>e.from)?'animation':'hold'});}
 }return stages;
}
