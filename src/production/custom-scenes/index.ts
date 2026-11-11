import type {ProductionProject,Scene} from '../manifest.js';
import type {SceneState} from '../scene-state.js';
import {yieldCurve} from './yield-curve.js';

export type CustomSceneFact={target:string;values:number[];unit:string;periods?:string[]};
export type CustomSceneContext={project:ProductionProject;scene:Extract<Scene,{template:'custom'}>;frame:number;state:SceneState};
export type CustomSceneDefinition={id:string;validate(input:unknown):{targets:string[];facts?:CustomSceneFact[];draw(context:CustomSceneContext):string}};
const modules=new Map<string,CustomSceneDefinition>([[yieldCurve.id,yieldCurve]]);
export function customSceneModule(id:string):CustomSceneDefinition {
 const module=modules.get(id);if(!module)throw new Error(`unknown_custom_scene:${id}`);return module;
}
export function validateCustomScene(scene:Extract<Scene,{template:'custom'}>):{targets:string[];facts?:CustomSceneFact[];draw(context:CustomSceneContext):string} {
 const validated=customSceneModule(scene.data.moduleId).validate(scene.data.input);
 if(JSON.stringify(validated.targets)!==JSON.stringify(scene.data.targets))throw new Error(`custom_scene_targets:${scene.id}`);
 return validated;
}
export function customScenePanel(scene:Extract<Scene,{template:'custom'}>,state:SceneState,project:ProductionProject):string {
 return validateCustomScene(scene).draw({project,scene,frame:state.frame,state});
}
export function customSceneFacts(scene:Extract<Scene,{template:'custom'}>):CustomSceneFact[] {
 return validateCustomScene(scene).facts??[];
}
