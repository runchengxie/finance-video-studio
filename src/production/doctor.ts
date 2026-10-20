import {execFileSync} from 'node:child_process';
import {access} from 'node:fs/promises';
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import {snapshotProject} from './snapshot.js';

export type Diagnostic={code:string;severity:'error'|'warning';message:string;id?:string};
export type DoctorReport={ok:boolean;diagnostics:Diagnostic[];tools:Record<string,string>};
export async function doctor(manifestFile:string):Promise<DoctorReport> {
 const diagnostics:Diagnostic[]=[],tools:Record<string,string>={};
 try{const snapshot=await snapshotProject(manifestFile);for(const e of snapshot.project.events)if(e.precision==='unresolved')diagnostics.push({code:'unresolved_event',severity:'error',message:'Align this cue event before production',id:e.id});if(!snapshot.project.render.audioId)diagnostics.push({code:'silent_project',severity:'warning',message:'No narration audio selected'});diagnostics.push({code:'review_required',severity:'warning',message:'Doctor does not evaluate or grant editorial approval'});}
 catch(e){const message=String((e as Error).message);diagnostics.push({code:message.split(':')[0]??'invalid_project',severity:'error',message});}
 for(const [key,exe] of [['ffmpeg',process.env.FFMPEG_PATH??'ffmpeg'],['ffprobe',process.env.FFPROBE_PATH??'ffprobe']] as const){try{tools[key]=execFileSync(exe,['-version'],{encoding:'utf8',timeout:10000,maxBuffer:1024*1024,windowsHide:true}).split(/\r?\n/)[0]??'';}catch{diagnostics.push({code:'tool_unavailable',severity:'error',message:`Install or configure ${key}`,id:key});}}
 for(const [id,file] of [['browser',chromium.executablePath()],['font',fileURLToPath(new URL('../../node_modules/@fontsource/noto-sans-sc/400.css',import.meta.url))]] as const){try{await access(file);tools[id]=file;}catch{diagnostics.push({code:'tool_unavailable',severity:'error',message:`Pinned ${id} unavailable`,id});}}
 return {ok:!diagnostics.some(d=>d.severity==='error'),diagnostics,tools};
}
