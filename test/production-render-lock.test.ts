import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir,hostname} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {acquireRenderLock} from '../src/production/render-lock.js';

test('render lock refuses current process and foreign or malformed ownership',async t=>{
 const cache=await mkdtemp(path.join(tmpdir(),'render-lock-'));t.after(()=>rm(cache,{recursive:true,force:true}));const file=path.join(cache,'.render-lock');
 for(const content of [JSON.stringify({pid:process.pid,host:hostname(),token:'active'}),JSON.stringify({pid:process.pid,host:hostname()+'-foreign',token:'foreign'}),'','{}','not json']){
 await writeFile(file,content);await assert.rejects(()=>acquireRenderLock(cache),/render_lock/);assert.equal(await readFile(file,'utf8'),content);
 }
});

test('render lock recovers only a confirmed dead same-host process and release preserves replacement',async t=>{
 const cache=await mkdtemp(path.join(tmpdir(),'render-lock-dead-'));t.after(()=>rm(cache,{recursive:true,force:true}));const file=path.join(cache,'.render-lock');
 const child=spawn(process.execPath,['-e','process.exit(0)'],{stdio:'ignore',windowsHide:true});const pid=child.pid!;await new Promise<void>((resolve,reject)=>{child.once('exit',()=>resolve());child.once('error',reject);});
 assert.throws(()=>process.kill(pid,0),(e:unknown)=>(e as NodeJS.ErrnoException).code==='ESRCH');
 await writeFile(file,JSON.stringify({pid,host:hostname(),token:'dead'}));const release=await acquireRenderLock(cache);const own=JSON.parse(await readFile(file,'utf8')) as {pid:number;host:string;token:string};assert.equal(own.pid,process.pid);assert.equal(own.host,hostname());assert.notEqual(own.token,'dead');
 await assert.rejects(()=>acquireRenderLock(cache),/render_lock/);const replacement=JSON.stringify({...own,token:'replacement'});await writeFile(file,replacement);await release();assert.equal(await readFile(file,'utf8'),replacement);
 await rm(file);const releaseOwn=await acquireRenderLock(cache);await releaseOwn();await assert.rejects(()=>readFile(file),{code:'ENOENT'});
});

test('concurrent stale recovery grants exactly one owner and retains its live lock',async t=>{
 const cache=await mkdtemp(path.join(tmpdir(),'render-lock-race-'));t.after(()=>rm(cache,{recursive:true,force:true}));const file=path.join(cache,'.render-lock');
 const child=spawn(process.execPath,['-e','process.exit(0)'],{stdio:'ignore',windowsHide:true});const pid=child.pid!;await new Promise<void>((resolve,reject)=>{child.once('exit',()=>resolve());child.once('error',reject);});
 for(let round=0;round<20;round++){
 await writeFile(file,JSON.stringify({pid,host:hostname(),token:`stale-${round}`}));
 const contenders=await Promise.allSettled(Array.from({length:16},()=>acquireRenderLock(cache)));
 const owners=contenders.filter((r):r is PromiseFulfilledResult<()=>Promise<void>>=>r.status==='fulfilled');
 assert.equal(owners.length,1,`round ${round} granted multiple owners`);
 const owner=JSON.parse(await readFile(file,'utf8')) as {pid:number};assert.equal(owner.pid,process.pid);
 await assert.rejects(()=>acquireRenderLock(cache),/render_lock/);await owners[0]!.value();
 }
});

test('unknown and abandoned guards require manual inspection and are never reclaimed',async t=>{
 const cache=await mkdtemp(path.join(tmpdir(),'render-lock-guard-'));t.after(()=>rm(cache,{recursive:true,force:true}));const file=path.join(cache,'.render-lock.guard');
 for(const content of ['',JSON.stringify({pid:process.pid,host:hostname(),token:'guard'})]){
 await writeFile(file,content);await assert.rejects(()=>acquireRenderLock(cache),/render_lock_guard_(?:unknown|busy)/);assert.equal(await readFile(file,'utf8'),content);
 }
});
