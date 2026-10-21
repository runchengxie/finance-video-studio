import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {parseProject} from '../src/production/manifest.js';import {compileStages} from '../src/production/stages.js';
import {productionFixture} from './production-fixture.js';import {mediaTool} from '../src/production/media.js';
import {verifyMedia} from '../src/production/verify.js';

test('broadcast entrance is animated then held and caption boundaries remain exact',()=>{
 const p=parseProject(productionFixture());p.events=[];p.render.theme='broadcast-v1';p.render.broadcast={programName:'Test'};
 assert.deepEqual(compileStages(p).map(x=>[x.from,x.to,x.kind]),[[0,18,'animation'],[18,90,'hold']]);
});
test('background advances during holds and retains its global phase across segments and loops',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'broadcast-motion-'));
 try{
  const {encodeStage,inspectBackground}=await import('../src/production/encoding.js');
  const bg=path.join(root,'bg.mp4'),frames=path.join(root,'frames');await mkdir(frames);
  assert.ok(mediaTool('ffmpeg',['-v','error','-f','lavfi','-i',"nullsrc=s=1920x1080:r=30:d=2,geq=lum='16+N*3':cb=128:cr=128",'-c:v','libx264','-crf','18','-pix_fmt','yuv420p',bg]).ok);
  assert.ok(mediaTool('ffmpeg',['-v','error','-f','lavfi','-i','color=black@0:s=1920x1080,format=rgba','-frames:v','1',path.join(frames,'000000.png')]).ok);
  const background=await inspectBackground(bg);
  const sample=(file:string,frame:number)=>execFileSync(process.env.FFMPEG_PATH??'ffmpeg',['-v','error','-i',file,'-vf',`select=eq(n\\,${frame}),scale=1:1`,'-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','-'],{windowsHide:true})[0]!;
  for(const from of [18,45,65]){
   const out=path.join(root,`stage-${from}.mp4`);encodeStage({id:'test',sceneId:'scene',from,to:from+15,kind:'hold'},frames,out,18,background);
   assert.ok(Math.abs(sample(out,0)-sample(bg,from%60))<8,`start ${from}: ${sample(out,0)} / ${sample(bg,from%60)}`);assert.ok(Math.abs(sample(out,14)-sample(bg,(from+14)%60))<8,`end ${from}: ${sample(out,14)} / ${sample(bg,(from+14)%60)}`);
   assert.notEqual(sample(out,0),sample(out,14));
   const report=await verifyMedia(out,{width:1920,height:1080,fps:30,frames:15,durationSeconds:.5,videoCodec:'h264',pixelFormat:'yuv420p',audio:{required:false},colorRange:'tv',colorSpace:'bt709',colorTransfer:'bt709',colorPrimaries:'bt709'});assert.ok(report.ok,JSON.stringify(report.checks));
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
