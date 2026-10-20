import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {initializeProject,importAsset,readProject,loadWorkspace} from '../src/production/project-io.js';
import {snapshotProject} from '../src/production/snapshot.js';
import {doctor} from '../src/production/doctor.js';

test('projects import immutable revisions and snapshots hash current bytes',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'production-project-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const project=path.join(root,'project');await initializeProject(project);await assert.rejects(()=>initializeProject(project));
 const original=await readFile(path.join(project,'project.json'),'utf8');
 const input=path.join(root,'data.txt');await writeFile(input,'licensed original');
 const revision=await importAsset(path.join(project,'project.json'),input,'evidence');
 assert.equal(await readFile(path.join(project,'project.json'),'utf8'),original);
 const p=await readProject(revision);assert.equal(p.inputs.length,1);
 assert.equal(await readFile(path.join(project,p.inputs[0]!.path),'utf8'),'licensed original');
 const snapshot=await snapshotProject(revision);assert.equal(snapshot.assets.length,1);
 const before=await readdir(project);const report=await doctor(revision);
 assert.equal(typeof report.ok,'boolean');assert.deepEqual(await readdir(project),before);
 const prior=process.env.FFMPEG_PATH;try{process.env.FFMPEG_PATH=path.join(root,'missing-ffmpeg');assert.ok((await doctor(revision)).diagnostics.some(d=>d.code==='tool_unavailable'&&d.id==='ffmpeg'));}finally{if(prior===undefined)delete process.env.FFMPEG_PATH;else process.env.FFMPEG_PATH=prior;}
 await writeFile(path.join(project,p.inputs[0]!.path),'changed');
 await assert.rejects(()=>snapshotProject(revision),/input_hash_mismatch/);
 assert.equal((await doctor(revision)).diagnostics.some(d=>d.code==='input_hash_mismatch'),true);
 await assert.rejects(()=>importAsset(revision,input,'evidence'),/input_id_exists/);
});

test('workspace configuration is explicit and does not implicitly read private files',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'workspace-config-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const file=path.join(root,'workspace.toml');await writeFile(file,'code_root = "C:/code"\ndata_root = "D:/data"\nconfig_root = "C:/config"\n');
 const config=await loadWorkspace(file,{});assert.equal(config.dataRoot,'D:/data');
 assert.deepEqual(await loadWorkspace(undefined,{}),{});
 await assert.rejects(()=>loadWorkspace('relative.toml',{}),/absolute/);
});
