import {execFileSync} from 'node:child_process';

export class ToolUnavailableError extends Error {}
export function mediaTool(kind:'ffmpeg'|'ffprobe',args:string[],timeout=300000):{ok:boolean;stdout:string;stderr:string} {
 const executable=kind==='ffmpeg'?(process.env.FFMPEG_PATH??'ffmpeg'):(process.env.FFPROBE_PATH??'ffprobe');
 try{return {ok:true,stdout:execFileSync(executable,args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout,maxBuffer:16*1024*1024,windowsHide:true}),stderr:''};}
 catch(e){const x=e as NodeJS.ErrnoException&{stdout?:string|Buffer;stderr?:string|Buffer};if(x.code==='ENOENT'||x.code==='EACCES'||x.code==='ETIMEDOUT')throw new ToolUnavailableError(`${kind}:${x.code}`);return {ok:false,stdout:String(x.stdout??''),stderr:String(x.stderr??x.message)};}
}
export function toolVersion(kind:'ffmpeg'|'ffprobe'):string {
 const result=mediaTool(kind,['-version'],10000);if(!result.ok)throw new ToolUnavailableError(kind);return result.stdout.split(/\r?\n/)[0]??'';
}
