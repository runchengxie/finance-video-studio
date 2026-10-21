import {loadVisualAssets} from './visual-assets.js';
import {encodeStage,inspectBackground,productionColors} from './encoding.js';
import {resolveInput} from './paths.js';
import {mkdir,writeFile,link,unlink,open,copyFile,constants} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {hash} from '../review.js';
import {assertOutput,actualPath,within} from './paths.js';
import {snapshotProject} from './snapshot.js';
import {loadProductionReview} from './review-io.js';
import {assertProductionApproved,assertProductionBuildApproved} from './review.js';
import {compileStages} from './stages.js';
import {cacheKey,readCache,publishCache} from './cache.js';
import {capturePage,paint} from './capture.js';
import {mediaTool,toolVersion} from './media.js';
import {mediaExpectationsSchema,verifyMedia,type VerificationReport} from './verify.js';
import {assemble} from './assemble.js';
import {exportTimeline} from './subtitle-exports.js';
import {writeJson} from './project-io.js';
import {hashFile} from './project-io.js';
import {productionDemoFixture,type DemoVariant} from './demo.js';
import type {EditorialSnapshot} from './snapshot.js';
import {generateVoice} from './voice.js';
export type BuildReport={ok:boolean;inputHash:string;tools:Record<string,string>;stages:{id:string;hit:boolean;reason:string;milliseconds:number}[];milliseconds:number;verification:VerificationReport|null;failure:string|null};
export async function renderProduction(manifestFile:string,reviewFile:string,output:string,cache:string):Promise<BuildReport>{
 const snapshot=await snapshotProject(manifestFile),review=await loadProductionReview(reviewFile);assertProductionApproved(snapshot,review);
 return renderBuild(manifestFile,snapshot,output,cache,async()=>{assertProductionBuildApproved(snapshot,await snapshotProject(manifestFile),await loadProductionReview(reviewFile));});
}
export async function renderProductionDemo(output:string,variant:DemoVariant):Promise<void>{
 const project=await productionDemoFixture(variant);
 // This closed entry accepts neither a project nor an audio path. Fictional flags grant no capability.
 const {assertExternal}=await import('./paths.js');await assertExternal(output);await mkdir(output);await mkdir(path.join(output,'inputs'));
 const audio=path.join(output,'inputs','tone.wav');const tone=mediaTool('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=36','-af','volume=0.02','-c:a','pcm_s16le',audio]);if(!tone.ok)throw new Error('demo_tone_failed');
 project.inputs=[{id:'tone',path:'inputs/tone.wav',mediaType:'audio',sha256:await hashFile(audio),provenance:'Pinned 440 Hz / 48 kHz / 36 second / volume 0.02 FFmpeg recipe',rights:'Original generated signal'}];project.render.audioId='tone';
 const manifest=path.join(output,'project.json');await writeJson(manifest,project);const snapshot=await snapshotProject(manifest);
 const authorize=async()=>{await productionDemoFixture(variant);if(hash(snapshot)!==hash(await snapshotProject(manifest)))throw new Error('fixed_demo_modified');};
 await renderBuild(manifest,snapshot,path.join(output,'build'),path.join(output,'cache'),authorize,variant);
 await renderBuild(manifest,snapshot,path.join(output,'warm-build'),path.join(output,'cache'),authorize,variant);
}
export async function renderVoicedProductionDemo(output:string,voice:string,executeLocal:boolean):Promise<void>{
 if(executeLocal!==true)throw new Error('explicit_local_execution_required');
 const p=await productionDemoFixture('improved');const {assertExternal}=await import('./paths.js');await assertExternal(output);await mkdir(output);
 const draft=path.join(output,'voice-source.json');await writeJson(draft,p);
 const proposal=await generateVoice(draft,{voice,output:path.join(output,'voice'),executeLocal});
 const probe=mediaTool('ffprobe',['-v','error','-show_entries','format=duration','-of','json',proposal.audio.file]);if(!probe.ok)throw new Error('voice_demo_probe_failed');
 const seconds=Number((JSON.parse(probe.stdout) as {format:{duration:string}}).format.duration);if(seconds>36)throw new Error(`fixed_voice_exceeds_36_seconds:${seconds}`);
 await mkdir(path.join(output,'inputs'));await copyFile(proposal.audio.file,path.join(output,'inputs','narration.wav'),constants.COPYFILE_EXCL);
 p.inputs=[{id:'voice',path:'inputs/narration.wav',mediaType:'audio',sha256:proposal.audio.sha256,provenance:`Explicit local SAPI ${voice}. Synthetic fixture. Measured ${seconds} seconds; padded to 36. Sentence proposal retained separately.`,rights:'Original synthetic narration'}];p.render.audioId='voice';
 const manifest=path.join(output,'project.json');await writeJson(manifest,p);const snapshot=await snapshotProject(manifest);
 const authorize=async()=>{await productionDemoFixture('improved');if(hash(snapshot)!==hash(await snapshotProject(manifest)))throw new Error('fixed_voice_demo_modified');};
 for(const variant of ['improved','legacy-comparison'] as const)await renderBuild(manifest,snapshot,path.join(output,variant),path.join(output,'cache'),authorize,variant);
 await writeJson(path.join(output,'voice-comparison.json'),{synthetic:true,manualListening:false,voice,sourceAudioHash:proposal.audio.sha256,sourceSeconds:seconds,durationSeconds:36,timing:'Fixed cue schedule retained for visual comparison; synthesized speech is not word-aligned or human-audited.'});
}
async function renderBuild(manifestFile:string,snapshot:EditorialSnapshot,output:string,cache:string,authorize:()=>Promise<void>,variant:DemoVariant='improved'):Promise<BuildReport>{
 await authorize();
 await assertOutput(manifestFile,output);await assertOutput(manifestFile,cache);
 const a=await actualPath(output),b=await actualPath(cache);if(within(a,b)||within(b,a))throw new Error('cache_output_overlap');
 const project=snapshot.project,start=performance.now(),tools:Record<string,string>={ffmpeg:toolVersion('ffmpeg'),ffprobe:toolVersion('ffprobe')};
 await mkdir(output);await mkdir(cache,{recursive:true});
 const report:BuildReport={ok:false,inputHash:hash(snapshot),tools,stages:[],milliseconds:0,verification:null,failure:null};
 const lock=await open(path.join(cache,'.render-lock'),'wx');await lock.close();
 let session:Awaited<ReturnType<typeof capturePage>>|undefined;
 try{
  session=await capturePage();tools.browser=session.page.context().browser()!.version();tools.font=hash(session.font);
  const visualAssets=await loadVisualAssets(manifestFile,project);
  const backgroundId=project.render.broadcast?.backgroundVideoId;
  const background=backgroundId?await inspectBackground(await resolveInput(manifestFile,project.inputs.find(x=>x.id===backgroundId)!.path)):undefined;
  const segments:string[]=[];
  for(const stage of compileStages(project)){
   const expected=mediaExpectationsSchema.parse({width:1920,height:1080,fps:30,frames:stage.to-stage.from,durationSeconds:(stage.to-stage.from)/30,videoCodec:'h264',pixelFormat:'yuv420p',...productionColors,audio:{required:false}});
   const began=performance.now(),key=cacheKey({stage,snapshot:hash(snapshot),tools,settings:{...project.render,variant}}),cached=await readCache(cache,key,expected);
   if(cached.hit)segments.push(cached.file);
   else{
    const temp=path.join(cache,`${key}-${randomUUID()}.partial.mp4`),framesDir=path.join(output,stage.id);await mkdir(framesDir);
    for(let f=stage.from;f<(stage.kind==='hold'?stage.from+1:stage.to);f++){await paint(session.page,session.font,project,stage.sceneId,f,variant,visualAssets);await session.page.screenshot({omitBackground:project.render.theme==='broadcast-v1',path:path.join(framesDir,`${String(f-stage.from).padStart(6,'0')}.png`)});}
    encodeStage(stage,framesDir,temp,project.render.crf,background);
    segments.push(await publishCache(cache,key,temp,expected));
   }
   report.stages.push({id:stage.id,hit:cached.hit,reason:cached.reason,milliseconds:performance.now()-began});
  }
  // Reload both the complete review and actual asset bytes immediately before assembly.
  await authorize();
  if(hash(snapshot)!==hash(await snapshotProject(manifestFile)))throw new Error('inputs_changed_during_render');
  await exportTimeline(project,path.join(output,'timeline'));
  const video=await assemble(project,manifestFile,segments,output),chapters=project.scenes.filter((s,i)=>s.chapterId&&s.chapterId!==project.scenes[i-1]?.chapterId).map((s,i,all)=>({title:s.chapterId!,startFrame:s.from,endFrame:all[i+1]?.from??project.durationFrames}));
  report.verification=await verifyMedia(video,mediaExpectationsSchema.parse({width:1920,height:1080,fps:30,frames:project.durationFrames,durationSeconds:project.durationFrames/30,videoCodec:'h264',pixelFormat:'yuv420p',...productionColors,audio:{required:!!project.render.audioId||!!project.render.backgroundAudioId,...(project.render.audioId||project.render.backgroundAudioId?{codec:'aac'}:{})},chapters}));
  if(!report.verification.ok)throw new Error('assembled_media_failed_verification');
  // The published deliverable appears only after validation; video.mp4 remains a verified intermediate until this point.
  await authorize();await link(video,path.join(output,'final.mp4'));await unlink(video);report.verification.file=path.join(output,'final.mp4');report.ok=true;return report;
 }catch(e){report.failure=(e as Error).message;throw e;}
 finally{report.milliseconds=performance.now()-start;await session?.close();await unlink(path.join(cache,'.render-lock'));await writeJson(path.join(output,'build.json'),report);await writeFile(path.join(output,'README.txt'),'Inspect final.mp4 and build.json. Automated decode is not human listening.\n',{flag:'wx'});}
}



export async function renderBroadcastDemo(output:string):Promise<void>{
 const {broadcastDemoFixture}=await import('./demo.js');const project=await broadcastDemoFixture();
 const {assertExternal}=await import('./paths.js');await assertExternal(output);await mkdir(output);await mkdir(path.join(output,'inputs'));
 const pageFile=path.join(output,'inputs/page.png'),bgFile=path.join(output,'inputs/backdrop.mp4');
 const session=await capturePage();
 try{
  await session.page.setViewportSize({width:600,height:600});
  await session.page.setContent(`<style>${session.font}body{margin:0;padding:50px;background:#f8f8f3;color:#18232c;font:32px "Noto Sans SC"}h1{font-size:40px}p{border-top:2px solid #aaa;padding-top:25px}</style><h1>FICTIONAL DOCUMENT</h1><p>Sample A · 1.00%</p><p>Sample B · 0.25%</p><p>Generated example<br>2026-01-01</p>`);
  await session.page.evaluate(()=>document.fonts.ready);await session.page.screenshot({path:pageFile});
 }finally{await session.close();}
 const bg=mediaTool('ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=s=1920x1080:r=30:d=2','-c:v','libx264','-preset','veryfast','-crf','25','-pix_fmt','yuv420p',bgFile]);if(!bg.ok)throw new Error('synthetic_background_failed');
 for(const input of project.inputs)input.sha256=await hashFile(path.join(output,input.path));
 const manifest=path.join(output,'project.json');await writeJson(manifest,project);const snapshot=await snapshotProject(manifest);
 const authorize=async()=>{await broadcastDemoFixture();if(hash(snapshot)!==hash(await snapshotProject(manifest)))throw new Error('fixed_demo_modified');};
 for(const name of ['build','warm-build'])await renderBuild(manifest,snapshot,path.join(output,name),path.join(output,'cache'),authorize);
}
