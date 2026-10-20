import {mkdir,copyFile,constants,realpath} from 'node:fs/promises';
import path from 'node:path';
import {assertExternal,actualPath,within} from './paths.js';
import {parseProject,targetIds} from './manifest.js';
import {hashFile,writeJson} from './project-io.js';
import {snapshotProject} from './snapshot.js';
import {createProductionReview} from './review.js';
import {saveProductionReview} from './review-io.js';
import {adaptFixedSample} from './adapters/fixed-sample.js';
import {adaptFullTimeline} from './adapters/full-timeline.js';
import {adaptExternalAudio} from './adapters/external-audio.js';
import {withLegacySnapshot} from './adapters/io.js';
export type AdaptationReport={status:'pending_review';readyForEditorialApproval:boolean;kind:string;sourceDirectory:string;projectPath:string;pendingReviewPath:string;inputs:{source:string;destination:string;sourceSha256:string;copiedSha256:string}[];mappings:{sourceId:string;targetId:string;note:string}[];unsupportedFeatures:string[];differences:string[]};
export async function adaptHistorical(kind:'fixed-sample'|'full-timeline'|'external-audio',sourceDirectory:string,destination:string):Promise<AdaptationReport>{
 await assertExternal(sourceDirectory);await assertExternal(destination);const source=await realpath(sourceDirectory),target=await actualPath(destination);if(within(source,target)||within(target,source))throw new Error('adaptation_source_output_overlap');
 const adapter={'fixed-sample':adaptFixedSample,'full-timeline':adaptFullTimeline,'external-audio':adaptExternalAudio}[kind];if(!adapter)throw new Error('unknown_historical_format');const loaded=await withLegacySnapshot(()=>adapter(sourceDirectory)),content=loaded.value;
 if(content.unsupportedFeatures.length){
  const cue=content.project.cues[0];if(!cue)throw new Error('blocked_adaptation_requires_reference_cue');
  const blocked=content.project.scenes.filter(s=>content.mappings.some(m=>m.targetId===s.id&&m.note.includes('NOT mapped')));
  // Unresolved markers make blocked readiness actionable in doctor and prevent rendering.
  for(const [i,scene] of (blocked.length?blocked:[content.project.scenes[0]!]).entries())content.project.events.push({id:`unmapped-${i}`,sceneId:scene.id,cueId:cue.id,targetId:targetIds(scene)[0]!,action:'annotate',offsetFrames:scene.from-cue.startFrame,durationFrames:1,precision:'unresolved'});
 }
 parseProject(content.project);const originals=await Promise.all(content.selected.map(async input=>{const sha256=await hashFile(input.source),parsedHash=loaded.hashes.get(input.source);if(input.mediaType==='data'&&(!parsedHash||parsedHash!==sha256))throw new Error('legacy_parsed_bytes_hash_mismatch');if(input.expectedHash&&sha256!==input.expectedHash)throw new Error('legacy_input_hash_mismatch');return {...input,sha256};}));
 await mkdir(destination);await mkdir(path.join(destination,'inputs'));await mkdir(path.join(destination,'reviews'));
 const report:AdaptationReport={status:'pending_review',readyForEditorialApproval:content.unsupportedFeatures.length===0,kind,sourceDirectory,projectPath:path.join(destination,'project.json'),pendingReviewPath:path.join(destination,'reviews','pending.json'),inputs:[],mappings:content.mappings,unsupportedFeatures:content.unsupportedFeatures,differences:content.differences};
 for(const [i,input] of originals.entries()){
  const relative=`inputs/${input.name}`;await copyFile(input.source,path.join(destination,relative),constants.COPYFILE_EXCL);const copied=await hashFile(path.join(destination,relative));if(copied!==input.sha256||await hashFile(input.source)!==input.sha256)throw new Error('adaptation_copy_hash_mismatch');
  const id=input.mediaType==='audio'&&input.name.startsWith('narration')?'narration':`input-${i}`;
  content.project.inputs.push({id,path:relative,mediaType:input.mediaType,sha256:copied,provenance:`Copied from explicit historical ${kind} project; source/copy hashes in adaptation.json`,rights:'Inherited provenance only; usage rights require operator review'});
  if(id==='narration')content.project.render.audioId=id;
  report.inputs.push({source:input.source,destination:relative,sourceSha256:input.sha256,copiedSha256:copied});
 }
 await writeJson(report.projectPath,parseProject(content.project));await saveProductionReview(report.pendingReviewPath,createProductionReview(await snapshotProject(report.projectPath)));await writeJson(path.join(destination,'adaptation.json'),report);return report;
}
