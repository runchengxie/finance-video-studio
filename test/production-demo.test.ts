import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productionDemoFixture,assertProductionFixture} from '../src/production/demo.js';
test('fixed production demo rejects arbitrary content and variant inputs',async()=>{
 const p=await productionDemoFixture('improved');assert.equal(p.durationFrames,1080);assert.deepEqual(p,await productionDemoFixture('legacy-comparison'));
 p.manuscript[0]!.text='Changed claim';assert.throws(()=>assertProductionFixture(p),/content_changed/);
 await assert.rejects(()=>productionDemoFixture('C:/arbitrary.json' as 'improved'),/unknown_fixed_variant/);
});
