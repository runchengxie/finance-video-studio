import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {parseSrt,validateTimeline} from '../src/production/timeline.js';
import {exportTimeline} from '../src/production/subtitle-exports.js';
import {parseProject} from '../src/production/manifest.js';
import {productionFixture} from './production-fixture.js';

test('SRT conversion preserves short cues and rejects raw and rounded overlap',()=>{
 const cue=parseSrt('\uFEFF1\r\n00:00:00,001 --> 00:00:00,031\r\nline one\r\nline two\r\n',30)[0]!;
 assert.deepEqual([cue.startFrame,cue.endFrame,cue.text],[0,1,'line one\nline two']);
 assert.throws(()=>parseSrt('1\n00:00:00,001 --> 00:00:00,031\na\n\n2\n00:00:00,032 --> 00:00:00,065\nb',30),/rounded_cue_collision:cue-1:cue-2/);
 for(const t of ['bad','1\n00:99:00,000 --> 00:00:01,000\nx','1\n00:00:01,000 --> 00:00:00,000\nx'])assert.throws(()=>parseSrt(t,30));
 const p=productionFixture();assert.throws(()=>validateTimeline(parseProject({...p,events:[{...p.events[0],precision:'unresolved'}]})),/unresolved_event/);
});

test('timeline exports create-only escaped subtitles, chapters and storyboard',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'timeline-export-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const p=productionFixture();p.cues[0]!.text='{\\pos(0,0)} line\nsecond';
 const out=path.join(root,'new');await exportTimeline(parseProject(p),out);
 assert.match(await readFile(path.join(out,'subtitles.srt'),'utf8'),/00:00:00,000 --> 00:00:03,000/);
 const ass=await readFile(path.join(out,'scenes','cash.ass'),'utf8');assert.ok(!ass.includes('{\\pos(0,0)}'));
 assert.match(await readFile(path.join(out,'chapters.ffmeta'),'utf8'),/END=3000/);
 await assert.rejects(()=>exportTimeline(parseProject(p),out));
 const precise=parseProject({...p,events:[],cues:[{id:'one',text:'one',startFrame:0,endFrame:1},{id:'two',text:'two',startFrame:1,endFrame:2},{id:'three',text:'three',startFrame:2,endFrame:90}]});
 const exact=path.join(root,'exact');await exportTimeline(precise,exact);
 assert.deepEqual(parseSrt(await readFile(path.join(exact,'subtitles.srt'),'utf8'),30).map(c=>[c.startFrame,c.endFrame]),precise.cues.map(c=>[c.startFrame,c.endFrame]));
});

test('chapter metadata displays chapter labels while IDs remain stable',async()=>{
 const {chaptersMetadata}=await import('../src/production/subtitle-exports.js');
 const p=parseProject(productionFixture());p.scenes[0]!.presentation={layout:'explanation',chapterLabel:'费用观察'};
 assert.match(chaptersMetadata(p),/title=费用观察/);assert.equal(p.scenes[0]!.chapterId,'intro');
});
