import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseProject} from '../src/production/manifest.js';
import {numericClaimSchema,auditNumericClaims,validateClaimLinks} from '../src/production/evidence-ledger.js';
import {productionFixture} from './production-fixture.js';
test('numeric claims validate links and report visual mismatches without factual verification',()=>{
 const p=parseProject({...productionFixture(),sources:[{id:'source',citation:'Synthetic evidence'}],scenes:productionFixture().scenes.map(s=>({...s,sourceIds:['source']})),cues:[{id:'cue-1',text:'Cash is 30 million',startFrame:0,endFrame:90}]});
 const claim=numericClaimSchema.parse({id:'cash-claim',cueId:'cue-1',sceneId:'cash',targetId:'operating',value:31,unit:'USD million',period:'2025',scope:'Synthetic',sourceIds:['source'],status:'actual'});
 const project={...p,numericClaims:[claim]};validateClaimLinks(project);const audit=auditNumericClaims(project);assert.equal(audit.factualVerification,false);assert(audit.issues.some(i=>i.code==='visual_value_mismatch'));
 assert.throws(()=>validateClaimLinks({...project,numericClaims:[{...claim,cueId:'missing'}]}),/claim_cue/);
 assert.equal(numericClaimSchema.safeParse({...claim,value:Infinity}).success,false);
 assert.equal(numericClaimSchema.safeParse({...claim,sourceIds:[]}).success,false);
 assert(auditNumericClaims(p).issues.some(i=>i.code==='numeric_cue_missing_claim'));
});

test('trend claims compare the stated period and unit rather than any matching series value',()=>{
 const fixture=productionFixture();const p=parseProject({...fixture,sources:[{id:'source',citation:'Synthetic'}],scenes:[{id:'cash',from:0,durationFrames:90,title:'Trend',sourceIds:['source'],template:'trend',data:{unit:'USD',series:[{id:'operating',label:'Cash',values:[{label:'2024',value:30},{label:'2025',value:40}]}]}}]});
 const claim=numericClaimSchema.parse({id:'claim',cueId:'cue-1',sceneId:'cash',targetId:'operating',value:30,unit:'EUR',period:'2025',scope:'Synthetic',sourceIds:['source'],status:'estimate'});
 const issues=auditNumericClaims({...p,numericClaims:[claim]}).issues;assert(issues.some(x=>x.code==='visual_value_mismatch'));assert(issues.some(x=>x.code==='visual_unit_mismatch'));assert(auditNumericClaims({...p,numericClaims:[{...claim,period:'unknown'}]}).issues.some(x=>x.code==='visual_period_unresolved'));
 assert.throws(()=>validateClaimLinks({...p,numericClaims:[{...claim,sourceIds:['missing']}]}),/claim_source_reference/);
});
