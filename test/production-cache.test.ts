import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseProject} from '../src/production/manifest.js';
import {productionFixture} from './production-fixture.js';
import {compileStages} from '../src/production/stages.js';
import {cacheKey,readCache,publishCache} from '../src/production/cache.js';
import {mediaTool} from '../src/production/media.js';
import {mkdtemp,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
test('stages partition event spans and holds without gaps or lost events',()=>{
 const p=parseProject(productionFixture());p.events.push({...p.events[0]!,id:'second',offsetFrames:40,action:'highlight'});
 const stages=compileStages(p);assert.equal(stages[0]!.from,0);assert.equal(stages.at(-1)!.to,90);
 for(let i=1;i<stages.length;i++)assert.equal(stages[i]!.from,stages[i-1]!.to);
 assert.deepEqual(stages.filter(s=>s.kind==='animation').map(s=>s.from),[0,40]);
 const fp={stage:stages[0]!,snapshot:'a',tools:{ffmpeg:'one',browser:'one'},settings:p.render};
 for(const key of ['snapshot','tools','settings'] as const)assert.notEqual(cacheKey(fp),cacheKey({...fp,[key]:'changed'}));
});
test('verified cache rejects tampered expectations and corrupt bytes',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'studio-cache-media-')),key='b'.repeat(64),temp=path.join(dir,'new.partial.mp4');
 const result=mediaTool('ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=size=320x180:rate=30:duration=0.2','-c:v','libx264','-pix_fmt','yuv420p',temp]);assert.ok(result.ok);
 const expected={width:320,height:180,fps:30,frames:6,durationSeconds:.2,videoCodec:'h264',pixelFormat:'yuv420p',audio:{required:false}};
 await publishCache(dir,key,temp,expected);assert.equal((await readCache(dir,key,expected)).hit,true);
 assert.equal((await readCache(dir,key,{...expected,frames:7})).reason,'expectations_mismatch');
 await writeFile(path.join(dir,`${key}.mp4`),'truncated');assert.equal((await readCache(dir,key,expected)).hit,false);
});
test('cache without matching receipt is a miss',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'studio-cache-'));const key='a'.repeat(64);
 assert.equal((await readCache(dir,key)).hit,false);await writeFile(path.join(dir,`${key}.mp4`),'partial');
 assert.equal((await readCache(dir,key)).hit,false);
 await writeFile(path.join(dir,`${key}.json`),JSON.stringify({key,sha256:'bad'}));assert.equal((await readCache(dir,key)).hit,false);
});
