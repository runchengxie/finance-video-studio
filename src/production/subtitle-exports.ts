import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {type ProductionProject} from './manifest.js';
import {assertExternal} from './paths.js';
import {frameStamp,validateTimeline} from './timeline.js';

// Full-width literal controls cannot be interpreted as ASS override commands.
export function assText(text:string):string {return text.replaceAll('\\','＼').replaceAll('{','｛').replaceAll('}','｝').replace(/\r?\n/g,'\\N');}
export function metadataText(text:string):string {return text.replaceAll('\\','\\\\').replace(/([=;#])/g,'\\$1').replace(/\r?\n/g,'\\\n');}
export function assForScene(project:ProductionProject,sceneId:string):string {
 const scene=project.scenes.find(s=>s.id===sceneId);if(!scene)throw new Error('unknown_scene');
 const header='[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Noto Sans SC,44,&H00F5F5F5,&H00F5F5F5,&H00102030,&H00102030,0,0,0,0,100,100,0,0,3,1,0,2,96,96,70,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';
 return header+project.cues.filter(c=>c.endFrame>scene.from&&c.startFrame<scene.from+scene.durationFrames).map(c=>`Dialogue: 0,${frameStamp(Math.max(c.startFrame,scene.from)-scene.from,'ass')},${frameStamp(Math.min(c.endFrame,scene.from+scene.durationFrames)-scene.from,'ass')},Default,,0,0,0,,${assText(c.text)}`).join('\n')+'\n';
}
export function chaptersMetadata(project:ProductionProject):string {
 const chapters=project.scenes.filter((s,i)=>s.chapterId&&(i===0||s.chapterId!==project.scenes[i-1]!.chapterId));
 return `;FFMETADATA1\ntitle=${metadataText(project.title)}\n`+chapters.map((s,i)=>`[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(s.from/30*1000)}\nEND=${Math.round((chapters[i+1]?.from??project.durationFrames)/30*1000)}\ntitle=${metadataText(s.chapterId!)}\n`).join('');
}
export async function exportTimeline(project:ProductionProject,output:string):Promise<void> {
 validateTimeline(project);await assertExternal(output);await mkdir(path.dirname(output),{recursive:true});await mkdir(output);await mkdir(path.join(output,'scenes'));
 await writeFile(path.join(output,'subtitles.srt'),project.cues.map((c,i)=>`${i+1}\n${frameStamp(c.startFrame)} --> ${frameStamp(c.endFrame)}\n${c.text}\n`).join('\n'),{flag:'wx'});
 for(const s of project.scenes)await writeFile(path.join(output,'scenes',`${s.id}.ass`),assForScene(project,s.id),{flag:'wx'});
 await writeFile(path.join(output,'chapters.ffmeta'),chaptersMetadata(project),{flag:'wx'});
 await writeFile(path.join(output,'storyboard.md'),'# Storyboard\n\n'+project.scenes.map(s=>`- ${frameStamp(s.from)} | ${s.id} | ${s.title.replace(/[\r\n]/g,' ')}`).join('\n')+'\n',{flag:'wx'});
}
