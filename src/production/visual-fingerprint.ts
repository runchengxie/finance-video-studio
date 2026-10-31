import type {ProductionProject} from './manifest.js';
import type {Stage} from './stages.js';

// The complete snapshot authorizes the build. This narrower fingerprint only controls visual reuse.
export function visualStageFingerprint(p:ProductionProject,stage:Stage,rendererRevision:string){
 const scene=p.scenes.find(s=>s.id===stage.sceneId)!;
 const sourceIds=new Set([...scene.sourceIds,...(scene.template==='evidence'?[scene.data.sourceId]:[])]);
 const imageIds=new Set(scene.presentation?.evidencePanels?.map(x=>x.inputId)??[]);
 const background=p.render.broadcast?.backgroundVideoId;if(background)imageIds.add(background);
 const eventCueIds=new Set(p.events.filter(e=>e.sceneId===scene.id).map(e=>e.cueId));
 return {rendererRevision,stage,profile:{width:p.width,height:p.height,fps:p.fps},identity:{id:p.id,title:p.title,fictional:p.fictional,language:p.contentLanguage,index:p.scenes.indexOf(scene),count:p.scenes.length,durationFrames:p.durationFrames},scene,
 cues:p.cues.filter(c=>eventCueIds.has(c.id)||(c.startFrame<scene.from+scene.durationFrames&&c.endFrame>scene.from)),events:p.events.filter(e=>e.sceneId===scene.id),sources:p.sources.filter(s=>sourceIds.has(s.id)),assets:p.inputs.filter(x=>imageIds.has(x.id)).map(x=>({id:x.id,sha256:x.sha256})),settings:{theme:p.render.theme,visual:p.render.visual,broadcast:p.render.broadcast,crf:p.render.crf}};
}
