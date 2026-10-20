import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {verifyMedia} from '../src/production/verify.js';

test('media verification counts, decodes and reports mismatches and allowed signal intervals',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'verify-media-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const file=path.join(root,'black.mp4');
 execFileSync(process.env.FFMPEG_PATH??'ffmpeg',['-v','error','-n','-f','lavfi','-i','color=black:s=320x180:r=30:d=1','-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t','1','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',file],{windowsHide:true});
 const expected={width:320,height:180,fps:30,frames:30,durationSeconds:1,videoCodec:'h264',pixelFormat:'yuv420p',audio:{required:true,codec:'aac'}};
 assert.equal((await verifyMedia(file,expected)).ok,true);
 const wrong=await verifyMedia(file,{...expected,width:640});assert.equal(wrong.ok,false);assert.ok(wrong.checks.some(c=>c.name==='width'&&!c.passed));
 const short=await verifyMedia(file,{...expected,audio:{required:true,codec:'aac',durationSeconds:2}});assert.ok(short.checks.some(c=>c.name==='audio_duration'&&!c.passed));
 const mismatched=await verifyMedia(file,{...expected,frames:31,audio:{required:false,codec:'opus'},chapters:[{title:'missing',startFrame:0,endFrame:30}]});
 for(const name of ['frames','audio_stream','audio_codec','chapter_count'])assert.ok(mismatched.checks.some(c=>c.name===name&&!c.passed),name);
 const scans={black:{minimumSeconds:.2,pixelThreshold:.02,pictureThreshold:.98,allowed:[]},silence:{minimumSeconds:.2,noiseDb:-60,allowed:[]},loudness:true};
 const unexpected=await verifyMedia(file,{...expected,scans});assert.equal(unexpected.ok,false);assert.ok(unexpected.scans.blackEvents.length>0);assert.ok(unexpected.scans.silenceEvents.length>0);
 const allowed=[{start:0,end:1.1}];assert.equal((await verifyMedia(file,{...expected,scans:{...scans,black:{...scans.black,allowed},silence:{...scans.silence,allowed}}})).ok,true);
 const corrupt=path.join(root,'corrupt.mp4');await writeFile(corrupt,'not a media file');const report=await verifyMedia(corrupt,expected);assert.equal(report.ok,false);assert.ok(report.checks.some(c=>c.name==='probe'&&!c.passed));
 assert.equal(report.manualListening,false);
});
