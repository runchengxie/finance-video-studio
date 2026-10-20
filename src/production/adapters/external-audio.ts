import {z} from 'zod';
import path from 'node:path';
import {legacyFile,legacyJson} from './io.js';
import {pendingProject,type AdaptedContent} from './types.js';
import type {Scene} from '../manifest.js';
export async function adaptExternalAudio(root:string):Promise<AdaptedContent>{
 const facts=z.object({sources:z.record(z.string(),z.url())}).passthrough().parse(await legacyJson(root,'src/facts.json'));
 const original=z.array(z.object({index:z.number().int(),cue:z.number().int(),kind:z.string(),phase:z.number().int(),title:z.string(),subtitle:z.string(),from:z.number().int(),chapter:z.string(),frames:z.number().int().positive()}).strict()).min(1).parse(await legacyJson(root,'src/scenes.json'));
 const cues=z.array(z.object({id:z.number().int(),start:z.number().finite().nonnegative(),end:z.number().finite().positive(),text:z.string()}).strict()).parse(await legacyJson(root,'src/cues.json'));
 const auth=z.object({version:z.literal(1),inputs:z.array(z.object({file:z.string(),sha256:z.string().regex(/^[a-f0-9]{64}$/)}).strict())}).passthrough().parse(await legacyJson(root,'production-authorization.json'));
 const audio=auth.inputs.filter(i=>/\.(mp3|wav|m4a|flac|aac|ogg)$/i.test(i.file));if(audio.length!==1||!path.isAbsolute(audio[0]!.file))throw new Error('one_exact_bound_audio_required');
 if(original.some((s,i)=>s.index!==i))throw new Error('legacy_scene_index_order');
 const cash=z.object({unit:z.string(),operating:z.number().finite().nonnegative(),capex:z.number().finite().nonnegative(),gap:z.number().finite()}).passthrough().safeParse(facts),narrative=new Set(['intro','news','ending','scope','watch']);const unsupported=new Set<string>();
 const chapters=new Map<string,string>(),scenes:Scene[]=original.map((s,i)=>{
  if(!chapters.has(s.chapter))chapters.set(s.chapter,`chapter-${chapters.size}`);const common={id:`scene-${i}`,from:s.from,durationFrames:s.frames,title:s.title,chapterId:chapters.get(s.chapter)!,sourceIds:['legacy']};
  if((s.kind==='cash'||s.kind==='gap')&&cash.success&&Math.abs(cash.data.capex-cash.data.operating-cash.data.gap)<1e-6)return {...common,sourceIds:Object.keys(facts.sources),template:'comparison',data:{unit:cash.data.unit,items:[{id:'operating',label:'经营现金净流入',value:cash.data.operating},{id:'capex',label:'资本开支',value:cash.data.capex}],difference:{leftId:'operating',rightId:'capex',label:'差额'}}};
  if(!narrative.has(s.kind))unsupported.add(`unmapped_visual:${s.kind}`);
  return {...common,template:'evidence',data:{id:`excerpt-${i}`,text:s.subtitle,sourceId:'legacy'}};
 });
 const sources=[{id:'legacy',citation:'Historical storyboard subtitle; inspect copied facts and source records before approval'},...Object.entries(facts.sources).map(([id,url])=>({id,citation:`Historical source ${id}`,url}))];
 for(const [i,scene] of scenes.entries())if(scene.template==='comparison'){const id=`qualifier-${i}`;sources.push({id,citation:`原镜限定说明 · ${original[i]!.subtitle}`});scene.sourceIds.push(id);}
 const project=pendingProject('外部配音项目迁移待审',scenes,cues.map(c=>({id:`cue-${c.id}`,text:c.text,startFrame:Math.round(c.start*30),endFrame:Math.round(c.end*30)})),[...cues.map(c=>({id:`block-${c.id}`,text:c.text,sourceIds:Object.keys(facts.sources)})),...original.map((s,i)=>({id:`qualifier-${i}`,text:s.subtitle,sourceIds:Object.keys(facts.sources)}))],sources);
 const selected:AdaptedContent['selected']=[];for(const relative of ['src/facts.json','src/scenes.json','src/cues.json','production-authorization.json'])selected.push({source:await legacyFile(root,relative),name:path.basename(relative),mediaType:'data'});
 selected.push({source:audio[0]!.file,name:`narration${path.extname(audio[0]!.file).toLowerCase()}`,mediaType:'audio',expectedHash:audio[0]!.sha256});
 return {project,selected,mappings:original.map((s,i)=>({sourceId:String(s.index),targetId:`scene-${i}`,note:scenes[i]!.template==='comparison'?'Operating cash / capex / reconciled gap map to shared-baseline comparison':narrative.has(s.kind)?'Storyboard narrative maps to evidence excerpt':`Storyboard placeholder only; ${s.kind} custom graphic NOT mapped`})),unsupportedFeatures:[...unsupported],differences:['Text: displayed historical captions retained verbatim; no typo replacement or transcription performed.','Data: original facts and old authorization copied as evidence; old approval is not a v2 approval. Known cash/capex/gap use exact original values and units.','Timing: legacy Math.round(seconds*30) conversion preserved, unlike new SRT floor/ceil; no captions silently shifted.','Visual: narrative excerpts and shared-baseline cash comparison replace known scenes; other custom graphic semantics remain unmapped.','Audio: exact legacy hash-bound external audio copied into stable new inputs; no voice or retiming inferred.']};
}
