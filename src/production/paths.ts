import path from 'node:path';
import {realpath,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {isInputPath} from './manifest.js';

export function within(root:string,target:string):boolean {
 const relative=path.relative(root,target);
 return relative===''||(!path.isAbsolute(relative)&&relative!=='..'&&!relative.startsWith(`..${path.sep}`));
}
export async function actualPath(file:string):Promise<string> {
 try{return await realpath(file);}catch(e){
  if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;
  const parent=path.dirname(file);if(parent===file)throw e;
  return path.join(await actualPath(parent),path.basename(file));
 }
}
export async function resolveInput(projectFile:string,relative:string):Promise<string> {
 if(!path.isAbsolute(projectFile)||!isInputPath(relative))throw new Error('invalid_input_path');
 const project=await realpath(path.dirname(projectFile)),root=await realpath(path.join(project,'inputs'));
 if(!within(project,root))throw new Error('input_root_escape');
 const file=await realpath(path.resolve(path.dirname(projectFile),relative));
 if(!within(root,file)||!(await stat(file)).isFile())throw new Error('input_path_escape');
 return file;
}
export async function assertExternal(file:string):Promise<string> {
 if(!path.isAbsolute(file))throw new Error('absolute_external_path_required');
 const actual=await actualPath(file),repo=await realpath(fileURLToPath(new URL('../../',import.meta.url)));
 if(within(repo,actual)||within(actual,repo))throw new Error('output_inside_repository');
 return actual;
}
export async function assertOutput(projectFile:string,output:string):Promise<void> {
 const actual=await assertExternal(output),inputs=await actualPath(path.join(path.dirname(projectFile),'inputs'));
 if(within(inputs,actual)||within(actual,inputs))throw new Error('output_overlaps_inputs');
}
