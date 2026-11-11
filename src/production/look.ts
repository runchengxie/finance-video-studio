import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {capturePage,paint} from './capture.js';
import {snapshotProject} from './snapshot.js';
import {loadVisualAssets} from './visual-assets.js';
import {assertOutput} from './paths.js';
import {writeJson} from './project-io.js';
import {hash} from '../review.js';
import type {Scene} from './manifest.js';

export type LookIssue={sceneId:string;frame:number;code:string;message:string};
export type LookFrame={sceneId:string;frame:number;file:string;sha256:string};
export type LookMismatch={sceneId:string;frame:number;expected:string;actual:string};
export type LookReport={schemaVersion:1;projectId:string;inputHash:string;templateRevision:string;encodedMp4:false;approvalGranted:false;backgroundVideoExcluded:boolean;deterministic:boolean;frames:LookFrame[];mismatches:LookMismatch[];issues:LookIssue[];contactSheet:string|null;notice:string};
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const escape=(value:string)=>value.replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));
function sampleFrames(scene:Scene):number[] {
 const last=scene.from+scene.durationFrames-1;
 return [...new Set([scene.from,scene.from+Math.floor(scene.durationFrames/2),last])].sort((a,b)=>a-b);
}
function label(scene:Scene,frame:number,projectFps:number):string {
 const second=frame/projectFps;
 return `${scene.id} · frame ${frame} · ${Math.floor(second/60)}:${String(Math.floor(second%60)).padStart(2,'0')}`;
}
async function sheet(images:{label:string;data:string}[],output:string,page:Awaited<ReturnType<typeof capturePage>>['page'],projectTitle:string):Promise<void> {
 const cells=images.map(image=>`<figure><img src="${image.data}" alt="${escape(image.label)}"><figcaption>${escape(image.label)}</figcaption></figure>`).join('');
 await page.setViewportSize({width:1200,height:800});
 await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:24px;background:#f8f5ef;color:#25282b;font:14px/1.5 system-ui}h1{font-size:20px;margin:0 0 16px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}figure{margin:0;background:#fff;padding:8px;border:1px solid #ddd}img{display:block;width:100%;height:auto}figcaption{font:12px/1.4 ui-monospace,monospace;margin-top:6px;overflow-wrap:anywhere}</style></head><body><h1>${escape(projectTitle)} · key frames</h1><div class="grid">${cells}</div></body></html>`);
 await page.evaluate(async()=>{await Promise.all(Array.from(document.images).map(image=>image.decode()));});
 await page.screenshot({path:output,fullPage:true,animations:'disabled'});
}
export async function createLook(manifestFile:string,output:string):Promise<LookReport> {
 await assertOutput(manifestFile,output);
 const snapshot=await snapshotProject(manifestFile),project=snapshot.project,visualAssets=await loadVisualAssets(manifestFile,project);
 await mkdir(output);await mkdir(path.join(output,'frames'));
 const framesDir=path.join(output,'frames'),frames:LookFrame[]=[],issues:LookIssue[]=[],images:{label:string;data:string}[]=[];
 const first=await capturePage();
 try{
  for(const scene of project.scenes){
   for(const frame of sampleFrames(scene)){
    try{await paint(first.page,first.font,project,scene.id,frame,'improved',visualAssets);}
    catch(error){
     const message=(error as Error).message;issues.push({sceneId:scene.id,frame,code:message.split(':')[0]??'render_error',message});
     if(!message.startsWith('layout_check:'))continue;
    }
    const file=path.join(framesDir,`${scene.id}-${String(frame).padStart(6,'0')}.png`),bytes=await first.page.screenshot({animations:'disabled'});
    await writeFile(file,bytes,{flag:'wx'});
    frames.push({sceneId:scene.id,frame,file,sha256:sha(bytes)});
    images.push({label:label(scene,frame,project.fps),data:`data:image/png;base64,${bytes.toString('base64')}`});
   }
  }
 }finally{await first.close();}
 const expected=new Map(frames.map(frame=>[`${frame.sceneId}/${frame.frame}`,frame.sha256])),mismatches:LookMismatch[]=[];
 const second=await capturePage();
 try{
  for(const frame of [...frames].reverse()){
   let bytes:Buffer;
   try{await paint(second.page,second.font,project,frame.sceneId,frame.frame,'improved',visualAssets);bytes=await second.page.screenshot({animations:'disabled'});}
   catch(error){issues.push({sceneId:frame.sceneId,frame:frame.frame,code:'determinism_render_error',message:(error as Error).message});continue;}
   const actual=sha(bytes),target=expected.get(`${frame.sceneId}/${frame.frame}`)!;
   if(actual!==target)mismatches.push({sceneId:frame.sceneId,frame:frame.frame,expected:target,actual});
  }
  if(images.length)await sheet(images,path.join(output,'sheet.png'),second.page,project.title);
 }finally{await second.close();}
 const report:LookReport={schemaVersion:1,projectId:project.id,inputHash:hash(snapshot),templateRevision:snapshot.templateRevision,encodedMp4:false,approvalGranted:false,backgroundVideoExcluded:!!project.render.broadcast?.backgroundVideoId,deterministic:frames.length>0&&mismatches.length===0,frames,mismatches,issues,contactSheet:images.length?path.join(output,'sheet.png'):null,notice:'Key-frame inspection only. Background video is not composited here. Layout issues and nondeterminism are reported, not repaired. This does not grant factual verification, human listening, approval or a native build.'};
 await writeJson(path.join(output,'look.json'),report);return report;
}
