import {initializeProject,importAsset,loadWorkspace} from './production/project-io.js';
import {doctor} from './production/doctor.js';

const [command,...args]=process.argv.slice(2);
function required(i:number):string {if(!args[i])throw new Error('invalid_arguments');return args[i]!;}
try{
 switch(command){
  case 'init':if(args.length!==1)throw new Error('invalid_arguments');await initializeProject(required(0));break;
  case 'import':if(args.length!==3)throw new Error('invalid_arguments');console.log(JSON.stringify({revision:await importAsset(required(0),required(1),required(2))}));break;
  case 'doctor':{
   if(args.length!==1&&!(args.length===3&&args[1]==='--workspace'))throw new Error('invalid_arguments');
   const roots=await loadWorkspace(args[2]),report=await doctor(required(0));console.log(JSON.stringify({...report,roots},null,2));
   if(!report.ok)process.exitCode=report.diagnostics.some(d=>d.code==='tool_unavailable')?3:2;break;
  }
  default:throw new Error('invalid_arguments: commands init, import, doctor');
 }
}catch(e){console.error(JSON.stringify({code:'invalid_project_or_arguments',message:(e as Error).message}));process.exitCode=2;}
