import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createLook} from '../src/production/look.js';
import {productionFixture} from './production-fixture.js';

test('look renders sample frames, checks order-independent determinism and writes a contact sheet',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'look-'));t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(path.join(root,'inputs'));
 const project={...productionFixture(),width:1080,height:1440,fps:60};
 const manifest=path.join(root,'project.json');await writeFile(manifest,JSON.stringify(project));
 const output=path.join(root,'look'),report=await createLook(manifest,output);
 assert.equal(report.deterministic,true);assert.equal(report.approvalGranted,false);assert.equal(report.encodedMp4,false);assert.equal(report.backgroundVideoExcluded,false);
 assert.deepEqual(report.frames.map(frame=>frame.frame),[0,45,89]);assert.equal(report.frames.length,3);assert.deepEqual(report.issues,[]);assert.deepEqual(report.mismatches,[]);
 for(const frame of report.frames){assert((await stat(frame.file)).size>0);assert.equal(frame.file,path.join(output,'frames',`${frame.sceneId}-${String(frame.frame).padStart(6,'0')}.png`));}
 assert((await stat(path.join(output,'sheet.png'))).size>0);const saved=JSON.parse(await readFile(path.join(output,'look.json'),'utf8'));assert.equal(saved.deterministic,true);
});

test('look records layout failures and still writes diagnostic frames',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'look-layout-'));t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(path.join(root,'inputs'));
 const base=productionFixture(),project={...base,width:1080,height:1440,fps:60,cues:[{...base.cues[0]!,text:'长'.repeat(180)}]};
 const manifest=path.join(root,'project.json');await writeFile(manifest,JSON.stringify(project));
 const report=await createLook(manifest,path.join(root,'look'));
assert.equal(report.frames.length,3);assert(report.issues.some(issue=>issue.code==='layout_check'));assert.equal(report.deterministic,true);
 assert(JSON.parse(await readFile(path.join(root,'look','look.json'),'utf8')).issues.length>0);
});
test('look still writes an issue report when every frame fails before rendering',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'look-error-'));t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(path.join(root,'inputs'));
 const base=productionFixture(),project={...base,width:1080,height:1440,fps:60,events:[],scenes:[{...base.scenes[0]!,template:'process',data:{items:[{id:'a',label:'word '.repeat(15).trim(),detail:'detail '.repeat(25).trim()},{id:'b',label:'branch '.repeat(11).trim(),detail:'evidence '.repeat(25).trim()}]},presentation:{layout:'explanation',chapterLabel:'Mechanism',processStyle:'chain'}}]};
 const manifest=path.join(root,'project.json');await writeFile(manifest,JSON.stringify(project));
 const report=await createLook(manifest,path.join(root,'look'));
 assert.deepEqual(report.frames,[]);assert.equal(report.contactSheet,null);assert(report.issues.length>0);assert.equal(report.deterministic,false);
 assert((await readFile(path.join(root,'look','look.json'),'utf8')).includes('process_diagram_density'));
});
