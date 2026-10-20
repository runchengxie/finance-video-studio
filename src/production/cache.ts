import {readFile,rename,rm} from 'node:fs/promises';
import path from 'node:path';
import {hash} from '../review.js';
import {hashFile,writeJson} from './project-io.js';
import {verifyMedia,mediaExpectationsSchema,type MediaExpectations} from './verify.js';
export type CacheFingerprint={stage:unknown;snapshot:string;tools:Record<string,string>;settings:unknown};
export const cacheKey=(fingerprint:CacheFingerprint):string=>hash(fingerprint);
export type CacheResult={hit:boolean;reason:string;file:string};
export async function readCache(root:string,key:string,wanted?:MediaExpectations):Promise<CacheResult>{
 if(!/^[a-f0-9]{64}$/.test(key))throw new Error('invalid_cache_key');const file=path.join(root,`${key}.mp4`);
 try{const r=JSON.parse(await readFile(path.join(root,`${key}.json`),'utf8')) as {key:string;sha256:string;expected:MediaExpectations};
  if(r.key!==key||r.sha256!==await hashFile(file))return {hit:false,reason:'hash_mismatch',file};
  const expected=mediaExpectationsSchema.parse(r.expected);if(wanted&&hash(expected)!==hash(mediaExpectationsSchema.parse(wanted)))return {hit:false,reason:'expectations_mismatch',file};const report=await verifyMedia(file,expected);
  return {hit:report.ok,reason:report.ok?'verified':'media_mismatch',file};
 }catch{return {hit:false,reason:'missing_or_invalid_receipt',file};}
}
export async function publishCache(root:string,key:string,temp:string,expected:MediaExpectations):Promise<string>{
 if(path.dirname(temp)!==root||!/^[a-f0-9]{64}$/.test(key))throw new Error('cache_same_directory_required');
 const report=await verifyMedia(temp,expected);if(!report.ok)throw new Error('new_cache_segment_failed_verification');
 const final=path.join(root,`${key}.mp4`),receipt=path.join(root,`${key}.json`);
 // A segment is reusable only after its exclusive receipt is published.
 await rm(receipt,{force:true});await rm(final,{force:true});await rename(temp,final);await writeJson(receipt,{key,sha256:report.sha256,expected});return final;
}
