import {z} from 'zod';
import type {ProductionProject,Scene} from './manifest.js';
const id=z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/),text=z.string().trim().min(1).max(4000);
export const numericClaimSchema=z.object({id,cueId:id,sceneId:id,targetId:id,value:z.number().finite(),unit:text,period:text,scope:text,sourceIds:z.array(id).min(1).max(1000),status:z.enum(['actual','guidance','estimate']),calculation:text.optional()}).strict();
export type NumericClaim=z.infer<typeof numericClaimSchema>;
type Project=ProductionProject&{numericClaims?:NumericClaim[]};
export type NumericIssue={code:string;message:string;cueId?:string;sceneId?:string;claimId?:string;sourceIds?:string[]};
function visual(scene:Scene,target:string):{values:number[];unit:string;periods?:string[]}|undefined {
 switch(scene.template){
 case 'metric':return scene.data.id===target?{values:[scene.data.value],unit:scene.data.unit}:undefined;
 case 'comparison':case 'signed-comparison':{const p=scene.data.items.find(x=>x.id===target);return p?{values:[p.value],unit:scene.data.unit}:undefined;}
 case 'waterfall':{const p=[scene.data.start,...scene.data.steps,scene.data.end].find(x=>x.id===target);return p?{values:[p.value],unit:scene.data.unit}:undefined;}
 case 'trend':{const p=scene.data.series.find(x=>x.id===target);return p?{values:p.values.map(x=>x.value),periods:p.values.map(x=>x.label),unit:scene.data.unit}:undefined;}
 case 'process':return scene.data.items.some(x=>x.id===target)?{values:[],unit:''}:undefined;
 case 'evidence':return scene.data.id===target?{values:[],unit:''}:undefined;
 }
}
export function validateClaimLinks(project:Project):void {
 const seen=new Set<string>();for(const claim of project.numericClaims??[]){
 if(seen.has(claim.id))throw new Error(`duplicate_numeric_claim_id:${claim.id}`);seen.add(claim.id);
 const cue=project.cues.find(x=>x.id===claim.cueId),scene=project.scenes.find(x=>x.id===claim.sceneId);
 if(!cue)throw new Error(`claim_cue_reference:${claim.id}`);
 if(!scene)throw new Error(`claim_scene_reference:${claim.id}`);
 if(cue.endFrame<=scene.from||cue.startFrame>=scene.from+scene.durationFrames)throw new Error(`claim_cue_alignment:${claim.id}`);
 if(!visual(scene,claim.targetId))throw new Error(`claim_target_reference:${claim.id}`);
 for(const source of claim.sourceIds)if(!project.sources.some(x=>x.id===source)||!scene.sourceIds.includes(source))throw new Error(`claim_source_reference:${claim.id}:${source}`);
 }
}
export function auditNumericClaims(project:Project):{factualVerification:false;issues:NumericIssue[]} {
 const issues:NumericIssue[]=[];const claims=project.numericClaims??[];
 for(const cue of project.cues)if(/[0-9０-９]|[零一二三四五六七八九十百千万亿]+[万亿%％年月]/u.test(cue.text)&&!claims.some(x=>x.cueId===cue.id))issues.push({code:'numeric_cue_missing_claim',message:'Numeric narration has no evidence claim.',cueId:cue.id});
 for(const c of claims){const scene=project.scenes.find(x=>x.id===c.sceneId),cue=project.cues.find(x=>x.id===c.cueId);const base={claimId:c.id,cueId:c.cueId,sceneId:c.sceneId,sourceIds:c.sourceIds};
 if(!cue||!scene||cue.endFrame<=scene.from||cue.startFrame>=scene.from+scene.durationFrames)issues.push({...base,code:'claim_cue_alignment',message:'Claim cue does not overlap its scene.'});
 const target=scene&&visual(scene,c.targetId);
 if(!target)issues.push({...base,code:'claim_target_reference',message:'Claim target is missing.'});
 else if(target.values.length){const periodIndex=target.periods?.indexOf(c.period);if(periodIndex===-1)issues.push({...base,code:'visual_period_unresolved',message:'Claim period does not identify a trend point.'});const values=periodIndex!==undefined&&periodIndex>=0?[target.values[periodIndex]!]:target.values;if(!values.includes(c.value))issues.push({...base,code:'visual_value_mismatch',message:'Claim value differs from visual target.'});if(target.unit!==c.unit)issues.push({...base,code:'visual_unit_mismatch',message:'Claim unit differs from visual target.'});}
 if(!c.sourceIds.length||c.sourceIds.some(id=>!project.sources.some(s=>s.id===id)||!scene?.sourceIds.includes(id)))issues.push({...base,code:'claim_source_reference',message:'Claim evidence is missing or not linked to its scene.'});
 }
 return {factualVerification:false,issues};
}
