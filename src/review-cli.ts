import {createReview,importPolish,approve,status} from './review.js';
import {adapterConfigSchema,json,loadReview,saveReview,runLocal,loadConfig} from './review-io.js';
import {schema} from './core.js';
import path from 'node:path';
const [command,...args]=process.argv.slice(2);
const required=(index:number)=>{if(!args[index])throw new Error('Missing argument; see docs/manuscript-review.md');return args[index]!;};
switch(command){
 case 'init':{
  const config=args[2]?await loadConfig(required(2)):adapterConfigSchema.parse({});
  await saveReview(required(1),createReview(schema.parse(await json(required(0))),config.extraTerms));break;
 }
 case 'import':{
  await saveReview(required(2),importPolish(await loadReview(required(0)),await json(required(1)),'manual'));break;
 }
 case 'run':{
  const configPath=required(1);if(!path.isAbsolute(configPath))throw new Error('Use an absolute local configuration path');
  await saveReview(required(2),await runLocal(await loadReview(required(0)),await loadConfig(configPath),args[3]==='--execute-local'));break;
 }
 case 'approve':{
  if(args[3]!=='--confirm-review')throw new Error('Approval requires explicit --confirm-review after human source and wording review');
  const options=await json(required(1)) as Parameters<typeof approve>[1];
  await saveReview(required(2),approve(await loadReview(required(0)),options));break;
 }
 case 'status':console.log(status(await loadReview(required(0))));break;
 default:throw new Error('Commands: init, import, run, approve, status. See docs/manuscript-review.md');
}
