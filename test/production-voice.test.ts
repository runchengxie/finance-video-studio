import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,access} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {generateVoice,voiceChunks,padVoiceClip} from '../src/production/voice.js';
import {mediaTool} from '../src/production/media.js';
import {renderVoicedProductionDemo} from '../src/production/render.js';
import {writeJson,hashFile} from '../src/production/project-io.js';
import {productionFixture} from './production-fixture.js';
test('financial decimal points stay inside a single spoken phrase and cue bounds remain valid',()=>{
 const chunks=voiceChunks('Revenue rose 1.5%. The yield is 9.675%. 每份净值1.03元。','en');
 assert.ok(chunks.some(x=>x.includes('1.5%')));assert.ok(chunks.some(x=>x.includes('9.675%')));assert.ok(chunks.some(x=>x.includes('1.03元')));
 assert.ok(voiceChunks('A sentence with many words. '.repeat(30),'en').every(x=>x.length<=180));
 assert.ok(voiceChunks('中'.repeat(179)+'1.5%的增长。','zh').some(x=>x.includes('1.5%')));
});
test('proposed frame lengths match actual padded audio rather than accumulating rounding drift',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'studio-voice-padding-')),raw=path.join(dir,'raw.wav'),aligned=path.join(dir,'aligned.wav');
 assert.ok(mediaTool('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=1.01','-c:a','pcm_s16le',raw]).ok);
 const duration=(file:string)=>Number((JSON.parse(mediaTool('ffprobe',['-v','error','-show_entries','format=duration','-of','json',file]).stdout) as {format:{duration:string}}).format.duration);
 const frames=Math.ceil(duration(raw)*30);assert.ok(Math.abs(duration(raw)-frames/30)>.02);
 await padVoiceClip(raw,aligned,frames);assert.ok(Math.abs(duration(aligned)-frames/30)<1/48000);
});
test('voice execution is explicit, local and never mutates original inputs',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'studio-voice-')),manifest=path.join(dir,'project.json'),out=path.join(dir,'voice');await writeJson(manifest,productionFixture());const before=await hashFile(manifest);
 await assert.rejects(()=>generateVoice(manifest,{voice:'NoSuchVoice',output:out,executeLocal:false}),/explicit_local_execution_required/);
 await assert.rejects(()=>renderVoicedProductionDemo(out,'NoSuchVoice',false),/explicit_local_execution_required/);
 await assert.rejects(()=>generateVoice(manifest,{voice:'NoSuchVoice',output:out,executeLocal:true}),process.platform==='win32'?/unavailable_voice/:/windows_required/);
 await assert.rejects(()=>access(out));assert.equal(await hashFile(manifest),before);
});
