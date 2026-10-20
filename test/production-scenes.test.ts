import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productionFixture} from './production-fixture.js';
import {parseProject} from '../src/production/manifest.js';
import {sceneState} from '../src/production/scene-state.js';
import {sceneHtml} from '../src/production/templates.js';
test('events resolve deterministically at half-open cue-relative intervals',()=>{
 const p=parseProject(productionFixture()),s=p.scenes[0]!,e=p.events[0]!;
 const start=p.cues.find(c=>c.id===e.cueId)!.startFrame+e.offsetFrames;
 assert.equal(sceneState(p,s.id,start).targets[e.targetId]!.progress,0);
 assert.equal(sceneState(p,s.id,start+e.durationFrames).targets[e.targetId]!.progress,1);
 assert.deepEqual(sceneState(p,s.id,7),sceneState(p,s.id,7));
 for(const action of ['highlight','compare','annotate'] as const){p.events[0]!.action=action;assert.equal(sceneState(p,s.id,7).targets[e.targetId]!.action,action);}
 assert.throws(()=>sceneState(p,'missing',0));
});
test('markup escapes claims and removes absent caption backgrounds',()=>{
 const p=parseProject(productionFixture());p.title='<script>alert(1)</script>';p.scenes[0]!.title=p.title;
 const html=sceneHtml(p,p.scenes[0]!.id,0,'');assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
 p.cues=[];p.events=[];assert.ok(!sceneHtml(p,p.scenes[0]!.id,0,'').includes('class="caption"'));
 assert.equal(sceneHtml(p,p.scenes[0]!.id,0,''),sceneHtml(p,p.scenes[0]!.id,0,''));
});

