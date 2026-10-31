import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseProject} from '../src/production/manifest.js';
import {productionFixture} from './production-fixture.js';
import {frameStamp,parseSrt} from '../src/production/timeline.js';
import {visualStageFingerprint} from '../src/production/visual-fingerprint.js';
import {compileStages} from '../src/production/stages.js';

test('portrait is an explicit native 1080x1440/60 profile with correct timing',()=>{
 const p=parseProject({...productionFixture(),width:1080,height:1440,fps:60});assert.equal(p.fps,60);
 assert.equal(frameStamp(60,'srt','nearest',60),'00:00:01,000');
 assert.equal(parseSrt('1\n00:00:01,000 --> 00:00:02,000\nTest',60)[0]!.startFrame,60);
 assert.throws(()=>parseProject({...p,width:1920}));
});
test('visual stage fingerprints ignore internal/audio changes and invalidate affected scene text, style and assets',()=>{
 const base=productionFixture();const first={...base.scenes[0]!,id:'first',durationFrames:45},second={...base.scenes[0]!,id:'second',from:45,durationFrames:45};
 const p=parseProject({...base,scenes:[first,second],events:[],cues:[{id:'a',text:'First',startFrame:0,endFrame:45},{id:'b',text:'Second',startFrame:45,endFrame:90}]});
 const stages=compileStages(p),f=(project:typeof p,i:number)=>visualStageFingerprint(project,stages[i]!,'renderer');
 const q=structuredClone(p);q.cues[0]!.text='Revised';assert.notDeepEqual(f(p,0),f(q,0));assert.deepEqual(f(p,1),f(q,1));
 q.cues[0]!.text='First';q.internalNotes=[{id:'n',text:'Changed review note'}];assert.deepEqual(f(p,0),f(q,0));
 q.render.visual={preset:'warm-paper',motion:'subtle'};assert.notDeepEqual(f(p,0),f(q,0));
});

test('event cues outside a scene remain visual cache dependencies',()=>{
 const f=productionFixture(),p=parseProject({...f,durationFrames:120,scenes:[{...f.scenes[0]!,id:'first',durationFrames:60},{...f.scenes[0]!,id:'second',from:60,durationFrames:60}],cues:[{id:'a',text:'Earlier A',startFrame:0,endFrame:10},{id:'b',text:'Earlier B',startFrame:20,endFrame:30}],events:[{...f.events[0]!,id:'a-event',sceneId:'second',cueId:'a',targetId:'operating',offsetFrames:60,durationFrames:10},{...f.events[0]!,id:'b-event',sceneId:'second',cueId:'b',targetId:'equipment',offsetFrames:60,durationFrames:10}]});
 const q=structuredClone(p);q.cues=[{...p.cues[1]!,startFrame:0,endFrame:10},{...p.cues[0]!,startFrame:20,endFrame:30}];
 const stage=compileStages(p).find(s=>s.sceneId==='second')!;assert.notDeepEqual(visualStageFingerprint(p,stage,'renderer'),visualStageFingerprint(q,stage,'renderer'));
});

test('portrait preserves approved presentation text and active emphasis',async()=>{
 const {sceneHtml}=await import('../src/production/templates.js');
 const f=productionFixture(),p=parseProject({...f,width:1080,height:1440,fps:60,scenes:[{...f.scenes[0]!,presentation:{layout:'explanation',chapterLabel:'Chapter label',headline:'Approved headline',chartStyle:'values',sidebar:[{label:'Material caveat'}]}}],events:[{...f.events[0]!,action:'highlight'}]});
 const html=sceneHtml(p,'cash',5,'');for(const text of ['Material caveat','Approved headline','Chapter label'])assert(html.includes(text));assert(html.includes('brightness(1.3)'));assert(!html.includes('class="rail"'));
 assert.equal(sceneHtml(p,'cash',5,''),html);
});
