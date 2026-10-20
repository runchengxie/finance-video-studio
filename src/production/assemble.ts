import {writeFile,link,unlink} from 'node:fs/promises';
import path from 'node:path';
import {type ProductionProject} from './manifest.js';
import {mediaTool} from './media.js';
import {resolveInput} from './paths.js';
import {chaptersMetadata} from './subtitle-exports.js';
export async function assemble(project:ProductionProject,manifest:string,segments:string[],output:string):Promise<string>{
 const list=path.join(output,'segments.txt'),metadata=path.join(output,'chapters.ffmeta');
 await writeFile(list,segments.map(f=>`file '${f.replaceAll('\\','/').replaceAll("'","'\\''")}'`).join('\n'),{flag:'wx'});
 await writeFile(metadata,chaptersMetadata(project),{flag:'wx'});
 const args=['-v','error','-f','concat','-safe','0','-i',list],audioIds=[project.render.audioId,project.render.backgroundAudioId].filter((x):x is string=>!!x);
 for(const id of audioIds)args.push('-i',await resolveInput(manifest,project.inputs.find(a=>a.id===id)!.path));
 const metaIndex=1+audioIds.length;args.push('-f','ffmetadata','-i',metadata,'-map','0:v:0');
 if(audioIds.length){let filter=audioIds.length===2?'[1:a]apad[a];[2:a]volume=0.12,apad[b];[a][b]amix=inputs=2:duration=longest:normalize=0':'[1:a]apad';
  if(project.render.normalization)filter+=`,loudnorm=I=${project.render.normalization.targetLufs}:TP=${project.render.normalization.truePeak}:LRA=11`;
  args.push('-filter_complex',`${filter}[audio]`,'-map','[audio]','-c:a','aac','-b:a','192k');
 }else args.push('-an');
 args.push('-map_metadata',String(metaIndex),'-map_chapters',String(metaIndex),'-c:v','copy','-t',String(project.durationFrames/30),'-movflags','+faststart');
 const temp=path.join(output,'assembled.partial.mp4'),final=path.join(output,'video.mp4');const encoded=mediaTool('ffmpeg',[...args,temp]);if(!encoded.ok)throw new Error(`assembly_failed:${encoded.stderr.slice(-2000)}`);
 // Hard-link publication is atomic and fails if the destination already exists.
 await link(temp,final);await unlink(temp);return final;
}
