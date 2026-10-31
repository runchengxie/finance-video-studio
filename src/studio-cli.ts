import {initializeProject,importAsset,loadWorkspace,readProject,readJson,writeJson} from './production/project-io.js';
import {doctor} from './production/doctor.js';
import {exportTimeline} from './production/subtitle-exports.js';
import {assertOutput} from './production/paths.js';
import {verifyMedia,mediaExpectationsSchema} from './production/verify.js';
import {ToolUnavailableError} from './production/media.js';
import path from 'node:path';
import {snapshotProject} from './production/snapshot.js';
import {createProductionReview,importProductionPolish,approveProductionReview,productionReviewStatus,type ProductionApprovalOptions} from './production/review.js';
import {loadProductionReview,saveProductionReview} from './production/review-io.js';
import {renderProduction,renderVoicedProductionDemo,renderBroadcastDemo} from './production/render.js';
import {generateVoice,localVoices} from './production/voice.js';
import {adaptHistorical} from './production/adapt.js';
import {auditProduction} from './production/preflight.js';
import {packageDelivery} from './production/delivery.js';
import {createReviewPage} from './production/review-page.js';
import {compareNarrations} from './production/narration-diff.js';

const [command,...args]=process.argv.slice(2);
function required(i:number):string {if(!args[i])throw new Error('invalid_arguments');return args[i]!;}
try{
 switch(command){
  case 'review-page':if(args.length!==3)throw new Error('invalid_arguments: review-page MANIFEST BUILD NEW_OUTPUT');console.log(JSON.stringify(await createReviewPage(required(0),required(1),required(2))));break;
  case 'compare':if(args.length!==3)throw new Error('invalid_arguments: compare BEFORE_MANIFEST AFTER_MANIFEST NEW_OUTPUT');console.log(JSON.stringify(await compareNarrations(required(0),required(1),required(2))));break;
  case 'audit':if(args.length!==2)throw new Error('invalid_arguments: audit MANIFEST NEW_REPORT');await assertOutput(required(0),required(1));await writeJson(required(1),auditProduction(await readProject(required(0))));break;
  case 'deliver':if(args.length!==4)throw new Error('invalid_arguments: deliver MANIFEST REVIEW BUILD NEW_OUTPUT');console.log(JSON.stringify(await packageDelivery(required(0),required(1),required(2),required(3))));break;
  case 'broadcast-demo':if(args.length!==1)throw new Error('fixed_demo_output_only');await renderBroadcastDemo(required(0));break;
  case 'adapt':if(args.length!==3||!['fixed-sample','full-timeline','external-audio'].includes(required(0)))throw new Error('invalid_adaptation_arguments');console.log(JSON.stringify(await adaptHistorical(required(0) as 'fixed-sample'|'full-timeline'|'external-audio',required(1),required(2))));break;
  case 'voices':if(args.length)throw new Error('invalid_arguments');console.log(JSON.stringify(localVoices()));break;
  case 'voice':if(args.length!==4||args[3]!=='--execute-local')throw new Error('explicit_local_execution_required');console.log(JSON.stringify(await generateVoice(required(0),{voice:required(1),output:required(2),executeLocal:true})));break;
  case 'voice-demo':if(args.length!==3||args[2]!=='--execute-local')throw new Error('explicit_local_execution_required');await renderVoicedProductionDemo(required(0),required(1),true);break;
  case 'render':if(args.length!==4)throw new Error('invalid_arguments: render MANIFEST REVIEW NEW_OUTPUT CACHE');console.log(JSON.stringify(await renderProduction(required(0),required(1),required(2),required(3))));break;
  case 'init':if(args.length!==1)throw new Error('invalid_arguments');await initializeProject(required(0));break;
  case 'import':if(args.length!==3)throw new Error('invalid_arguments');console.log(JSON.stringify({revision:await importAsset(required(0),required(1),required(2))}));break;
  case 'timeline':if(args.length!==2)throw new Error('invalid_arguments');await assertOutput(required(0),required(1));await exportTimeline(await readProject(required(0)),required(1));break;
  case 'verify':{
   if(args.length!==3)throw new Error('invalid_arguments');
   if(args.some(p=>!path.isAbsolute(p)))throw new Error('absolute_paths_required');
   const report=await verifyMedia(required(0),mediaExpectationsSchema.parse(await readJson(required(1))));await writeJson(required(2),report);console.log(JSON.stringify({ok:report.ok,report:required(2)}));if(!report.ok)process.exitCode=4;break;
  }
  case 'review':{
   const [action,...values]=args;const at=(i:number)=>{if(!values[i])throw new Error('invalid_arguments');return values[i]!;};
   if(action==='init'&&values.length===2)await saveProductionReview(at(1),createProductionReview(await snapshotProject(at(0))));
   else if(action==='import'&&values.length===3)await saveProductionReview(at(2),importProductionPolish(await loadProductionReview(at(0)),await readJson(at(1))));
   else if(action==='approve'&&values.length===4&&values[3]==='--confirm-review')await saveProductionReview(at(2),approveProductionReview(await loadProductionReview(at(0)),await readJson(at(1)) as ProductionApprovalOptions));
   else if(action==='status'&&values.length===1)console.log(JSON.stringify({status:productionReviewStatus(await loadProductionReview(at(0)))}));
   else throw new Error('invalid_review_arguments: explicit --confirm-review required for approval');break;
  }
  case 'doctor':{
   if(args.length!==1&&!(args.length===3&&args[1]==='--workspace'))throw new Error('invalid_arguments');
   const roots=await loadWorkspace(args[2]),report=await doctor(required(0));console.log(JSON.stringify({...report,roots},null,2));
   if(!report.ok)process.exitCode=report.diagnostics.some(d=>d.code==='tool_unavailable')?3:2;break;
  }
  default:throw new Error('invalid_arguments: commands init, import, doctor, timeline');
 }
}catch(e){console.error(JSON.stringify({code:e instanceof ToolUnavailableError?'tool_unavailable':'invalid_project_or_arguments',message:(e as Error).message}));process.exitCode=e instanceof ToolUnavailableError?3:2;}
