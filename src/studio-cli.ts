import {initializeProject,importAsset,loadWorkspace,readProject,readJson,writeJson} from './production/project-io.js';
import {doctor} from './production/doctor.js';
import {exportTimeline} from './production/subtitle-exports.js';
import {assertOutput} from './production/paths.js';
import {verifyMedia,mediaExpectationsSchema} from './production/verify.js';
import {ToolUnavailableError} from './production/media.js';
import path from 'node:path';

const [command,...args]=process.argv.slice(2);
function required(i:number):string {if(!args[i])throw new Error('invalid_arguments');return args[i]!;}
try{
 switch(command){
  case 'init':if(args.length!==1)throw new Error('invalid_arguments');await initializeProject(required(0));break;
  case 'import':if(args.length!==3)throw new Error('invalid_arguments');console.log(JSON.stringify({revision:await importAsset(required(0),required(1),required(2))}));break;
  case 'timeline':if(args.length!==2)throw new Error('invalid_arguments');await assertOutput(required(0),required(1));await exportTimeline(await readProject(required(0)),required(1));break;
  case 'verify':{
   if(args.length!==3)throw new Error('invalid_arguments');
   if(args.some(p=>!path.isAbsolute(p)))throw new Error('absolute_paths_required');
   const report=await verifyMedia(required(0),mediaExpectationsSchema.parse(await readJson(required(1))));await writeJson(required(2),report);console.log(JSON.stringify({ok:report.ok,report:required(2)}));if(!report.ok)process.exitCode=4;break;
  }
  case 'doctor':{
   if(args.length!==1&&!(args.length===3&&args[1]==='--workspace'))throw new Error('invalid_arguments');
   const roots=await loadWorkspace(args[2]),report=await doctor(required(0));console.log(JSON.stringify({...report,roots},null,2));
   if(!report.ok)process.exitCode=report.diagnostics.some(d=>d.code==='tool_unavailable')?3:2;break;
  }
  default:throw new Error('invalid_arguments: commands init, import, doctor, timeline');
 }
}catch(e){console.error(JSON.stringify({code:e instanceof ToolUnavailableError?'tool_unavailable':'invalid_project_or_arguments',message:(e as Error).message}));process.exitCode=e instanceof ToolUnavailableError?3:2;}
