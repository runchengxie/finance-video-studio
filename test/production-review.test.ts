import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseProject} from '../src/production/manifest.js';
import {productionFixture} from './production-fixture.js';
import type {EditorialSnapshot} from '../src/production/snapshot.js';
import {createProductionReview,importProductionPolish,approveProductionReview,assertProductionApproved,assertProductionBuildApproved,productionReviewStatus,detectProductionChanges} from '../src/production/review.js';

const snapshot=():EditorialSnapshot=>({schemaVersion:2,project:parseProject(productionFixture()),assets:[],templateRevision:'0'.repeat(64)});
const now=new Date('2026-10-21T00:00:00Z');
test('an independently approved replacement cannot authorize an in-flight build',()=>{
 const initial=snapshot(),current=snapshot();current.project.title='Approved replacement';const r=createProductionReview(current);
 const polished=importProductionPolish(r,{inputHash:r.inputHash,decision:'accepted',polished:current,changeNotes:'test replacement',skillUse:'not_used'});
 const approved=approveProductionReview(polished,{reviewer:'test',factReviewNotes:'test',expiresAt:'2026-10-22T00:00:00Z'},now);
 assert.doesNotThrow(()=>assertProductionApproved(current,approved,now));
 assert.throws(()=>assertProductionBuildApproved(initial,current,approved,now),/build_snapshot_changed/);
});
test('full-length review remains pending until explicit exact-snapshot approval',()=>{
 const draft=snapshot();draft.project.manuscript[0]!.text='A'.repeat(4000);
 const r=createProductionReview(draft);assert.equal(r.draft.project.manuscript[0]!.text.length,4000);
 assert.throws(()=>assertProductionApproved(draft,r,now));
 const result=importProductionPolish(r,{inputHash:r.inputHash,decision:'accepted',polished:draft,changeNotes:'Human checked synthetic text',skillUse:'not_used'});
 assert.equal(productionReviewStatus(result,now),'awaiting_approval');
 const approved=approveProductionReview(result,{reviewer:'Synthetic simulation',factReviewNotes:'Fictional fixture only',expiresAt:'2026-10-22T00:00:00Z'},now);
 assert.doesNotThrow(()=>assertProductionApproved(draft,approved,now));
 const edited=structuredClone(draft);edited.project.title='Changed';assert.throws(()=>assertProductionApproved(edited,approved,now));
 assert.equal(productionReviewStatus(approved,new Date('2026-10-23T00:00:00Z')),'stale_approval');
 const forged=structuredClone(approved);forged.changeNotes='changed';assert.equal(productionReviewStatus(forged,now),'stale_approval');
});

test('new claims are detected and structural/input changes cannot be text polish',()=>{
 const draft=snapshot(),r=createProductionReview(draft),after=structuredClone(draft);
 after.project.manuscript.push({id:'new',text:'New 20 USD fact',sourceIds:[]});
 assert.ok(detectProductionChanges(draft,after,[]).some(d=>d.field==='manuscript.new'));
 const response={inputHash:r.inputHash,decision:'accepted',polished:after,changeNotes:'new',skillUse:'not_used'};
 assert.throws(()=>importProductionPolish(r,response),/structural/);
 after.project.manuscript.pop();after.project.cues[0]!.text='approximately 15 USD';
 const changed=importProductionPolish(r,{...response,polished:after});assert.equal(productionReviewStatus(changed,now),'facts_changed');
 assert.throws(()=>approveProductionReview(changed,{reviewer:'test',factReviewNotes:'test',expiresAt:'2026-10-22T00:00:00Z'},now),/difference/);
 const rejected=importProductionPolish(r,{...response,decision:'rejected',polished:null});assert.equal(productionReviewStatus(rejected,now),'rejected');
 assert.throws(()=>approveProductionReview(rejected,{reviewer:'test',factReviewNotes:'test',expiresAt:'2026-10-22T00:00:00Z'},now));
 assert.throws(()=>assertProductionApproved(draft,{version:1} as never,now));
});
