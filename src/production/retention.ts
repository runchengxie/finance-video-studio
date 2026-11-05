import {lstat,readdir} from 'node:fs/promises';
import path from 'node:path';
import {hashFile} from './project-io.js';
import {assertExternal} from './paths.js';

const skippedDirectories=new Set(['node_modules','.git','.venv','venv']);
type Entry={path:string;size:number;device:number;inode:number;modifiedMs:number;links:number};
/** Read-only byte inventory. Equal content is a candidate, never permission to delete. */
export async function inventoryStorage(root:string){
 await assertExternal(root);if(!(await lstat(root)).isDirectory())throw new Error('storage_directory_required');
 const files:Entry[]=[],symlinks:string[]=[],excluded:string[]=[];
 async function walk(directory:string){
  for(const name of (await readdir(directory)).sort()){
   const file=path.join(directory,name),relative=path.relative(root,file),s=await lstat(file);
   if(s.isSymbolicLink()){symlinks.push(relative);continue;}
   if(s.isDirectory()){if(skippedDirectories.has(name))excluded.push(relative);else await walk(file);}
   else if(s.isFile())files.push({path:relative,size:s.size,device:s.dev,inode:s.ino,modifiedMs:s.mtimeMs,links:s.nlink});
  }
 }
 await walk(root);
 const inodes=new Map<string,Entry[]>();for(const f of files){const key=f.device+':'+f.inode;inodes.set(key,[...(inodes.get(key)??[]),f]);}
 const sizes=new Map<number,Entry[][]>();for(const group of inodes.values()){const size=group[0]!.size;if(size)sizes.set(size,[...(sizes.get(size)??[]),group]);}
 const groups:{sha256:string;size:number;potentialBytes:number;copies:{device:number;inode:number;paths:string[];linkCount:number}[]}[]=[];
 for(const [size,candidates] of sizes){
  if(candidates.length<2)continue;const hashes=new Map<string,Entry[][]>();
  for(const entries of candidates){const f=entries[0]!,file=path.join(root,f.path),before=await lstat(file);if(before.isSymbolicLink()||before.ino!==f.inode||before.dev!==f.device||before.size!==size||before.mtimeMs!==f.modifiedMs)throw new Error('storage_changed_during_inventory');const digest=await hashFile(file),after=await lstat(file);if(after.ino!==f.inode||after.dev!==f.device||after.size!==size||after.mtimeMs!==f.modifiedMs)throw new Error('storage_changed_during_inventory');hashes.set(digest,[...(hashes.get(digest)??[]),entries]);}
  for(const [sha256,copies] of hashes)if(copies.length>1){const devices=new Set(copies.map(x=>x[0]!.device));groups.push({sha256,size,potentialBytes:(copies.length-devices.size)*size,copies:copies.map(x=>({device:x[0]!.device,inode:x[0]!.inode,paths:x.map(f=>f.path),linkCount:x[0]!.links}))});}
 }
 const logicalBytes=files.reduce((n,f)=>n+f.size,0),uniqueInodeBytes=[...inodes.values()].reduce((n,x)=>n+x[0]!.size,0);
 return {schemaVersion:1,createdAt:new Date().toISOString(),root,readOnly:true,fileCount:files.length,logicalBytes,uniqueInodeBytes,alreadySharedBytes:logicalBytes-uniqueInodeBytes,potentialDuplicateBytes:groups.reduce((n,g)=>n+g.potentialBytes,0),groups:groups.sort((a,b)=>b.potentialBytes-a.potentialBytes||a.sha256.localeCompare(b.sha256)),symlinks,excluded,limitations:'File-size accounting, not physical disk blocks. Potential savings count distinct inodes per filesystem; external hardlinks, active jobs, references, rights and retention must be checked before any separate cleanup. Inputs and unique evidence are never disposable solely because content matches.'};
}
