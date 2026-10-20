import {parseProject,type ProductionProject,type Cue} from './manifest.js';

function milliseconds(value:string):number {
 const m=value.match(/^(\d{2}):([0-5]\d):([0-5]\d),(\d{3})$/);if(!m)throw new Error('invalid_srt_timestamp');
 return Number(m[1])*3600000+Number(m[2])*60000+Number(m[3])*1000+Number(m[4]);
}
export function parseSrt(text:string,fps:30):Cue[] {
 if(fps!==30)throw new Error('unsupported_fps');
 const normalized=text.replace(/^\uFEFF/,'').replaceAll('\r\n','\n').trim();if(!normalized)return [];
 const cues:Cue[]=[];const ids=new Set<string>();let previousMs=0,previousFrame=0;
 for(const block of normalized.split(/\n\s*\n/)){
  const lines=block.split('\n'),index=lines.shift(),range=lines.shift();
  if(!index||!/^\d+$/.test(index)||!range||!lines.join('\n').trim())throw new Error('invalid_srt_block');
  const m=range.match(/^(\S+) --> (\S+)$/);if(!m)throw new Error('invalid_srt_range');
  const start=milliseconds(m[1]!),end=milliseconds(m[2]!),id=`cue-${Number(index)}`;
  if(ids.has(id)||start<previousMs||end<=start)throw new Error(`invalid_srt_order:${id}`);ids.add(id);
  const startFrame=Math.floor(start*fps/1000),endFrame=Math.ceil(end*fps/1000);
  if(startFrame<previousFrame)throw new Error(`rounded_cue_collision:${cues.at(-1)!.id}:${id}`);
  if(endFrame>108000)throw new Error('srt_duration_limit');
  const content=lines.join('\n').trim();if(content.length>180)throw new Error(`cue_text_limit:${id}`);
  cues.push({id,text:content,startFrame,endFrame});previousMs=end;previousFrame=endFrame;
 }
 return cues;
}
export function validateTimeline(project:ProductionProject):void {
 const p=parseProject(project);for(const e of p.events)if(e.precision==='unresolved')throw new Error(`unresolved_event:${e.id}`);
}
export function frameStamp(frame:number,kind:'srt'|'ass'='srt',edge:'start'|'end'|'nearest'='nearest'):string {
 const units=kind==='srt'?1000:100,round=edge==='start'?Math.ceil:edge==='end'?Math.floor:Math.round,n=round(frame*units/30),seconds=Math.floor(n/units);
 const h=Math.floor(seconds/3600),m=Math.floor(seconds/60)%60,s=seconds%60;
 return `${kind==='srt'?String(h).padStart(2,'0'):h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${kind==='srt'?',':'.'}${String(n%units).padStart(kind==='srt'?3:2,'0')}`;
}
