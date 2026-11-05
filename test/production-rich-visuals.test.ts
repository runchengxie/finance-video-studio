import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseProject} from '../src/production/manifest.js';
import {sceneHtml} from '../src/production/templates.js';
import {productionFixture} from './production-fixture.js';
import {visualStageFingerprint} from '../src/production/visual-fingerprint.js';
import {compileStages} from '../src/production/stages.js';
function fixture(){const b=productionFixture();return {...b,width:1080,height:1440,fps:60,inputs:[{id:'art',path:'inputs/art.png',mediaType:'image',sha256:'a'.repeat(64),provenance:'Synthetic art',rights:'Original'}],scenes:[{...b.scenes[0]!,template:'process',data:{items:[{id:'operating',label:'Customer',detail:'Pays for products'},{id:'equipment',label:'Company',detail:'Receives cash'}],links:[{fromId:'operating',toId:'equipment',label:'Cash'}]},presentation:{layout:'explanation',chapterLabel:'Mechanism',processStyle:'cycle',illustration:{inputId:'art',label:'Concept illustration'}}}],events:[...b.events,{...b.events[0]!,id:'next',targetId:'equipment',offsetFrames:30,durationFrames:14}]};}
test('portrait validates conceptual image and directed process endpoints',()=>{
 const p=fixture();assert.doesNotThrow(()=>parseProject(p));
 const wrong=structuredClone(p);wrong.scenes[0]!.data.links[0]!.toId='missing';assert.throws(()=>parseProject(wrong),/process_link_reference/);
 const image=structuredClone(p);image.inputs[0]!.mediaType='data';assert.throws(()=>parseProject(image),/unknown_illustration_image/);
});
test('artwork and traced process paths are deterministic, escaped and cache-bound',()=>{
 const p=parseProject(fixture()),assets=new Map([['art','data:image/png;base64,AA==']]);
 const html=sceneHtml(p,'cash',37,'','improved',assets);assert(html.includes('data-illustration="art"'));assert(html.includes('data-link="operating-equipment"'));assert(html.includes('stroke-dashoffset="0.125"'));
 assert.equal(sceneHtml(p,'cash',37,'','improved',assets),html);assert.notEqual(sceneHtml(p,'cash',30,'','improved',assets),html);
 assert.throws(()=>sceneHtml(p,'cash',37,''),/missing_illustration/);
 assert.throws(()=>sceneHtml(p,'cash',37,'','improved',new Map([['art','https://external.invalid/art.png']])),/unsafe_illustration/);
 const stage=compileStages(p)[0]!,q=structuredClone(p);q.inputs[0]!.sha256='b'.repeat(64);assert.notDeepEqual(visualStageFingerprint(p,stage,'r'),visualStageFingerprint(q,stage,'r'));
});

test('diagram text passes native layout checks and retains active emphasis',async()=>{
 const {capturePage,paint}=await import('../src/production/capture.js');
 const raw=fixture();delete (raw.scenes[0]!.presentation as {illustration?:unknown}).illustration;raw.events[0]!.action='highlight';
 const p=parseProject(raw),renderer=await capturePage();try{await paint(renderer.page,renderer.font,p,'cash',5);const filter=await renderer.page.locator('[data-target="operating"]').evaluate(el=>getComputedStyle(el).filter);assert.notEqual(filter,'none');}finally{await renderer.close();}
});

test('rich process diagrams reject sidebars that would clip the chart panel',()=>{
 const p=fixture();(p.scenes[0]!.presentation as {sidebar?:unknown}).sidebar=[{label:'Material caveat'}];assert.throws(()=>parseProject(p),/process_diagram_sidebar_density/);
});

test('landscape rejects directed links even without presentation metadata',()=>{
 const p=fixture();delete (p.scenes[0] as {presentation?:unknown}).presentation;p.width=1920;p.height=1080;p.fps=30;assert.throws(()=>parseProject(p),/process_links_require_portrait/);
});

test('portrait trend legend stays inside its panel and branch arrows reach node edges',async()=>{
 const {capturePage,paint}=await import('../src/production/capture.js');const raw=fixture();const process=parseProject(raw);const scene=process.scenes[0]!;assert.equal(scene.template,'process');
 const p=parseProject({...process,inputs:[],events:[],scenes:[{...scene,template:'trend',presentation:{layout:'wide-chart',chapterLabel:'History'},data:{unit:'USD million',series:[{id:'operating',label:'美的经营现金流净额',values:[{label:'2024',value:30},{label:'2025',value:40}]}]}}]});
 const renderer=await capturePage();try{const image=await renderer.page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;return canvas.toDataURL('image/png');});await paint(renderer.page,renderer.font,process,'cash',80,'improved',new Map([['art',image]]));await paint(renderer.page,renderer.font,p,'cash',80);}finally{await renderer.close();}
 raw.scenes[0]!.presentation.processStyle='branches';delete(raw.scenes[0]!.presentation as {illustration?:unknown}).illustration;raw.scenes[0]!.data.links=[{fromId:'equipment',toId:'operating',label:'Return'}];
 assert(sceneHtml(parseProject(raw),'cash',80,'').includes('d="M765 385H816V115H765"'));
});
