import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseProject} from '../src/production/manifest.js';
import {productionFixture} from './production-fixture.js';
import {auditProduction,assertAudienceReady} from '../src/production/preflight.js';

test('internal notes stay separate while public review labels block delivery without stripping qualifications',()=>{
 const p=parseProject({...productionFixture(),internalNotes:[{id:'listening',text:'待听校，原声保留'}]});
 assert.doesNotThrow(()=>assertAudienceReady(p));
 assert.throws(()=>assertAudienceReady({...p,cues:[{...p.cues[0]!,text:'年份按资料更正 · 原声保留 · 待听校'}]}),/internal_note_in_audience/);
 assert.doesNotThrow(()=>assertAudienceReady({...p,cues:[{...p.cues[0]!,text:'2025 Q3 estimated; only this expense adjusted'}]}));
});
test('subtitle audit proposes corrections without changing originals and flags uncovered numeric cues',()=>{
 const p=parseProject({...productionFixture(),contentLanguage:'zh',cues:[{id:'cue-1',text:'2026年汇报率是12.3%,需要核对',startFrame:0,endFrame:90}],events:[]});
 const result=auditProduction(p);assert.equal(p.cues[0]!.text,'2026年汇报率是12.3%,需要核对');
 assert(result.issues.some(i=>i.code==='financial_term'));assert(result.issues.some(i=>i.code==='halfwidth_punctuation'));assert(result.issues.some(i=>i.code==='numeric_cue_without_event'));
 assert.equal(result.factualVerification,false);assert.equal(result.manualListening,false);
});

test('broadcast masthead is an audience field and must reject internal status',()=>{
 const p=parseProject({...productionFixture(),render:{theme:'broadcast-v1',broadcast:{programName:'原声保留'},crf:20,audioId:null,normalization:null}});
 assert.throws(()=>assertAudienceReady(p),/internal_note_in_audience/);
});
