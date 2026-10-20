import {parseProject,targetIds,type ProductionProject,type Event} from './manifest.js';
export type TargetState={visible:boolean;progress:number;action:Event['action']|null;active:boolean};
export type SceneState={sceneId:string;frame:number;targets:Record<string,TargetState>;caption:string|null};
export function sceneState(project:ProductionProject,sceneId:string,frame:number):SceneState {
 const p=parseProject(project),scene=p.scenes.find(s=>s.id===sceneId);
 if(!scene||!Number.isInteger(frame)||frame<scene.from||frame>=scene.from+scene.durationFrames)throw new Error('invalid_scene_frame');
 const targets:Record<string,TargetState>={};
 for(const id of targetIds(scene)){
  const events=p.events.filter(e=>e.sceneId===sceneId&&e.targetId===id).map(e=>({...e,start:p.cues.find(c=>c.id===e.cueId)!.startFrame+e.offsetFrames})).sort((a,b)=>a.start-b.start||a.id.localeCompare(b.id,'en'));
  let visible=!events.some(e=>e.action==='reveal'),state:TargetState={visible,progress:visible?1:0,action:null,active:false};
  for(const e of events){if(e.precision==='unresolved')throw new Error(`unresolved_event:${e.id}`);if(frame<e.start)continue;
   const progress=Math.min(1,(frame-e.start)/e.durationFrames);if(e.action==='reveal')visible=true;
   state={visible,progress,action:e.action,active:frame<e.start+e.durationFrames};
  }targets[id]=state;
 }
 return {sceneId,frame,targets,caption:p.cues.find(c=>frame>=c.startFrame&&frame<c.endFrame)?.text??null};
}
