import {readFile,writeFile,unlink} from 'node:fs/promises';
import {hostname} from 'node:os';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import path from 'node:path';

type Lock={pid:number;host:string;token:string};
function parseLock(bytes:Buffer):Lock|undefined {
 try{const value:unknown=JSON.parse(bytes.toString('utf8'));if(!value||typeof value!=='object')return;const lock=value as Partial<Lock>;
 if(typeof lock.pid!=='number'||!Number.isSafeInteger(lock.pid)||lock.pid<=0||typeof lock.host!=='string'||!lock.host||typeof lock.token!=='string'||!lock.token)return;
 return lock as Lock;
 }catch{return;}
}
function isDead(pid:number):boolean {
 try{process.kill(pid,0);return false;}catch(error){return (error as NodeJS.ErrnoException).code==='ESRCH';}
}
async function current(file:string):Promise<Buffer|undefined>{try{return await readFile(file);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return;throw error;}}
async function guarded<T>(cache:string,operation:()=>Promise<T>):Promise<T>{
 const guard=path.join(cache,'.render-lock.guard'),token=randomUUID(),bytes=Buffer.from(JSON.stringify({pid:process.pid,host:hostname(),token} satisfies Lock)+'\n');
 for(let attempt=0;attempt<60;attempt++){
 try{await writeFile(guard,bytes,{flag:'wx'});}catch(error){
 if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;
 const existing=await current(guard);
 if(existing&&!parseLock(existing))throw new Error('render_lock_guard_unknown_manual_inspection_required');
 if(attempt===59)throw new Error('render_lock_guard_busy_manual_inspection_may_be_required');
 await delay(5);continue;
 }
 try{return await operation();}finally{
 // Guards are never reclaimed. Only this critical section can remove its guard.
 const existing=await current(guard);
 if(existing?.equals(bytes))await unlink(guard);
 }
 }
 throw new Error('render_lock_guard_busy_manual_inspection_may_be_required');
}
/** All main-lock operations share an unreclaimed exclusive guard. */
export async function acquireRenderLock(cache:string):Promise<()=>Promise<void>> {
 const file=path.join(cache,'.render-lock'),host=hostname(),token=randomUUID(),bytes=JSON.stringify({pid:process.pid,host,token} satisfies Lock)+'\n';
 await guarded(cache,async()=>{
 const saved=await current(file);
 if(saved){
 const owner=parseLock(saved);if(!owner)throw new Error('render_lock_unknown_owner');
 if(owner.host!==host)throw new Error('render_lock_foreign_host');
 if(!isDead(owner.pid))throw new Error('render_lock_active_or_unconfirmed');
 const latest=await current(file);
 if(!latest?.equals(saved))throw new Error('render_lock_changed_during_recovery');
 if(!isDead(owner.pid))throw new Error('render_lock_active_or_unconfirmed');
 await unlink(file);
 }
 // Keep the guard until the new owner has written its exclusive lock.
 await writeFile(file,bytes,{flag:'wx'});
 });
 return async()=>guarded(cache,async()=>{
 const saved=await current(file);if(!saved||parseLock(saved)?.token!==token)return;
 const latest=await current(file);if(!latest?.equals(saved)||parseLock(latest)?.token!==token)return;
 await unlink(file);
 });
}
