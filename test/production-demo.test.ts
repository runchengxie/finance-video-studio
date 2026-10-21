import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productionDemoFixture,assertProductionFixture} from '../src/production/demo.js';
test('fixed production demo rejects arbitrary content and variant inputs',async()=>{
 const p=await productionDemoFixture('improved');assert.equal(p.durationFrames,1080);assert.deepEqual(p,await productionDemoFixture('legacy-comparison'));
 p.manuscript[0]!.text='Changed claim';assert.throws(()=>assertProductionFixture(p),/content_changed/);
 await assert.rejects(()=>productionDemoFixture('C:/arbitrary.json' as 'improved'),/unknown_fixed_variant/);
});

test('broadcast demo accepts only its pinned twelve-second fixture',async()=>{
 const {broadcastDemoFixture,assertBroadcastFixture}=await import('../src/production/demo.js');
 const p=await broadcastDemoFixture();assert.equal(p.durationFrames,360);
 assert.deepEqual(p.scenes.map(s=>s.presentation?.layout),['evidence','wide-chart','explanation']);
 p.scenes[0]!.title='Real replacement';assert.throws(()=>assertBroadcastFixture(p),/fixed_synthetic_content_changed/);
});
