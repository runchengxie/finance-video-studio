import {z} from 'zod';
import {idSchema,parseProject,targetIds,visualAdjustmentSchema,type ProductionProject} from './manifest.js';

const digest=z.string().regex(/^[a-f0-9]{64}$/);
export const visualPatchSchema=z.object({schemaVersion:z.literal(1),projectId:idSchema,baseSnapshotHash:digest,changes:z.array(visualAdjustmentSchema).min(1).max(2000)}).strict();
export type VisualPatch=z.infer<typeof visualPatchSchema>;

const key=(value:{sceneId:string;targetId:string})=>`${value.sceneId}/${value.targetId}`;
export function applyVisualPatch(project:ProductionProject,value:unknown):ProductionProject {
 const patch=visualPatchSchema.parse(value);
 if(patch.projectId!==project.id)throw new Error('visual_patch_project_mismatch');
 const scenes=new Map(project.scenes.map(scene=>[scene.id,scene])),seen=new Set<string>();
 for(const change of patch.changes){
  const scene=scenes.get(change.sceneId);
  if(!scene||!targetIds(scene).includes(change.targetId))throw new Error(`visual_patch_target:${key(change)}`);
  if(seen.has(key(change)))throw new Error(`visual_patch_duplicate:${key(change)}`);
  seen.add(key(change));
 }
 const kept=(project.visualAdjustments??[]).filter(value=>!seen.has(key(value)));
 return parseProject({...project,reviewPath:undefined,visualAdjustments:[...kept,...patch.changes]});
}
