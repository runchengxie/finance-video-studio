import {mkdir,readFile,writeFile,copyFile,constants} from 'node:fs/promises';
import path from 'node:path';
import {hash} from '../review.js';
import {snapshotProject} from './snapshot.js';
import {loadProductionReview} from './review-io.js';
import {assertProductionApproved,assertProductionBuildApproved} from './review.js';
import {assertExternal,assertOutput,actualPath,within} from './paths.js';
import {hashFile,writeJson} from './project-io.js';
import {assertAudienceReady,auditProduction} from './preflight.js';
import {verifyMedia} from './verify.js';
import {productionColors} from './encoding.js';
import {exportTimeline} from './subtitle-exports.js';
import {loadVisualAssets} from './visual-assets.js';
import {renderCovers} from './covers.js';
import {nativeBuildReportSchema} from './build-report.js';
import {compileStages} from './stages.js';

export async function packageDelivery(manifest:string,reviewFile:string,buildDirectory:string,output:string){
 const snapshot=await snapshotProject(manifest),review=await loadProductionReview(reviewFile);
 assertProductionApproved(snapshot,review);assertAudienceReady(snapshot.project);
 await assertOutput(manifest,output);await assertExternal(buildDirectory);
 const source=await actualPath(buildDirectory),destination=await actualPath(output);
 if(within(source,destination)||within(destination,source))throw new Error('delivery_build_overlap');
 const parsed=nativeBuildReportSchema.safeParse(JSON.parse(await readFile(path.join(buildDirectory,'build.json'),'utf8')));
 if(!parsed.success)throw new Error('native_build_report_required');
 const build=parsed.data;
 if(build.inputHash!==hash(snapshot))throw new Error('build_snapshot_mismatch');
 if(hash(build.stages.map(s=>s.id))!==hash(compileStages(snapshot.project).map(s=>s.id))||!build.verification.checks.some(c=>c.name==='full_decode'))throw new Error('native_build_report_incomplete');
 const video=path.join(buildDirectory,'final.mp4');if(await hashFile(video)!==build.verification.sha256)throw new Error('build_media_hash_mismatch');
 const p=snapshot.project;
 const verification=await verifyMedia(video,{width:p.width,height:p.height,fps:p.fps,frames:p.durationFrames,durationSeconds:p.durationFrames/p.fps,videoCodec:'h264',pixelFormat:'yuv420p',...productionColors,audio:{required:!!p.render.audioId||!!p.render.backgroundAudioId,...(p.render.audioId||p.render.backgroundAudioId?{codec:'aac'}:{})}});
 if(!verification.ok)throw new Error('delivery_media_verification_failed');
 await mkdir(output);const publicDir=path.join(output,'public'),internalDir=path.join(output,'internal');await mkdir(publicDir);await mkdir(internalDir);
 // Nothing is marked complete until the copied media, assets and approval are rechecked.
 await copyFile(video,path.join(publicDir,'final.mp4'),constants.COPYFILE_EXCL);
 if(await hashFile(path.join(publicDir,'final.mp4'))!==verification.sha256)throw new Error('copied_media_changed');
 await exportTimeline(p,path.join(internalDir,'timeline'));
 await copyFile(path.join(internalDir,'timeline','subtitles.srt'),path.join(publicDir,'subtitles.srt'),constants.COPYFILE_EXCL);
 const covers=await renderCovers(p,publicDir,await loadVisualAssets(manifest,p));
 await writeFile(path.join(publicDir,'title.txt'),p.title+'\n',{flag:'wx'});
 await writeJson(path.join(internalDir,'snapshot.json'),snapshot);await writeJson(path.join(internalDir,'review.json'),review);
 await writeJson(path.join(internalDir,'build.json'),build);
 await writeJson(path.join(internalDir,'verification.json'),verification);await writeJson(path.join(internalDir,'audit.json'),auditProduction(p));
 const files=await Promise.all(['final.mp4','subtitles.srt','title.txt',...covers].map(async name=>({path:`public/${name}`,sha256:await hashFile(path.join(publicDir,name))})));
 assertProductionBuildApproved(snapshot,await snapshotProject(manifest),await loadProductionReview(reviewFile));
 const receipt={complete:true,projectId:p.id,snapshotHash:hash(snapshot),files,manualListening:false,published:false};
 await writeJson(path.join(output,'delivery.json'),receipt);return receipt;
}
