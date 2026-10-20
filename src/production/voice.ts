import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash} from '../review.js';
import {snapshotProject} from './snapshot.js';
import {assertOutput} from './paths.js';
import {hashFile,writeJson} from './project-io.js';
import {mediaTool,ToolUnavailableError} from './media.js';
import type {Cue} from './manifest.js';
export function voiceChunks(text:string,language:'en'|'zh'):string[]{
 const chunks:string[]=[];for(const item of new Intl.Segmenter(language,{granularity:'sentence'}).segment(text)){
  let remaining=item.segment.trim();while(remaining.length>180){let end=remaining.slice(0,181).lastIndexOf(' ');if(end<1)end=180;
   for(const token of remaining.matchAll(/[+-]?[A-Za-z0-9.][A-Za-z0-9.,%％‰'’+-]*/g))if(token.index<end&&end<token.index+token[0].length){end=token.index;break;}
   if(end<1)throw new Error('voice_token_too_long');chunks.push(remaining.slice(0,end).trim());remaining=remaining.slice(end).trim();
  }if(remaining)chunks.push(remaining);
 }return chunks;
}
export function padVoiceClip(file:string,output:string,frames:number):void {
 if(!Number.isInteger(frames)||frames<1||frames>108000)throw new Error('invalid_voice_frames');
 const encoded=mediaTool('ffmpeg',['-v','error','-i',file,'-af',`apad,atrim=duration=${frames/30}`,'-ar','48000','-c:a','pcm_s16le',output]);if(!encoded.ok)throw new ToolUnavailableError(`voice_padding_failed:${encoded.stderr}`);
}
const script=fileURLToPath(new URL('../../scripts/sapi.ps1',import.meta.url));
function sapi(args:string[]):string {
 try{return execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-File',script,...args],{encoding:'utf8',windowsHide:true,timeout:300000,maxBuffer:4*1024*1024});}catch(e){throw new ToolUnavailableError(`local_sapi_failed:${(e as Error).message}`);}
}
export function localVoices():string[]{if(process.platform!=='win32')throw new Error('windows_required');return JSON.parse(sapi(['-List']).replace(/^\uFEFF/,'')) as string[];}
export type VoiceProposal={status:'pending_review';sourceSnapshotHash:string;voice:string;synthetic:true;manualListening:false;clips:{blockId:string;text:string;file:string;alignedFile:string;sha256:string;seconds:number;frames:number}[];audio:{file:string;sha256:string};proposedCues:Cue[];notes:string};
export async function generateVoice(manifestFile:string,options:{voice:string;output:string;executeLocal:boolean}):Promise<VoiceProposal>{
 if(options.executeLocal!==true)throw new Error('explicit_local_execution_required');if(process.platform!=='win32')throw new Error('windows_required');
 if(!options.voice?.trim()||!localVoices().includes(options.voice))throw new Error('unavailable_voice');
 await assertOutput(manifestFile,options.output);const snapshot=await snapshotProject(manifestFile);
 await mkdir(options.output);const clips:{blockId:string;text:string;file:string}[]=[];
 for(const block of snapshot.project.manuscript){
  const chunks=voiceChunks(block.text,snapshot.project.contentLanguage);
  for(const chunk of chunks){const text=chunk.trim();if(!text)continue;if(text.length>400)throw new Error(`voice_sentence_too_long:${block.id}`);clips.push({blockId:block.id,text,file:path.join(options.output,`clip-${String(clips.length).padStart(4,'0')}.wav`)});}
 }
 if(!clips.length)throw new Error('empty_voice_text');const request=path.join(options.output,'sapi-request.json');await writeJson(request,{voice:options.voice,output:options.output,clips});sapi(['-Request',request]);
 const measured:VoiceProposal['clips']=[],proposedCues:Cue[]=[];let from=0;
 for(const [i,clip] of clips.entries()){
  const result=mediaTool('ffprobe',['-v','error','-show_entries','format=duration','-of','json',clip.file]);if(!result.ok)throw new ToolUnavailableError('voice_probe_failed');
  const seconds=Number((JSON.parse(result.stdout) as {format:{duration:string}}).format.duration);if(!Number.isFinite(seconds)||seconds<=0)throw new Error('invalid_voice_duration');
  const frames=Math.ceil(seconds*30),alignedFile=path.join(options.output,`aligned-${String(i).padStart(4,'0')}.wav`);padVoiceClip(clip.file,alignedFile,frames);measured.push({...clip,alignedFile,seconds,frames,sha256:await hashFile(clip.file)});
  // This is a measured proposal. It does not replace existing cues or claim word alignment.
  proposedCues.push({id:`voice-${i}`,text:clip.text,startFrame:from,endFrame:from+frames});from+=frames;
 }
 const list=path.join(options.output,'clips.txt');await writeFile(list,measured.map(c=>`file '${c.alignedFile.replaceAll('\\','/').replaceAll("'","'\\''")}'`).join('\n'),{flag:'wx'});
 const audio=path.join(options.output,'narration.wav'),encoded=mediaTool('ffmpeg',['-v','error','-f','concat','-safe','0','-i',list,'-ar','48000','-c:a','pcm_s16le',audio]);if(!encoded.ok)throw new ToolUnavailableError(`voice_concat_failed:${encoded.stderr}`);
 const proposal:VoiceProposal={status:'pending_review',sourceSnapshotHash:hash(snapshot),voice:options.voice,synthetic:true,manualListening:false,clips:measured,audio:{file:audio,sha256:await hashFile(audio)},proposedCues,notes:'Measured phrase boundaries only; each clip is padded to its proposed frame duration before concatenation. Import audio into a new project revision and review its full timeline; original inputs, cues and approval remain unchanged.'};
 await writeJson(path.join(options.output,'proposal.json'),proposal);return proposal;
}
