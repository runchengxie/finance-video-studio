import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {chromium} from 'playwright';
import {parseProject} from '../src/production/manifest.js';
import {applyVisualPatch,visualPatchSchema} from '../src/production/visual-adjustments.js';
import {visualAdjustmentCss} from '../src/production/visual-adjustment-css.js';
import {sceneHtml} from '../src/production/templates.js';
import {createLivePreview} from '../src/production/live-preview.js';
import {capturePage,paint} from '../src/production/capture.js';
import {compileStages} from '../src/production/stages.js';
import {visualStageFingerprint} from '../src/production/visual-fingerprint.js';
import {productionFixture} from './production-fixture.js';

test('visual adjustments are bounded, target-checked and rendered as deterministic CSS',()=>{
 const fixture=productionFixture();
 const project=parseProject({...fixture,visualAdjustments:[{sceneId:'cash',targetId:'operating',translateX:24,translateY:-12,scale:1.05}]});
 assert.match(visualAdjustmentCss(project,'cash'),/translate:24px -12px;scale:1\.05/);
 assert.equal(visualAdjustmentCss(project,'other'),'');
 const html=sceneHtml(project,'cash',30,'');
 assert.match(html,/<html data-scene="cash"/);
 assert.match(html,/html\[data-scene="cash"\] \[data-target="operating"\]\{translate:24px -12px/);
 assert.equal(sceneHtml(project,'cash',30,''),html);
 assert.doesNotMatch(sceneHtml(parseProject(fixture),'cash',30,''),/data-scene/);
 const stage=compileStages(project)[0]!,unadjusted=parseProject(fixture);assert.notDeepEqual(visualStageFingerprint(project,stage,'r'),visualStageFingerprint(unadjusted,stage,'r'));
 const defaults=parseProject({...fixture,visualAdjustments:[{sceneId:'cash',targetId:'equipment'}]});
 assert.deepEqual(defaults.visualAdjustments?.[0],{sceneId:'cash',targetId:'equipment',translateX:0,translateY:0,scale:1});
 assert.throws(()=>parseProject({...fixture,visualAdjustments:[{sceneId:'cash',targetId:'missing'}]}),/visual_adjustment_target/);
 assert.throws(()=>parseProject({...fixture,visualAdjustments:[{sceneId:'cash',targetId:'operating',scale:2}]}),/Too big|less than or equal/);
 assert.throws(()=>parseProject({...fixture,visualAdjustments:[{sceneId:'cash',targetId:'operating'},{sceneId:'cash',targetId:'operating'}]}),/duplicate_visual_adjustment/);
});

test('visual patch replaces listed targets, keeps others and rejects foreign patches',()=>{
 const project=parseProject({...productionFixture(),visualAdjustments:[{sceneId:'cash',targetId:'equipment',translateX:5,scale:1.2}]});
 const patch={schemaVersion:1,projectId:'synthetic',baseSnapshotHash:'0'.repeat(64),changes:[{sceneId:'cash',targetId:'operating',translateX:30,translateY:18,scale:1.04}]};
 const next=applyVisualPatch(project,patch);
 assert.deepEqual(next.visualAdjustments,[{sceneId:'cash',targetId:'equipment',translateX:5,translateY:0,scale:1.2},{sceneId:'cash',targetId:'operating',translateX:30,translateY:18,scale:1.04}]);
 const scene=next.scenes[0]!;assert.equal(scene.template,'comparison');if(scene.template==='comparison')assert.equal(scene.data.items[0]!.value,30);
 assert.throws(()=>applyVisualPatch(project,{...patch,projectId:'other'}),/visual_patch_project_mismatch/);
 assert.throws(()=>applyVisualPatch(project,{...patch,changes:[...patch.changes,...patch.changes]}),/visual_patch_duplicate/);
 assert.throws(()=>applyVisualPatch(project,{...patch,changes:[{sceneId:'cash',targetId:'missing'}]}),/visual_patch_target/);
 assert.throws(()=>visualPatchSchema.parse({...patch,changes:[]}),/at least 1|Too small/);
});

test('painted adjustments keep layout checks and repeat the same frame after seeking elsewhere',async()=>{
 const project=parseProject({...productionFixture(),width:1080,height:1440,fps:60,visualAdjustments:[{sceneId:'cash',targetId:'operating',translateX:12,translateY:-8,scale:1.02}]});
 const session=await capturePage();
 try{
  await paint(session.page,session.font,project,'cash',30);const first=await session.page.screenshot();
  await paint(session.page,session.font,project,'cash',60);await paint(session.page,session.font,project,'cash',30);const second=await session.page.screenshot();
  assert.deepEqual(first,second);
  assert.equal(await session.page.locator('[data-target="operating"]').evaluate(element=>getComputedStyle(element).translate),'12px -8px');
 }finally{await session.close();}
});

test('live preview edits a selected chart target and exports an applicable patch',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'visual-edit-'));t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(path.join(root,'inputs'));
 const original=productionFixture(),p={...original,width:1080,height:1440,fps:60};
 const manifest=path.join(root,'project.json');await writeFile(manifest,JSON.stringify(p));
 const out=path.join(root,'preview'),cache=path.join(root,'cache'),report=await createLivePreview(manifest,out,cache);
 assert.equal(report.editable,true);assert.equal(report.visualAdjustments,0);assert.equal(report.approvalGranted,false);
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();await page.route(/^https?:/,route=>route.abort());await page.goto('file://'+path.join(out,'index.html'));
  await page.waitForFunction(()=>!!document.querySelector<HTMLIFrameElement>('#screen')?.contentDocument?.querySelector('[data-target="operating"]'));
  await page.locator('#frame').evaluate(element=>{(element as HTMLInputElement).value='30';element.dispatchEvent(new Event('input'));});
  await page.waitForTimeout(50);
  await page.locator('#edit-toggle').click();
  const target=page.frameLocator('#screen').locator('[data-target="operating"]');
  await target.click();
  const box=await target.boundingBox();assert(box);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+30,box.y+box.height/2+18,{steps:5});
  await page.mouse.up();
  await page.locator('#scale-up').click();await page.locator('#export-patch').click();
  const patch=JSON.parse(await page.locator('#patch-output').inputValue()) as {projectId:string;baseSnapshotHash:string;changes:{targetId:string;translateX:number;translateY:number;scale:number}[]};
  assert.equal(patch.projectId,'synthetic');assert.equal(patch.baseSnapshotHash,report.snapshotHash);
  const change=patch.changes.find(value=>value.targetId==='operating');assert(change);
  const frameScale=(await page.locator('#stage').evaluate(element=>element.clientWidth))/1080,expectedX=30/frameScale,expectedY=18/frameScale;
  assert(Math.abs(change.translateX-expectedX)<=2);assert(Math.abs(change.translateY-expectedY)<=2);assert.equal(change.scale,1.02);
  const next=applyVisualPatch(parseProject(p),patch);
  assert.match(visualAdjustmentCss(next,'cash'),/translate:[0-9.]+px [0-9.]+px;scale:1\.02/);
 }finally{await browser.close();}
});
