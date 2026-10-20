import {z} from 'zod';
import {legacyFile,legacyJson} from './io.js';
import {pendingProject,type AdaptedContent} from './types.js';
import type {Scene,ProductionProject} from '../manifest.js';
export async function adaptFullTimeline(root:string):Promise<AdaptedContent>{
 const facts=z.object({sources:z.record(z.string(),z.object({title:z.string(),url:z.url()}).passthrough())}).passthrough().parse(await legacyJson(root,'src/facts.json'));
 const original=z.array(z.object({id:z.string(),chapter:z.string(),kind:z.string(),title:z.string(),kicker:z.string(),text:z.string(),sources:z.array(z.string())}).passthrough()).min(1).parse(await legacyJson(root,'src/scenes.json'));
 const timeline=z.array(z.object({index:z.number().int(),id:z.string(),from:z.number().int(),durationInFrames:z.number().int().positive(),audio:z.string(),chapter:z.string()}).strict()).min(1).parse(await legacyJson(root,'src/timeline.json'));
 const captions=z.array(z.object({scene:z.number().int(),startFrame:z.number().int(),endFrame:z.number().int(),text:z.string(),spokenText:z.string(),file:z.string()}).strict()).parse(await legacyJson(root,'src/captions.json'));
 if(original.length!==timeline.length||original.some((s,i)=>s.id!==timeline[i]!.id||timeline[i]!.index!==i||s.chapter!==timeline[i]!.chapter))throw new Error('legacy_scene_timeline_mismatch');
 const cash=z.object({unit:z.string(),q3:z.object({operating:z.number().finite(),capex:z.number().finite(),dividends:z.number().finite(),investingNet:z.number().finite(),financingNet:z.number().finite(),fx:z.number().finite(),cashIncrease:z.number().finite()})}).passthrough().safeParse(facts);
 const narrative=new Set(['headline','question','ending','watch','boundary','owner']);const unsupported=new Set<string>();
 const chapterIds=new Map<string,string>();const scenes:Scene[]=original.map((s,i)=>{
  const t=timeline[i]!;if(!chapterIds.has(t.chapter))chapterIds.set(t.chapter,`chapter-${chapterIds.size}`);
  const common={id:s.id,from:t.from,durationFrames:t.durationInFrames,title:s.title,chapterId:chapterIds.get(t.chapter)!,sourceIds:s.sources};
  if(s.kind==='waterfall'&&cash.success){const q=cash.data.q3;return {...common,template:'waterfall',data:{unit:cash.data.unit,start:{id:'operating',label:'经营现金净流入',value:q.operating},steps:[{id:'capex',label:'资本开支',value:-q.capex},{id:'dividends',label:'现金股息',value:-q.dividends},{id:'other',label:'其他净影响（含汇率）',value:q.investingNet+q.capex+q.financingNet+q.dividends+q.fx}],end:{id:'increase',label:'现金净增',value:q.cashIncrease}}};}
  if(!narrative.has(s.kind))unsupported.add(`unmapped_visual:${s.kind}`);
  return {...common,template:'evidence',data:{id:`excerpt-${i}`,text:`${s.kicker}\n${s.text}`,sourceId:s.sources[0]??'legacy'}};
 });
 const sources:ProductionProject['sources']=Object.entries(facts.sources).map(([id,s])=>({id,citation:s.title,url:s.url}));sources.push({id:'legacy',citation:'Historical scene text; original source records copied without new fact verification'});
 for(const [i,scene] of scenes.entries())if(scene.template==='waterfall'){
  const id=`qualifier-${i}`;sources.push({id,citation:`原归一化画面限定说明（新图使用原始金额，须复核）· ${original[i]!.kicker}`});scene.sourceIds.push(id);
 }
 const cues=captions.map((c,i)=>{const s=timeline[c.scene];if(!s||c.startFrame<s.from||c.endFrame>s.from+s.durationInFrames)throw new Error(`legacy_caption_scene_bounds:${i}`);return {id:`cue-${i}`,text:c.text,startFrame:c.startFrame,endFrame:c.endFrame};});
 const project=pendingProject('历史完整时间轴迁移待审',scenes,cues,original.map(s=>({id:s.id,text:`${s.kicker}\n${s.text}`,sourceIds:s.sources})),sources);
 const selected:AdaptedContent['selected']=[];for(const relative of ['src/facts.json','src/scenes.json','src/timeline.json','src/captions.json'])selected.push({source:await legacyFile(root,relative),name:relative.slice(4),mediaType:'data'});
 for(const [i,file] of [...new Set(timeline.map(t=>t.audio))].entries())selected.push({source:await legacyFile(root,`public/${file}`),name:`scene-${i}.wav`,mediaType:'audio'});
 return {project,selected,mappings:original.map((s,i)=>({sourceId:s.id,targetId:s.id,note:scenes[i]!.template==='waterfall'?'Signed cash components map to reconciled waterfall':narrative.has(s.kind)?'Narrative text and qualifier map to evidence excerpt':`Narrative placeholder only; ${s.kind} graphics NOT mapped`})),unsupportedFeatures:[...unsupported,'segmented_audio_requires_explicit_timeline_assembly'],differences:['Text: full original paragraphs, kickers and displayed captions retained; spokenText differences remain in copied captions.json.','Data: full facts.json copied; known cash waterfall uses original raw values/units rather than normalized rounded chart values; no fresh verification inferred.','Timing: exact integer scene/caption frames retained.','Visual: narrative text maps to evidence; other custom graphics remain explicitly blocked placeholders. Original chapter labels remain in copied timeline records.','Audio: selected scene WAV files copied; no complete narration guessed or automatically mixed.']};
}
