import type {ProductionProject,VisualAdjustment} from './manifest.js';

const number=(value:number)=>String(Math.round(value*1000)/1000);
export function visualAdjustmentsFor(project:ProductionProject,sceneId:string):VisualAdjustment[] {
 return (project.visualAdjustments??[]).filter(value=>value.sceneId===sceneId);
}
export function visualAdjustmentCss(project:ProductionProject,sceneId:string):string {
 const changes=visualAdjustmentsFor(project,sceneId);
 if(!changes.length)return '';
 return changes.map(value=>`html[data-scene="${value.sceneId}"] [data-target="${value.targetId}"]{translate:${number(value.translateX)}px ${number(value.translateY)}px;scale:${number(value.scale)};transform-origin:center;transform-box:fill-box}`).join('');
}
