import type {ProductionProject,Scene,Cue} from '../manifest.js';
export type SelectedInput={source:string;name:string;mediaType:'data'|'audio';expectedHash?:string};
export type AdaptedContent={project:ProductionProject;selected:SelectedInput[];mappings:{sourceId:string;targetId:string;note:string}[];unsupportedFeatures:string[];differences:string[]};
export function pendingProject(title:string,scenes:Scene[],cues:Cue[],text:{id:string;text:string;sourceIds:string[]}[],sources:ProductionProject['sources']):ProductionProject {
 return {schemaVersion:2,id:'historical-adaptation',title,contentLanguage:'zh',fictional:false,fps:30,width:1920,height:1080,durationFrames:scenes.at(-1)!.from+scenes.at(-1)!.durationFrames,inputs:[],sources,manuscript:text,scenes,cues,events:[],render:{theme:'studio-v1',crf:20,audioId:null,normalization:null}};
}
