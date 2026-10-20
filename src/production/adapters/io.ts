import {realpath,readFile,stat} from 'node:fs/promises';
import {AsyncLocalStorage} from 'node:async_hooks';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {within} from '../paths.js';
const snapshots=new AsyncLocalStorage<Map<string,string>>();
export async function withLegacySnapshot<T>(work:()=>Promise<T>):Promise<{value:T;hashes:Map<string,string>}>{
 const hashes=new Map<string,string>();const value=await snapshots.run(hashes,work);return {value,hashes};
}
export async function legacyFile(root:string,relative:string):Promise<string>{
 if(!path.isAbsolute(root)||path.isAbsolute(relative)||relative.includes('\\')||relative.split('/').some(x=>x==='..'||x===''))throw new Error('invalid_legacy_path');
 const base=await realpath(root),file=await realpath(path.join(base,relative));if(!within(base,file))throw new Error('legacy_link_escape');return file;
}
export async function legacyJson(root:string,relative:string):Promise<unknown>{
 const file=await legacyFile(root,relative);if((await stat(file)).size>16*1024*1024)throw new Error('legacy_json_too_large');const bytes=await readFile(file);if(bytes.length>16*1024*1024)throw new Error('legacy_json_too_large');
 const digest=createHash('sha256').update(bytes).digest('hex');snapshots.getStore()?.set(file,digest);
 return JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));
}
