import {readFile,writeFile,mkdir,copyFile,stat} from 'node:fs/promises';
import {constants,createReadStream} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import {parseProject,idSchema,type ProductionProject} from './manifest.js';
import {assertExternal,assertOutput} from './paths.js';

export async function hashFile(file:string):Promise<string> {
 const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex');
}
export async function readJson(file:string):Promise<unknown> {
 if((await stat(file)).size>16*1024*1024)throw new Error('json_size_limit');
 return JSON.parse((await readFile(file,'utf8')).replace(/^\uFEFF/,''));
}
export async function readProject(file:string):Promise<ProductionProject> {
 await assertExternal(file);return parseProject(await readJson(file));
}
export async function writeJson(file:string,value:unknown):Promise<void> {
 await assertExternal(file);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
}
export async function initializeProject(directory:string):Promise<void> {
 await assertExternal(directory);await mkdir(path.dirname(directory),{recursive:true});await mkdir(directory);
 for(const name of ['inputs','reviews','builds'])await mkdir(path.join(directory,name));
 const id='project-'+randomUUID().slice(0,8);
 const project:ProductionProject={schemaVersion:2,id,title:'Pending draft',contentLanguage:'en',fictional:false,fps:30,width:1920,height:1080,durationFrames:90,inputs:[],sources:[],
  manuscript:[{id:'draft',text:'Replace this draft and obtain editorial approval.',sourceIds:[]}],scenes:[{id:'draft',from:0,durationFrames:90,title:'Pending draft',template:'metric',sourceIds:[],data:{id:'value',label:'Pending value',value:0,unit:'Specify unit'}}],cues:[],events:[],render:{theme:'studio-v1',crf:20,audioId:null,normalization:null}};
 await writeJson(path.join(directory,'project.json'),project);
 await writeFile(path.join(directory,'README.md'),'# Pending production project\n\nImport licensed inputs, replace the draft, run doctor, and obtain current human review before rendering.\n',{flag:'wx'});
}
export async function importAsset(manifestFile:string,source:string,inputId:string):Promise<string> {
 const p=await readProject(manifestFile);idSchema.parse(inputId);
 if(!path.isAbsolute(source)||!(await stat(source)).isFile())throw new Error('absolute_source_file_required');
 if(p.inputs.some(x=>x.id===inputId))throw new Error('input_id_exists');
 const root=path.dirname(manifestFile),operationId=randomUUID(),operation=path.join(root,'imports',operationId);
 await assertOutput(manifestFile,operation);await mkdir(operation,{recursive:true});
 await writeJson(path.join(operation,'started.json'),{operationId,inputId,source,status:'started',startedAt:new Date().toISOString()});
 const digest=await hashFile(source),ext=path.extname(source).toLowerCase();
 const relative=`inputs/${inputId}-${operationId}${/^[.][a-z0-9]{1,8}$/.test(ext)?ext:'.bin'}`;
 const destination=path.join(root,relative);await assertOutput(manifestFile,operation);
 // resolve the target's existing ancestor as well; an inputs junction cannot redirect the copy.
 const {actualPath,within}=await import('./paths.js');
 if(!within(await actualPath(root),await actualPath(destination)))throw new Error('input_root_escape');
 await copyFile(source,destination,constants.COPYFILE_EXCL);
 const copied=await hashFile(destination);if(copied!==digest)throw new Error('input_changed_during_copy');
 const mediaType=/\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(ext)?'audio':/\.(json|csv)$/i.test(ext)?'data':/\.(png|jpe?g)$/i.test(ext)?'image':/\.(mp4|mov|webm)$/i.test(ext)?'video':'evidence';
 const next=parseProject({...p,reviewPath:undefined,inputs:[...p.inputs,{id:inputId,path:relative,mediaType,sha256:copied,provenance:`Imported from ${source}`,rights:'Operator-imported; confirm usage rights during editorial review'}]});
 const revision=path.join(root,`project-${operationId}.json`);await writeJson(revision,next);
 await writeJson(path.join(operation,'completed.json'),{operationId,inputId,source,destination:relative,sha256:copied,revision:path.basename(revision),status:'completed'});
 return revision;
}
export type WorkspaceRoots={codeRoot?:string;dataRoot?:string;configRoot?:string};
export async function loadWorkspace(file?:string,env:NodeJS.ProcessEnv=process.env):Promise<WorkspaceRoots> {
 const roots:WorkspaceRoots={};
 if(file){
  if(!path.isAbsolute(file))throw new Error('absolute_workspace_file_required');
  const content=await readFile(file,'utf8');
  for(const [key,field] of [['code_root','codeRoot'],['data_root','dataRoot'],['config_root','configRoot']] as const){
   const match=content.match(new RegExp(`^\\s*${key}\\s*=\\s*(["'])(.*?)\\1\\s*(?:#.*)?$`,'m'));
   if(!match)throw new Error(`workspace_missing:${key}`);roots[field]=match[2];
  }
 }
 for(const [key,field] of [['CODE_ROOT','codeRoot'],['DATA_ROOT','dataRoot'],['CONFIG_ROOT','configRoot']] as const)if(env[key])roots[field]=env[key];
 for(const value of Object.values(roots))if(value&&!path.isAbsolute(value)&&!path.win32.isAbsolute(value))throw new Error('workspace_root_not_absolute');
 return roots;
}
