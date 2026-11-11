import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseProject} from '../src/production/manifest.js';
import {sceneHtml} from '../src/production/templates.js';
import {sceneState} from '../src/production/scene-state.js';
import {auditNumericClaims} from '../src/production/evidence-ledger.js';
import {visualAdjustmentCss} from '../src/production/visual-adjustment-css.js';
import {capturePage,paint} from '../src/production/capture.js';
import {productionFixture} from './production-fixture.js';

function customProject() {
 const base=productionFixture();
 return {...base,sources:[{id:'s1',citation:'Fictional audited source'}],width:1080,height:1440,fps:60,
  scenes:[{id:'curve',from:0,durationFrames:90,title:'Fictional yield curve',sourceIds:['s1'],template:'custom',data:{moduleId:'yield-curve-v1',input:{unit:'%',points:[{id:'short',label:'2Y',termYears:2,yieldPercent:4.1},{id:'long',label:'10Y',termYears:10,yieldPercent:4.6}]},targets:['curve','short','long']}}],
  cues:[{id:'cue-1',text:'Fictional curve',startFrame:0,endFrame:90}],
  events:[{id:'reveal-short',sceneId:'curve',cueId:'cue-1',targetId:'short',action:'reveal',offsetFrames:0,durationFrames:30,precision:'cue_start'}],
  numericClaims:[{id:'claim-short',cueId:'cue-1',sceneId:'curve',targetId:'short',value:4.1,unit:'%',period:'2Y',scope:'Fictional issuer',sourceIds:['s1'],status:'actual'}]};
}

test('custom scene modules validate target contracts and render deterministic SVG',()=>{
 const project=parseProject(customProject());
 assert.deepEqual(sceneState(project,'curve',30).targets.short?.action,'reveal');
 const html=sceneHtml(project,'curve',30,'');
 assert.match(html,/data-target="curve"/);assert.match(html,/data-target="short"/);assert.match(html,/4\.1%/);assert.match(html,/10Y/);
 assert.equal(sceneHtml(project,'curve',30,''),html);
 assert.equal(auditNumericClaims(project).issues.filter(issue=>issue.code.startsWith('visual_')).length,0);
 const adjusted=parseProject({...project,visualAdjustments:[{sceneId:'curve',targetId:'short',translateX:8,translateY:-4,scale:1.03}]});
 assert.match(visualAdjustmentCss(adjusted,'curve'),/translate:8px -4px;scale:1\.03/);
 const wrong=structuredClone(customProject());wrong.scenes[0]!.data.targets=['curve','short'];
 assert.throws(()=>parseProject(wrong),/custom_scene_targets:curve/);
 const unknown=structuredClone(customProject());unknown.scenes[0]!.data.moduleId='external-module';
 assert.throws(()=>parseProject(unknown),/unknown_custom_scene:external-module/);
 const bad=structuredClone(customProject());(bad.scenes[0]!.data as {input:unknown}).input={unit:'%',points:[{id:'short'}]};
 assert.throws(()=>parseProject(bad),/invalid_type|too_small|Required/);
 const landscape=structuredClone(customProject());landscape.width=1920;landscape.height=1080;landscape.fps=30;
 assert.throws(()=>parseProject(landscape),/custom_scene_requires_portrait/);
});

test('custom scene facts feed numeric claim audit without granting verification',()=>{
 const project=parseProject(customProject());
 const mismatch=structuredClone(project);mismatch.numericClaims![0]!.value=4.2;
 assert(auditNumericClaims(mismatch).issues.some(issue=>issue.code==='visual_value_mismatch'));
 assert.equal(auditNumericClaims(project).factualVerification,false);
});

test('custom scene passes native layout checks and deterministic repaint',async()=>{
 const project=parseProject(customProject()),session=await capturePage();
 try{
  await paint(session.page,session.font,project,'curve',30);const first=await session.page.screenshot();
  await paint(session.page,session.font,project,'curve',60);await paint(session.page,session.font,project,'curve',30);
  assert.deepEqual(first,await session.page.screenshot());
 }finally{await session.close();}
});
