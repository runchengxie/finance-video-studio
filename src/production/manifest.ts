import {z} from 'zod';
import path from 'node:path';
import {numericClaimSchema,validateClaimLinks} from './evidence-ledger.js';

export const idSchema=z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/);
const text=(max:number)=>z.string().trim().min(1).max(max);
const number=z.number().finite().min(-1e15).max(1e15);
const frame=z.number().int().min(0).max(216000);
export function isInputPath(value:string):boolean {
 return !path.posix.isAbsolute(value)&&!path.win32.isAbsolute(value)&&!value.includes('\\')&&
  !value.includes(':')&&value.startsWith('inputs/')&&value.split('/').every(p=>p!==''&&p!=='.'&&p!=='..');
}
export const inputSchema=z.object({id:idSchema,path:text(1024).refine(isInputPath,'Use a project-relative inputs/ path'),mediaType:z.enum(['audio','evidence','data','image','video']),sha256:z.string().regex(/^[a-f0-9]{64}$/),provenance:text(4000),rights:text(4000)}).strict();
const sourceSchema=z.object({id:idSchema,citation:text(4000),url:z.url().optional(),inputId:idSchema.optional()}).strict();
const blockSchema=z.object({id:idSchema,text:text(8000),sourceIds:z.array(idSchema).max(1000)}).strict();
const point=z.object({id:idSchema,label:text(80),value:number}).strict();
const highlightSchema=z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1),width:z.number().positive().max(1),height:z.number().positive().max(1),cueId:idSchema}).strict().refine(r=>r.x+r.width<=1&&r.y+r.height<=1,'Highlight exceeds image');
const presentationSchema=z.object({chartStyle:z.enum(['bars','values']).optional(),layout:z.enum(['evidence','wide-chart','explanation']),chapterLabel:text(120),headline:text(120).optional(),sidebar:z.array(z.object({label:text(120),cueId:idSchema.optional()}).strict()).max(3).optional(),evidencePanels:z.array(z.object({inputId:idSchema,sourceId:idSchema,label:text(120),pageLabel:text(80),highlight:highlightSchema.optional()}).strict()).max(2).optional()}).strict();
const sceneBase={presentation:presentationSchema.optional(),id:idSchema,from:frame,durationFrames:frame.min(1),title:text(120),chapterId:idSchema.optional(),sourceIds:z.array(idSchema).max(1000)};
const unit=text(80);
const precision=z.number().int().min(0).max(8).optional();
const sceneSchema=z.discriminatedUnion('template',[
 z.object({...sceneBase,template:z.literal('metric'),data:z.object({id:idSchema,label:text(80),value:number,unit,precision,qualifier:text(1000).optional()}).strict()}).strict(),
 z.object({...sceneBase,template:z.literal('comparison'),data:z.object({unit,precision,items:z.array(point.extend({value:number.min(0)})).min(2).max(8),difference:z.object({leftId:idSchema,rightId:idSchema,label:text(80),unit:text(80).optional(),cueId:idSchema.optional()}).strict().optional()}).strict()}).strict(),
 z.object({...sceneBase,template:z.literal('signed-comparison'),data:z.object({unit,precision,items:z.array(point).min(2).max(8)}).strict()}).strict(),
 z.object({...sceneBase,template:z.literal('waterfall'),data:z.object({unit,start:point,steps:z.array(point).min(1).max(12),end:point}).strict()}).strict(),
 z.object({...sceneBase,template:z.literal('trend'),data:z.object({unit,series:z.array(z.object({id:idSchema,label:text(80),values:z.array(z.object({label:text(80),value:number}).strict()).min(2).max(100)}).strict()).min(1).max(4)}).strict()}).strict(),
 z.object({...sceneBase,template:z.literal('process'),data:z.object({items:z.array(z.object({id:idSchema,label:text(80),detail:text(240)}).strict()).min(2).max(6)}).strict()}).strict(),
 z.object({...sceneBase,template:z.literal('evidence'),data:z.object({id:idSchema,text:text(1000),sourceId:idSchema}).strict()}).strict()
]);
const cueSchema=z.object({id:idSchema,text:text(180),startFrame:frame,endFrame:frame.min(1)}).strict();
const eventSchema=z.object({id:idSchema,sceneId:idSchema,cueId:idSchema,targetId:idSchema,action:z.enum(['reveal','highlight','compare','annotate']),offsetFrames:z.number().int().min(-108000).max(108000),durationFrames:z.number().int().min(1).max(300),precision:z.enum(['cue_start','manually_aligned','unresolved'])}).strict();
const renderSchema=z.object({theme:z.enum(['studio-v1','broadcast-v1']),visual:z.object({preset:z.enum(['warm-paper','navy']),motion:z.enum(['static','subtle'])}).strict().optional(),broadcast:z.object({programName:text(80),backgroundVideoId:idSchema.optional()}).strict().optional(),crf:z.number().int().min(0).max(40),audioId:idSchema.nullable(),normalization:z.object({targetLufs:z.number().min(-30).max(-10),truePeak:z.number().min(-6).max(-.1)}).strict().nullable(),backgroundAudioId:idSchema.optional()}).strict();
export const manifestSchema=z.object({schemaVersion:z.literal(2),id:idSchema,title:text(120),contentLanguage:z.enum(['en','zh']),fictional:z.boolean(),fps:z.union([z.literal(30),z.literal(60)]),width:z.union([z.literal(1920),z.literal(1080)]),height:z.union([z.literal(1080),z.literal(1440)]),durationFrames:frame.min(1),
 numericClaims:z.array(numericClaimSchema).max(20000).optional(),
 internalNotes:z.array(z.object({id:idSchema,text:text(4000)}).strict()).max(500).optional(),
 delivery:z.object({cover:z.object({headline:text(80),subtitle:text(120),series:text(80),imageId:idSchema.optional(),imageLabel:text(120).optional()}).strict()}).strict().optional(),
 inputs:z.array(inputSchema).max(2000),sources:z.array(sourceSchema).max(1000),manuscript:z.array(blockSchema).min(1).max(500),scenes:z.array(sceneSchema).min(1).max(500),cues:z.array(cueSchema).max(20000),events:z.array(eventSchema).max(50000),render:renderSchema,reviewPath:text(1024).optional()}).strict();
export type ProductionProject=z.infer<typeof manifestSchema>;
export type InputAsset=z.infer<typeof inputSchema>;
export type Scene=z.infer<typeof sceneSchema>;
export type Cue=z.infer<typeof cueSchema>;
export type Event=z.infer<typeof eventSchema>;
export type Source=z.infer<typeof sourceSchema>;
export type ManuscriptBlock=z.infer<typeof blockSchema>;
export type RenderSettings=z.infer<typeof renderSchema>;

export function targetIds(scene:Scene):string[] {
 switch(scene.template){
  case 'metric':case 'evidence':return [scene.data.id];
  case 'comparison':case 'signed-comparison':case 'process':return scene.data.items.map(p=>p.id);
  case 'waterfall':return [scene.data.start,...scene.data.steps,scene.data.end].map(p=>p.id);
  case 'trend':return scene.data.series.map(p=>p.id);
 }
}
function unique(ids:string[],kind:string):void {if(new Set(ids).size!==ids.length)throw new Error(`duplicate_${kind}_id`);}
export function parseProject(value:unknown):ProductionProject {
 const p=manifestSchema.parse(value);
 if(!((p.width===1920&&p.height===1080&&p.fps===30)||(p.width===1080&&p.height===1440&&p.fps===60)))throw new Error('unsupported_output_profile');
 if(p.durationFrames>p.fps*3600)throw new Error('duration_limit');
 if(p.width===1080&&p.render.broadcast?.backgroundVideoId)throw new Error('portrait_background_video_unsupported');
 if(p.width===1080&&p.scenes.some(s=>s.presentation?.evidencePanels?.length))throw new Error('portrait_evidence_panels_unsupported');
 for(const [kind,items] of Object.entries({input:p.inputs,source:p.sources,manuscript:p.manuscript,scene:p.scenes,cue:p.cues,event:p.events}))unique(items.map(x=>x.id),kind);
 const inputs=new Map(p.inputs.map(x=>[x.id,x])),sources=new Set(p.sources.map(x=>x.id));
 if(p.internalNotes)unique(p.internalNotes.map(x=>x.id),'internal_note');
 if(p.delivery?.cover.imageId&&inputs.get(p.delivery.cover.imageId)?.mediaType!=='image')throw new Error('unknown_cover_image');
 if(p.delivery?.cover.imageId&&!p.delivery.cover.imageLabel)throw new Error('cover_image_label_required');
 for(const s of p.sources)if(s.inputId&&!inputs.has(s.inputId))throw new Error(`unknown_source_input:${s.id}`);
 for(const s of [...p.manuscript,...p.scenes])for(const id of s.sourceIds)if(!sources.has(id))throw new Error(`unknown_source:${id}`);
 for(const id of [p.render.audioId,p.render.backgroundAudioId])if(id&&inputs.get(id)?.mediaType!=='audio')throw new Error(`unknown_audio:${id}`);
 if((p.render.theme==='broadcast-v1')!==Boolean(p.render.broadcast))throw new Error('broadcast_settings_theme');
 const backgroundId=p.render.broadcast?.backgroundVideoId;
 if(backgroundId&&inputs.get(backgroundId)?.mediaType!=='video')throw new Error('unknown_background_video');
 const cues=new Map(p.cues.map(c=>[c.id,c]));
 for(const s of p.scenes){
  if(s.template==='comparison'&&s.data.difference?.cueId){const c=cues.get(s.data.difference.cueId);if(!c||c.startFrame<s.from||c.startFrame>=s.from+s.durationFrames)throw new Error('difference_cue_reference');}
  const presentation=s.presentation;if(!presentation)continue;
  if(presentation.chartStyle==='values'&&s.template!=='comparison'&&s.template!=='signed-comparison')throw new Error('value_list_requires_comparison');
  for(const panel of presentation.evidencePanels??[]){
   if(inputs.get(panel.inputId)?.mediaType!=='image')throw new Error('unknown_panel_image');
   if(!sources.has(panel.sourceId)||!s.sourceIds.includes(panel.sourceId))throw new Error('panel_source_reference');
  }
  for(const id of [...(presentation.sidebar??[]).map(x=>x.cueId),...(presentation.evidencePanels??[]).map(x=>x.highlight?.cueId)]){
   if(!id)continue;const cue=cues.get(id);
   if(!cue||cue.endFrame<=s.from||cue.startFrame>=s.from+s.durationFrames)throw new Error('presentation_cue_reference');
  }
 }
 if(p.render.normalization&&!p.render.audioId)throw new Error('normalization_requires_audio');
 let end=0;const chapters=new Set<string>();let lastChapter:string|undefined;
 for(const s of p.scenes){
  if(s.from!==end)throw new Error(`scene_coverage:${s.id}`);end+=s.durationFrames;
  unique(targetIds(s),'target');
  if(s.chapterId!==lastChapter){if(s.chapterId&&chapters.has(s.chapterId))throw new Error(`discontinuous_chapter:${s.chapterId}`);if(s.chapterId)chapters.add(s.chapterId);lastChapter=s.chapterId;}
  if(s.template==='waterfall'&&Math.abs(s.data.start.value+s.data.steps.reduce((n,x)=>n+x.value,0)-s.data.end.value)>1e-6)throw new Error(`waterfall_reconciliation:${s.id}`);
  if(s.template==='comparison'&&s.data.difference){const d=s.data.difference,ids=targetIds(s);if(d.leftId===d.rightId||!ids.includes(d.leftId)||!ids.includes(d.rightId))throw new Error(`comparison_reference:${s.id}`);}
  if(s.template==='trend'){const labels=JSON.stringify(s.data.series[0]!.values.map(x=>x.label));if(s.data.series.some(x=>JSON.stringify(x.values.map(y=>y.label))!==labels))throw new Error(`trend_intervals:${s.id}`);}
  if(s.template==='evidence'&&!sources.has(s.data.sourceId))throw new Error(`unknown_evidence_source:${s.id}`);
 }
 if(end!==p.durationFrames)throw new Error('scene_duration_mismatch');
 if(p.scenes.some(s=>s.chapterId)&&p.scenes.some(s=>!s.chapterId))throw new Error('chapter_coverage');
 end=0;for(const c of p.cues){if(c.startFrame<end||c.endFrame<=c.startFrame||c.endFrame>p.durationFrames)throw new Error(`invalid_cue:${c.id}`);end=c.endFrame;}
 const sceneMap=new Map(p.scenes.map(s=>[s.id,s])),cueMap=new Map(p.cues.map(c=>[c.id,c]));
 for(const e of p.events){const s=sceneMap.get(e.sceneId),c=cueMap.get(e.cueId);if(!s||!c)throw new Error(`event_reference:${e.id}`);if(!targetIds(s).includes(e.targetId))throw new Error(`event_target:${e.id}`);const from=c.startFrame+e.offsetFrames;if(from<s.from||from+e.durationFrames>s.from+s.durationFrames)throw new Error(`event_bounds:${e.id}`);}
 validateClaimLinks(p);return p;
}
