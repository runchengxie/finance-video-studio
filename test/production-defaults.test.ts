import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {initializeProject,readProject,importAsset} from '../src/production/project-io.js';

test('new projects default to the versioned portrait explanation contract',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'production-defaults-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await initializeProject(path.join(root,'episode'));const p=await readProject(path.join(root,'episode/project.json'));
 assert.deepEqual([p.width,p.height,p.fps],[1080,1440,60]);
 assert.equal(p.render.theme,'broadcast-v1');assert.deepEqual(p.render.visual,{preset:'warm-paper',motion:'subtle'});
 assert.deepEqual((p as unknown as {productionProfile:unknown}).productionProfile,{id:'portrait-explainer-v1',audioEdit:{decision:'pending'}});
});

test('legacy landscape scaffolding must be explicitly selected',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'production-legacy-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await initializeProject(path.join(root,'episode'),'legacy-landscape');const p=await readProject(path.join(root,'episode/project.json'));
 assert.deepEqual([p.width,p.height,p.fps],[1920,1080,30]);assert.equal(p.render.theme,'studio-v1');
});

test('importing identical same-type bytes reuses the verified project input',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'production-reuse-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const dir=path.join(root,'episode');await initializeProject(dir);const input=path.join(root,'source.txt');await writeFile(input,'original licensed evidence');
 const first=await importAsset(path.join(dir,'project.json'),input,'first');const next=await importAsset(first,input,'second');const p=await readProject(next);
 assert.equal(p.inputs.length,2);assert.equal(p.inputs[0]!.path,p.inputs[1]!.path);assert.equal(p.inputs[0]!.sha256,p.inputs[1]!.sha256);
});

test('a matching declared hash cannot reuse a tampered input',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'production-reuse-tampered-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const dir=path.join(root,'episode');await initializeProject(dir);const input=path.join(root,'source.txt');await writeFile(input,'original licensed evidence');
 const first=await importAsset(path.join(dir,'project.json'),input,'first');const p=await readProject(first);await writeFile(path.join(dir,p.inputs[0]!.path),'tampered');
 await assert.rejects(()=>importAsset(first,input,'second'),/input_hash_mismatch/);
});
