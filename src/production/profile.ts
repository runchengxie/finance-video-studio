import {z} from 'zod';
import type {ProductionProject,Scene} from './manifest.js';
const id=z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/);
const note=z.string().trim().min(1).max(4000);
export const productionProfileSchema=z.object({id:z.literal('portrait-explainer-v1'),audioEdit:z.discriminatedUnion('decision',[
 z.object({decision:z.literal('pending')}).strict(),
 z.object({decision:z.literal('retain_full'),sourceAudioId:id,reason:note}).strict(),
 z.object({decision:z.literal('trim'),sourceAudioId:id,outputAudioId:id,startSeconds:z.number().finite().min(0),endSeconds:z.number().finite().positive(),notes:note}).strict()
])}).strict();
export type ProductionProfile=z.infer<typeof productionProfileSchema>;
export type ProfileIssue={code:string;severity:'error'|'warning';message:string;id?:string};
function targets(scene:Scene):string[]{
 switch(scene.template){
  case 'metric':case 'evidence':return [scene.data.id];
  case 'comparison':case 'signed-comparison':case 'process':return scene.data.items.map(x=>x.id);
  case 'trend':return scene.data.series.map(x=>x.id);
  case 'waterfall':return [scene.data.start,...scene.data.steps,scene.data.end].map(x=>x.id);
  case 'custom':return scene.data.targets;
 }
}
export function productionProfileIssues(p:ProductionProject):ProfileIssue[]{
 const profile=p.productionProfile;
 if(!profile)return p.fictional?[]:[{code:'production_profile_missing',severity:'warning',message:'Legacy manifest has no production profile; explicitly check aspect ratio, frame rate, cue motion and audio edits before resuming.'}];
 const issues:ProfileIssue[]=[],error=(code:string,message:string,id?:string)=>issues.push({code,severity:'error',message,...(id?{id}:{})});
 if(p.width!==1080||p.height!==1440||p.fps!==60)error('production_profile_format','portrait-explainer-v1 requires 1080x1440 at 60fps; do not reinterpret existing frame numbers.');
 if(p.render.theme!=='broadcast-v1'||p.render.visual?.preset!=='warm-paper'||p.render.visual.motion!=='subtle')error('production_profile_visual','portrait-explainer-v1 requires warm-paper broadcast styling and subtle background motion.');
 for(const scene of p.scenes)for(const target of targets(scene))if(!p.events.some(e=>e.sceneId===scene.id&&e.targetId===target&&e.action==='reveal'&&e.durationFrames>=Math.ceil(p.fps*.2)&&e.precision!=='unresolved'))error('production_profile_reveal','Add a cue-linked reveal lasting at least 0.2 seconds for this target; a moving background or highlight alone does not establish explanatory motion.',`${scene.id}:${target}`);
 const edit=profile.audioEdit;
 if(edit.decision==='pending')error('production_audio_edit_pending','Record episode-specific intro/outro cuts or explicitly retain the full source with a reason.');
 else {
  const source=p.inputs.find(x=>x.id===edit.sourceAudioId);
  if(source?.mediaType!=='audio')error('production_audio_source','Audio edit source must reference an original audio input.');
  if(edit.decision==='retain_full'){
   if(p.render.audioId!==edit.sourceAudioId)error('production_audio_selection','Retained narration must select the declared source audio.');
  }else{
   if(edit.endSeconds<=edit.startSeconds)error('production_audio_interval','Source end must be after source start.');
   if(edit.outputAudioId===edit.sourceAudioId||p.inputs.find(x=>x.id===edit.outputAudioId)?.mediaType!=='audio'||p.render.audioId!==edit.outputAudioId)error('production_audio_selection','A trim must select a distinct derived audio input and retain the original.');
   if(Math.abs((edit.endSeconds-edit.startSeconds)-p.durationFrames/p.fps)>1/p.fps+.000001)error('production_audio_duration','The source interval and retimed project must agree within one frame.');
  }
 }
 return issues;
}
export function assertProductionProfileReady(p:ProductionProject):void {
 const issues=productionProfileIssues(p).filter(x=>x.severity==='error');
 if(issues.length)throw new Error(`production_profile_not_ready:${issues.map(x=>x.code+(x.id?':'+x.id:'')).join(',')}`);
}
