import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {schema} from '../src/core.js';
import {createReview,importPolish,approve,status,assertApproved,hash,detectChanges} from '../src/review.js';
const draft=schema.parse({...JSON.parse(readFileSync('examples/demo.json','utf8')),fictional:false});
const now=new Date('2026-10-17T00:00:00Z');
function polished(){const p=structuredClone(draft);p.captions[0]!.text='一、收入增长，例子中的规模逐年变大';return p;}
function ready(){const r=createReview(draft);return importPolish(r,{inputHash:r.inputHash,decision:'accepted',polished:polished(),changeNotes:'Shortened phrasing without adding facts',skillUse:'not_used'},'manual');}
test('no executor is pending; import never auto-approves',()=>{
 const r=createReview(draft);assert.equal(status(r,now),'pending_execution');
 assert.throws(()=>approve(r,{reviewer:'Tester',factReviewNotes:'Checked',expiresAt:'2026-10-18T00:00:00Z'},now));
 assert.equal(status(ready(),now),'awaiting_approval');
});
test('approved exact manuscript can pass; edited project and expired approval cannot',()=>{
 const r=approve(ready(),{reviewer:'Tester',factReviewNotes:'Verified source evidence and all wording',expiresAt:'2026-10-18T00:00:00Z'},now);
 assert.equal(status(r,now),'approved');assert.doesNotThrow(()=>assertApproved(polished(),r,now));
 const changed=polished();changed.data[0]!.value=99;assert.throws(()=>assertApproved(changed,r,now));
 const edited=structuredClone(r);edited.polished!.captions[0]!.text+='。';assert.equal(status(edited,now),'stale_approval');
 const notes=structuredClone(r);notes.changeNotes='Edited audit trail';assert.equal(status(notes,now),'stale_approval');
 assert.equal(status(r,new Date('2026-10-19T00:00:00Z')),'stale_approval');
});
test('rejected or stale-input polish cannot pass',()=>{
 const r=createReview(draft);
 const rejected=importPolish(r,{inputHash:r.inputHash,decision:'rejected',polished:null,changeNotes:'Needs sources',skillUse:'not_used'},'manual');
 assert.equal(status(rejected,now),'rejected');assert.throws(()=>assertApproved(draft,rejected,now));
 assert.throws(()=>importPolish(r,{inputHash:'0'.repeat(64),decision:'accepted',polished:polished(),changeNotes:'Wrong input',skillUse:'not_used'},'manual'));
});
test('numbers, units, dates, reference IDs and qualifiers require explicit review',()=>{
 const a=structuredClone(draft);a.captions[0]!.text='截至2026-10-17，收入约12亿美元 [S1]';
 const b=structuredClone(a);b.captions[0]!.text='截至2026-10-18，收入至少13亿元 [S2]';
 const changes=detectChanges(a,b,[]);
 for(const kind of ['numbers','units','dates','references','qualifiers']) assert.ok(changes.some(c=>c.kind===kind),kind);
 const r=createReview(a);const imported=importPolish(r,{inputHash:r.inputHash,decision:'accepted',polished:b,changeNotes:'Changed claims',skillUse:'not_used'},'manual');
 assert.equal(status(imported,now),'facts_changed');
 assert.throws(()=>approve(imported,{reviewer:'Tester',factReviewNotes:'Checked',expiresAt:'2026-10-18T00:00:00Z'},now));
 const reviewed=approve(imported,{reviewer:'Tester',factReviewNotes:'Rechecked each changed source',differenceReviewNotes:'Each flagged date, value, unit, source and qualifier verified',expiresAt:'2026-10-18T00:00:00Z'},now);
 assert.equal(status(reviewed,now),'approved');
});
test('non-text changes cannot enter as polish; canonical hashing binds inputs',()=>{
 const r=createReview(draft);const b=polished();b.data[0]!.value=123;
 assert.throws(()=>importPolish(r,{inputHash:r.inputHash,decision:'accepted',polished:b,changeNotes:'Changed data',skillUse:'not_used'},'manual'));
 assert.equal(hash({b:1,a:2}),hash({a:2,b:1}));
 assert.notEqual(createReview(draft,['未经核实']).inputHash,r.inputHash);
});
