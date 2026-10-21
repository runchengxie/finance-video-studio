import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {parseProject,targetIds} from '../src/production/manifest.js';
import {hashFile} from '../src/production/project-io.js';
import {snapshotProject} from '../src/production/snapshot.js';
import {createProductionReview,importProductionPolish,approveProductionReview,assertProductionApproved} from '../src/production/review.js';
import {productionFixture} from './production-fixture.js';

import {broadcastFixture} from './broadcast-fixture.js';

test('broadcast accepts local image and background references while studio remains compatible',()=>{
 assert.equal(parseProject(broadcastFixture()).render.theme,'broadcast-v1');
 assert.equal(parseProject(productionFixture()).render.theme,'studio-v1');
 const p=broadcastFixture();
 assert.throws(()=>parseProject({...p,render:{...p.render,broadcast:undefined}}));
 assert.throws(()=>parseProject({...p,render:{...p.render,theme:'studio-v1'}}));
 for(const id of ['page','absent'])assert.throws(()=>parseProject({...p,render:{...p.render,broadcast:{...p.render.broadcast,backgroundVideoId:id}}}));
});

test('signed comparison preserves negatives and event targets without relaxing comparison',()=>{
 const p=productionFixture(),s=p.scenes[0]!;
 const data={unit:'%',items:[{id:'operating',label:'First',value:-18.1},{id:'equipment',label:'Second',value:9.9}]};
 const signed=parseProject({...p,scenes:[{...s,template:'signed-comparison',data}]});
 assert.deepEqual(targetIds(signed.scenes[0]!),['operating','equipment']);
 assert.throws(()=>parseProject({...p,scenes:[{...s,data}]}));
});

test('evidence panels reject bad input/source/cue references and off-image highlights',()=>{
 const valid=broadcastFixture();
 for(const change of [
  (p:typeof valid)=>{p.scenes[0]!.presentation.evidencePanels[0]!.inputId='backdrop';},
  (p:typeof valid)=>{p.scenes[0]!.sourceIds=[];},
  (p:typeof valid)=>{p.scenes[0]!.presentation.sidebar[0]!.cueId='missing';},
  (p:typeof valid)=>{p.scenes[0]!.presentation.evidencePanels[0]!.highlight.cueId='missing';},
  (p:typeof valid)=>{p.scenes[0]!.presentation.evidencePanels[0]!.highlight.width=.95;},
  (p:typeof valid)=>{p.scenes[0]!.presentation.evidencePanels[0]!.highlight.height=0;},
 ]){const p=structuredClone(valid);change(p);assert.throws(()=>parseProject(p));}
});

test('changed image/background bytes and presentation invalidate the approved snapshot',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'broadcast-binding-'));
 try{
  await mkdir(path.join(root,'inputs'));const p=broadcastFixture(),file=path.join(root,'project.json');
  for(const input of p.inputs){await writeFile(path.join(root,input.path),'original');input.sha256=await hashFile(path.join(root,input.path));}
  await writeFile(file,JSON.stringify(p));const snap=await snapshotProject(file),r=createProductionReview(snap);
  const now=new Date('2026-10-21T00:00:00Z');
  const approved=approveProductionReview(importProductionPolish(r,{inputHash:r.inputHash,decision:'accepted',polished:snap,changeNotes:'Synthetic',skillUse:'not_used'}),{reviewer:'Test',factReviewNotes:'Fictional',expiresAt:'2026-10-22T00:00:00Z'},now);
  for(const input of p.inputs){
   await writeFile(path.join(root,input.path),'changed');await assert.rejects(snapshotProject(file),/input_hash_mismatch/);
   input.sha256=await hashFile(path.join(root,input.path));await writeFile(file,JSON.stringify(p));
   const updated=await snapshotProject(file);assert.throws(()=>assertProductionApproved(updated,approved,now));
  }
  const changed=structuredClone(snap);changed.project.render.broadcast!.programName='Changed';
  assert.throws(()=>assertProductionApproved(changed,approved,now));
 }finally{await rm(root,{recursive:true,force:true});}
});

