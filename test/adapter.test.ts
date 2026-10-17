import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createReview,status,approve} from '../src/review.js';
import {demoFixture,assertSyntheticFixture} from '../src/demo.js';
import {adapterConfigSchema,runLocal,saveReview,loadReview} from '../src/review-io.js';
import {render} from '../src/render.js';
test('default manual route stays pending and rendering refuses it before creating output',async()=>{
 const draft=await demoFixture('bar-smoke'),r=createReview(draft);
 const same=await runLocal(r,adapterConfigSchema.parse({}),false);
 assert.equal(status(same),'pending_execution');
 await assert.rejects(()=>render(draft,path.join(tmpdir(),'must-not-render-pending'),undefined,same),/approval/);
});
test('synthetic entry is pinned and cannot accept an edited or real manuscript',async()=>{
 const p=await demoFixture('demo');assert.doesNotThrow(()=>assertSyntheticFixture(p));
 p.fictional=false;assert.throws(()=>assertSyntheticFixture(p),/require review/);
 p.fictional=true;p.title='Arbitrary manuscript';assert.throws(()=>assertSyntheticFixture(p));
});
test('external adapter only runs after explicit local trigger; synthetic stub does not claim human-writing use',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'finance-adapter-'));
 const skill=path.join(directory,'SKILL.md'),command=path.join(directory,'stub.mjs'),marker=path.join(directory,'executed');
 await writeFile(skill,'Synthetic test instructions. Not the human-writing skill.');
 await writeFile(command,`import fs from 'node:fs';const r=JSON.parse(fs.readFileSync(0,'utf8'));fs.writeFileSync(process.argv[2],'yes');process.stdout.write(JSON.stringify({inputHash:r.inputHash,decision:'accepted',polished:r.draft,changeNotes:'Synthetic protocol test only',skillUse:'not_used'}));`);
 const config=adapterConfigSchema.parse({mode:'local_command',command:process.execPath,args:[command,marker],skillPath:skill});
 const r=createReview(await demoFixture('bar-smoke'));
 await assert.rejects(()=>runLocal(r,config,false),/explicit/);await assert.rejects(()=>readFile(marker));
 const result=await runLocal(r,config,true);
 assert.equal(await readFile(marker,'utf8'),'yes');assert.equal(result.execution,'local_adapter');assert.equal(result.skillUse,'not_used');assert.equal(status(result),'awaiting_approval');
 const approved=approve(result,{reviewer:'Synthetic test',factReviewNotes:'Synthetic fixture only',expiresAt:new Date(Date.now()+86400000).toISOString()});
 assert.equal(status(await runLocal(approved,adapterConfigSchema.parse({}),false)),'pending_execution');
 const file=path.join(directory,'pending.json');await saveReview(file,r);
 assert.deepEqual(await loadReview(file),r);await assert.rejects(()=>saveReview(file,result),/EEXIST/);
 await writeFile(file,JSON.stringify({status:'approved',review:r}));assert.equal(status(await loadReview(file)),'pending_execution');
 await assert.rejects(()=>runLocal(r,{...config,command:path.join(directory,'missing-executable')},true));
 assert.equal(status(r),'pending_execution');
 await assert.rejects(()=>runLocal(r,{...config,extraTerms:['new-policy']},true),/policy/);
});
