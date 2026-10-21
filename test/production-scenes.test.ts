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
test('evidence always displays its required citation even without scene sourceIds',()=>{
 const p=parseProject(productionFixture()),s=p.scenes[0]!;
 p.sources=[{id:'evidence-source',citation:'Unique evidence citation'}];p.events=[];
 p.scenes=[{...s,sourceIds:[],template:'evidence',data:{id:'excerpt',text:'An attributed statement',sourceId:'evidence-source'}}];
 assert.ok(sceneHtml(p,s.id,0,'').includes('Unique evidence citation'));
});
test('dense process labels reject rather than overlapping their details',()=>{
 const p=parseProject(productionFixture()),s=p.scenes[0]!;p.events=[];
 p.scenes=[{...s,template:'process',data:{items:[{id:'a',label:'中'.repeat(50),detail:'DETAIL SHOULD REMAIN LEGIBLE'},{id:'b',label:'Check',detail:'Short'},{id:'c',label:'Inspect',detail:'Short'}]}}];
 assert.throws(()=>sceneHtml(p,s.id,0,''),/process_density/);
});


test('existing studio production scenes pass the stricter SVG collision check',async()=>{
 const {productionDemoFixture}=await import('../src/production/demo.js'),{capturePage,paint}=await import('../src/production/capture.js');const p=await productionDemoFixture('improved'),session=await capturePage();
 try{for(const scene of p.scenes)await paint(session.page,session.font,p,scene.id,scene.from+scene.durationFrames-1);}finally{await session.close();}
});
