import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {parseProject} from '../src/production/manifest.js';
import {hashFile} from '../src/production/project-io.js';
import {broadcastFixture} from './broadcast-fixture.js';
import {mediaTool} from '../src/production/media.js';

test('visual loader decodes verified raster bytes and rejects corrupt, oversized, renamed and changed inputs',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'visual-loader-'));
 try{
  const {loadVisualAssets}=await import('../src/production/visual-assets.js');
  await mkdir(path.join(root,'inputs'));const p=parseProject(broadcastFixture());p.inputs=p.inputs.filter(x=>x.id==='page');delete p.render.broadcast!.backgroundVideoId;
  const file=path.join(root,'inputs/page.png'),manifest=path.join(root,'project.json');
  assert.ok(mediaTool('ffmpeg',['-v','error','-f','lavfi','-i','color=white:s=100x80','-frames:v','1',file]).ok);
  p.inputs[0]!.sha256=await hashFile(file);assert.match((await loadVisualAssets(manifest,p)).get('page')!,/^data:image\/png;base64,/);
  await writeFile(file,'not an image');await assert.rejects(loadVisualAssets(manifest,p),/hash/);
  p.inputs[0]!.sha256=await hashFile(file);await assert.rejects(loadVisualAssets(manifest,p),/image/);
  await writeFile(file,Buffer.alloc(21*1024*1024));await assert.rejects(loadVisualAssets(manifest,p),/size/);
  assert.ok(mediaTool('ffmpeg',['-v','error','-y','-f','lavfi','-i','color=white:s=4100x2','-frames:v','1',file]).ok);
  p.inputs[0]!.sha256=await hashFile(file);await assert.rejects(loadVisualAssets(manifest,p),/dimensions/);
  assert.ok(mediaTool('ffmpeg',['-v','error','-y','-f','lavfi','-i','color=white:s=100x80','-frames:v','1','-c:v','mjpeg','-f','image2',file]).ok);
  p.inputs[0]!.sha256=await hashFile(file);await assert.rejects(loadVisualAssets(manifest,p),/image_type/);
 }finally{await rm(root,{recursive:true,force:true});}
});
