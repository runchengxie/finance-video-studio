import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {productionFixture} from './production-fixture.js';
import {snapshotProject} from '../src/production/snapshot.js';
import {createProductionReview,importProductionPolish,approveProductionReview} from '../src/production/review.js';
import {saveProductionReview} from '../src/production/review-io.js';
import {hash} from '../src/review.js';
import {renderProduction} from '../src/production/render.js';
import {packageDelivery} from '../src/production/delivery.js';

test('delivery requires a complete native build and approved current snapshot, preserves public/internal separation',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'finance-delivery-'));try{
 const manifest=path.join(root,'project.json'),reviewFile=path.join(root,'review.json'),build=path.join(root,'build'),stub=path.join(root,'stub');await mkdir(stub);
 await writeFile(manifest,JSON.stringify({...productionFixture(),internalNotes:[{id:'listen',text:'待听校，原声保留'}]}));
 const snapshot=await snapshotProject(manifest),pending=createProductionReview(snapshot);await saveProductionReview(path.join(root,'pending.json'),pending);
 const rejected=path.join(root,'rejected');await assert.rejects(packageDelivery(manifest,path.join(root,'pending.json'),build,rejected),/approval/);await assert.rejects(access(rejected));
 const imported=importProductionPolish(pending,{inputHash:pending.inputHash,decision:'accepted',polished:snapshot,changeNotes:'Synthetic test review.',skillUse:'not_used'});
 await saveProductionReview(reviewFile,approveProductionReview(imported,{reviewer:'Synthetic test operator',factReviewNotes:'Fixed synthetic fixture',expiresAt:new Date(Date.now()+3600000).toISOString()}));
 await writeFile(path.join(stub,'build.json'),JSON.stringify({ok:true,inputHash:hash(snapshot),verification:{sha256:'0'.repeat(64)}}));
 await assert.rejects(packageDelivery(manifest,reviewFile,stub,rejected),/native_build_report/);await assert.rejects(access(rejected));
 await renderProduction(manifest,reviewFile,build,path.join(root,'cache'));
 const originalBuild=JSON.parse(await readFile(path.join(build,'build.json'),'utf8'));
 await writeFile(path.join(build,'build.json'),JSON.stringify({...originalBuild,inputHash:'0'.repeat(64)}));
 await assert.rejects(packageDelivery(manifest,reviewFile,build,rejected),/build_snapshot/);await assert.rejects(access(rejected));
 await writeFile(path.join(build,'build.json'),JSON.stringify(originalBuild));
 const output=path.join(root,'delivery');const receipt=await packageDelivery(manifest,reviewFile,build,output);assert.equal(receipt.complete,true);assert.equal(receipt.manualListening,false);
 for(const [name,w,h] of [['cover-3x4.png',1080,1440],['cover-4x3.png',1440,1080]] as const){const png=await readFile(path.join(output,'public',name));assert.equal(png.readUInt32BE(16),w);assert.equal(png.readUInt32BE(20),h)}
 assert(!(await readFile(path.join(output,'public','subtitles.srt'),'utf8')).includes('待听校'));assert((await readFile(path.join(output,'internal','snapshot.json'),'utf8')).includes('待听校'));
 await assert.rejects(packageDelivery(manifest,reviewFile,build,output));
 await writeFile(manifest,JSON.stringify({...snapshot.project,delivery:{cover:{headline:'Changed cover',subtitle:'Changed subtitle',series:'Fictional'}}}));
 await assert.rejects(packageDelivery(manifest,reviewFile,build,path.join(root,'changed-cover')),/approval/);
 await writeFile(manifest,JSON.stringify(snapshot.project));
 await writeFile(path.join(build,'final.mp4'),'corrupt');await assert.rejects(packageDelivery(manifest,reviewFile,build,path.join(root,'tampered')),/build_media_hash/);
 }finally{await rm(root,{recursive:true,force:true})}
});

test('real rendering and delivery refuse approved public status labels before creating outputs',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'finance-public-notes-'));try{
 const manifest=path.join(root,'project.json'),reviewFile=path.join(root,'approved.json');
 await writeFile(manifest,JSON.stringify({...productionFixture(),title:'原声保留'}));
 const snapshot=await snapshotProject(manifest),pending=createProductionReview(snapshot);
 const imported=importProductionPolish(pending,{inputHash:pending.inputHash,decision:'accepted',polished:snapshot,changeNotes:'Synthetic negative test',skillUse:'not_used'});
 await saveProductionReview(reviewFile,approveProductionReview(imported,{reviewer:'Synthetic test',factReviewNotes:'Negative fixture',expiresAt:new Date(Date.now()+3600000).toISOString()}));
 const output=path.join(root,'render'),delivery=path.join(root,'delivery');
 await assert.rejects(renderProduction(manifest,reviewFile,output,path.join(root,'cache')),/internal_note_in_audience/);await assert.rejects(access(output));
 await assert.rejects(packageDelivery(manifest,reviewFile,output,delivery),/internal_note_in_audience/);await assert.rejects(access(delivery));
 }finally{await rm(root,{recursive:true,force:true})}
});
