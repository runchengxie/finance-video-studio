import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {adaptHistorical} from '../src/production/adapt.js';
import {writeJson,hashFile,readProject} from '../src/production/project-io.js';
import {loadProductionReview} from '../src/production/review-io.js';
import {productionReviewStatus} from '../src/production/review.js';
import {withLegacySnapshot,legacyJson} from '../src/production/adapters/io.js';
test('legacy parsing binds the exact bytes used for the mapped values',async()=>{
 const dir=await root(),file=path.join(dir,'src/data.json');await writeJson(file,{value:1});const before=await hashFile(file);
 const result=await withLegacySnapshot(async()=>{const value=await legacyJson(dir,'src/data.json');await writeFile(file,'{"value":2}');return value;});
 assert.deepEqual(result.value,{value:1});assert.equal([...result.hashes.values()][0],before);assert.notEqual(await hashFile(file),before);
});
async function root(){const dir=await mkdtemp(path.join(os.tmpdir(),'studio-adapt-'));await mkdir(path.join(dir,'src'));await mkdir(path.join(dir,'public'));return dir;}
test('fixed cashflow adaptation copies known inputs and preserves source bytes without inherited approval',async()=>{
 const dir=await root();await writeJson(path.join(dir,'src/data.json'),{quarter:'2026 Q2',unit:'units',operating:100,capex:30,dividends:10,otherInvesting:0,otherFinancing:0,fx:0,cashIncrease:60,source:'https://example.org/source',page:4});
 await writeJson(path.join(dir,'src/segments.json'),[{start:0,duration:3,text:'Synthetic cashflow.',file:'voice-0.wav',rawDuration:2,tempo:1}]);await writeFile(path.join(dir,'public/narration.wav'),'synthetic bytes');
 const before=await hashFile(path.join(dir,'src/data.json')),dest=path.join(path.dirname(dir),`${path.basename(dir)}-adapted`),report=await adaptHistorical('fixed-sample',dir,dest);
 assert.equal(report.status,'pending_review');assert.equal(await hashFile(path.join(dir,'src/data.json')),before);
 for(const item of report.inputs)assert.equal(item.sourceSha256,await hashFile(path.join(dest,item.destination)));
 assert.equal(productionReviewStatus(await loadProductionReview(report.pendingReviewPath)),'pending_execution');assert.equal((await readProject(report.projectPath)).render.audioId,'narration');
 await assert.rejects(()=>adaptHistorical('fixed-sample',dir,dest));
});
test('full timeline preserves captions and reports unknown visual features as blocking',async()=>{
 const dir=await root();await writeJson(path.join(dir,'src/facts.json'),{sources:{S1:{title:'Synthetic source',url:'https://example.org'}}});
 await writeJson(path.join(dir,'src/scenes.json'),[{id:'scene',chapter:'One',kind:'unknown-visual',title:'Synthetic title',kicker:'Synthetic qualifier',text:'Synthetic paragraph',sources:['S1']}]);
 await writeJson(path.join(dir,'src/timeline.json'),[{index:0,id:'scene',from:0,durationInFrames:90,audio:'scene-00.wav',chapter:'One'}]);
 await writeJson(path.join(dir,'src/captions.json'),[{scene:0,startFrame:0,endFrame:90,text:'Synthetic paragraph',spokenText:'Synthetic paragraph',file:'00-00.wav'}]);await writeFile(path.join(dir,'public/scene-00.wav'),'synthetic audio');
 const report=await adaptHistorical('full-timeline',dir,dir+'-adapted');assert.equal(report.readyForEditorialApproval,false);assert.ok(report.unsupportedFeatures.some(x=>x.includes('unknown-visual')));
 const project=await readProject(report.projectPath);assert.equal(project.cues[0]!.text,'Synthetic paragraph');assert.ok(project.events.some(e=>e.precision==='unresolved'));assert.ok((await readFile(report.pendingReviewPath,'utf8')).includes('pending'));
});
test('mapped full-film waterfall retains its original qualifier for review',async()=>{
 const dir=await root();await writeJson(path.join(dir,'src/facts.json'),{unit:'units',q3:{operating:100,capex:30,dividends:10,investingNet:-30,financingNet:-10,fx:0,cashIncrease:60},sources:{S1:{title:'Synthetic',url:'https://example.org'}}});
 await writeJson(path.join(dir,'src/scenes.json'),[{id:'cash',chapter:'One',kind:'waterfall',title:'Cash bridge',kicker:'Includes FX; not free cash flow',text:'Synthetic paragraph',sources:['S1']}]);
 await writeJson(path.join(dir,'src/timeline.json'),[{index:0,id:'cash',from:0,durationInFrames:90,audio:'scene-00.wav',chapter:'One'}]);
 await writeJson(path.join(dir,'src/captions.json'),[{scene:0,startFrame:0,endFrame:90,text:'Synthetic paragraph',spokenText:'Synthetic paragraph',file:'00-00.wav'}]);await writeFile(path.join(dir,'public/scene-00.wav'),'synthetic audio');
 const report=await adaptHistorical('full-timeline',dir,dir+'-adapted'),p=await readProject(report.projectPath);assert.equal(p.scenes[0]!.template,'waterfall');assert.ok(p.scenes[0]!.sourceIds.some(id=>p.sources.find(s=>s.id===id)?.citation.includes('Includes FX; not free cash flow')));
});
test('external audio imports only exact bound bytes and preserves legacy round-to-frame behavior',async()=>{
 const dir=await root(),audio=path.join(dir,'selected.wav');await writeFile(audio,'synthetic audio');
 await writeJson(path.join(dir,'src/facts.json'),{unit:'units',operating:30,capex:100,gap:70,sources:{S1:'https://example.org'}});
 await writeJson(path.join(dir,'src/scenes.json'),[{index:0,cue:1,kind:'cash',phase:0,title:'Title',subtitle:'Only this reporting period; not a profit measure',from:0,chapter:'One',frames:90}]);
 await writeJson(path.join(dir,'src/cues.json'),[{id:1,start:0,end:1.033,text:'First'},{id:2,start:1.033,end:3,text:'Second'}]);
 await writeJson(path.join(dir,'production-authorization.json'),{version:1,inputs:[{file:audio,sha256:await hashFile(audio)}]});
 const report=await adaptHistorical('external-audio',dir,dir+'-adapted'),p=await readProject(report.projectPath);assert.equal(p.cues[0]!.endFrame,31);assert.equal(p.cues[1]!.startFrame,31);assert.ok(report.differences.some(x=>x.includes('round')));
 assert.equal(p.scenes[0]!.template,'comparison');assert.ok(p.scenes[0]!.sourceIds.some(id=>p.sources.find(s=>s.id===id)?.citation.includes('Only this reporting period; not a profit measure')));
 await writeFile(audio,'changed');await assert.rejects(()=>adaptHistorical('external-audio',dir,dir+'-changed'),/hash/);
});
