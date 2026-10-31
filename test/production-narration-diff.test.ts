import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {initializeProject,readProject} from '../src/production/project-io.js';
import {compareNarrations} from '../src/production/narration-diff.js';

test('narration alignment isolates insertions, timing and financial changes with immutable escaped reports',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'narration-diff-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await initializeProject(path.join(root,'project'));const file=path.join(root,'project/project.json'),p=await readProject(file);
 const before={...p,cues:[{id:'a',text:'Revenue in 2025 rose 10%.',startFrame:0,endFrame:20},{id:'b',text:'<script>profit</script> follows.',startFrame:40,endFrame:60},{id:'c',text:'The end.',startFrame:70,endFrame:90}]};
 const after={...before,cues:[{id:'a',text:'Revenue in 2026 rose 12%.',startFrame:0,endFrame:20},{id:'new',text:'An added sentence.',startFrame:20,endFrame:30},{id:'b',text:'<script>profit</script> follows.',startFrame:40,endFrame:65},{id:'c',text:'The end.',startFrame:70,endFrame:90}]};
 const a=path.join(root,'before.json'),b=path.join(root,'after.json');await writeFile(a,JSON.stringify(before));await writeFile(b,JSON.stringify(after));const original=await readFile(a,'utf8');
 const report=await compareNarrations(a,b,path.join(root,'report'));
 assert.deepEqual(report.changes.map(x=>x.kind),['changed','added','retimed']);assert.equal(report.manualListening,false);assert.equal(report.factualVerification,false);
 assert.ok(report.changes[0]!.sensitiveChanges.numbers);assert.deepEqual(report.changes[0]!.beforeSceneIds,['draft']);
 assert.equal(report.voice.status,'no_audio');assert.equal(await readFile(a,'utf8'),original);
 const html=await readFile(path.join(root,'report/index.html'),'utf8');assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>profit'));
 await assert.rejects(()=>compareNarrations(a,b,path.join(root,'report')),/EEXIST/);
});

test('changed audio hash with equal transcript requires retranscription and duration metadata is compared',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'narration-audio-'));t.after(()=>rm(root,{recursive:true,force:true}));await initializeProject(path.join(root,'p'));
 const p=await readProject(path.join(root,'p/project.json'));const before={...p,inputs:[{id:'voice',path:'inputs/voice.wav',mediaType:'audio',sha256:'a'.repeat(64),provenance:'Original',rights:'Owned'}],render:{...p.render,audioId:'voice'}};
 const after={...before,inputs:[{...before.inputs[0]!,sha256:'b'.repeat(64)}],durationFrames:120,scenes:[{...p.scenes[0]!,durationFrames:120}]};
 const a=path.join(root,'a.json'),b=path.join(root,'b.json');await writeFile(a,JSON.stringify(before));await writeFile(b,JSON.stringify(after));const report=await compareNarrations(a,b,path.join(root,'out'));
 assert.equal(report.voice.requiresRetranscription,true);assert.equal(report.duration.changed,true);assert.equal(report.duration.afterSeconds,4);
});

test('deleted cue does not cascade into renumbered exact-text matches and large alignment is bounded',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'narration-bound-'));t.after(()=>rm(root,{recursive:true,force:true}));await initializeProject(path.join(root,'p'));const p=await readProject(path.join(root,'p/project.json'));
 const a=path.join(root,'a.json'),b=path.join(root,'b.json');
 const cues=[{id:'old-a',text:'Opening',startFrame:0,endFrame:20},{id:'old-b',text:'Delete me',startFrame:20,endFrame:40},{id:'old-c',text:'Closing',startFrame:40,endFrame:60}];
 await writeFile(a,JSON.stringify({...p,cues}));await writeFile(b,JSON.stringify({...p,cues:[{...cues[0]!,id:'new-a'},{...cues[2]!,id:'new-b'}]}));const report=await compareNarrations(a,b,path.join(root,'out'));assert.deepEqual(report.changes.map(c=>c.kind),['removed']);
 const many=Array.from({length:2100},(_,i)=>({id:`cue-${i}`,text:`Line ${i}`,startFrame:i*2,endFrame:i*2+2}));const large={...p,durationFrames:4200,scenes:[{...p.scenes[0]!,durationFrames:4200}],cues:many};await writeFile(a,JSON.stringify(large));await writeFile(b,JSON.stringify(large));await assert.rejects(()=>compareNarrations(a,b,path.join(root,'large')),/alignment_size_limit/);
});
