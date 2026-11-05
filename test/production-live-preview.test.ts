import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {chromium} from 'playwright';
import {productionFixture} from './production-fixture.js';
import {mediaTool} from '../src/production/media.js';
import {hashFile} from '../src/production/project-io.js';
import {createLivePreview} from '../src/production/live-preview.js';

test('live inspection reuses shared resources and draws native intermediate frames offline',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'native-preview-'));t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(path.join(root,'inputs'));
 const p={...productionFixture(),title:'Fictional < 5% </script> \\ boundary',width:1080,height:1440,fps:60};const file=path.join(root,'project.json');await writeFile(file,JSON.stringify(p));
 const cache=path.join(root,'shared-assets'),first=path.join(root,'one'),second=path.join(root,'two');await createLivePreview(file,first,cache);const resources=await readdir(cache);await createLivePreview(file,second,cache);assert.deepEqual(await readdir(cache),resources);assert.equal(resources.length,2);
 assert.equal(JSON.parse(await readFile(path.join(first,'preview.json'),'utf8')).encodedMp4,false);await assert.rejects(()=>createLivePreview(file,first,cache),/EEXIST/);
 const browser=await chromium.launch();try{
  const page=await browser.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto('file://'+path.join(first,'index.html'));
  await page.waitForFunction(()=>!!document.querySelector<HTMLIFrameElement>('#screen')?.contentDocument?.querySelector('.rail'));
  await page.locator('#frame').evaluate(el=>{(el as HTMLInputElement).value='7';el.dispatchEvent(new Event('input'));});
  await page.waitForFunction(()=>document.querySelector<HTMLInputElement>('#frame')?.value==='7');await page.waitForTimeout(50);
  const transform=await page.locator('#screen').evaluate(el=>(el as HTMLIFrameElement).contentDocument!.querySelector<HTMLElement>('.fill')!.style.transform);assert.notEqual(transform,'scaleX(1)');assert.notEqual(transform,'scaleX(0)');
  assert.equal(await page.locator('#title').textContent(),p.title);assert.equal(await page.locator('#language').inputValue(),'en');await page.locator('#language').selectOption('zh');assert((await page.locator('#notice').textContent())!.includes('仅供内部检查'));
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
 const asset=path.join(cache,resources[0]!);await writeFile(asset,'tampered resource');await assert.rejects(()=>createLivePreview(file,path.join(root,'bad'),cache),/preview_asset_hash_mismatch/);
});


test('live narration and source-cut controls play real synthetic audio without copying it',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'native-preview-audio-'));t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(path.join(root,'inputs'));
 const original=path.join(root,'inputs/original.wav'),cut=path.join(root,'inputs/cut.wav');
 assert(mediaTool('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=440:duration=2','-c:a','pcm_s16le',original]).ok);
 assert(mediaTool('ffmpeg',['-v','error','-i',original,'-ss','0.5','-t','1','-c:a','pcm_s16le',cut]).ok);
 const base=productionFixture(),p={...base,width:1080,height:1440,fps:60,durationFrames:60,scenes:[{...base.scenes[0]!,durationFrames:60}],cues:[{...base.cues[0]!,endFrame:60}],events:[...base.events,{...base.events[0]!,id:'equipment',targetId:'equipment',offsetFrames:20}],
  inputs:[{id:'original',path:'inputs/original.wav',mediaType:'audio',sha256:await hashFile(original),provenance:'Generated synthetic tone',rights:'Original synthetic fixture'},{id:'cut',path:'inputs/cut.wav',mediaType:'audio',sha256:await hashFile(cut),provenance:'Synthetic 0.5 to 1.5 second interval',rights:'Original synthetic fixture'}],
  render:{...base.render,theme:'broadcast-v1',broadcast:{programName:'Synthetic desk'},audioId:'cut',visual:{preset:'warm-paper',motion:'subtle'}},
  productionProfile:{id:'portrait-explainer-v1',audioEdit:{decision:'trim',sourceAudioId:'original',outputAudioId:'cut',startSeconds:.5,endSeconds:1.5,notes:'Synthetic tone interval; not human listening or approval.'}}};
 const file=path.join(root,'project.json');await writeFile(file,JSON.stringify(p));const out=path.join(root,'preview');const report=await createLivePreview(file,out);assert.equal(report.copiedAudio,false);assert.deepEqual(report.profileIssues,[]);
 const browser=await chromium.launch();try{
  const page=await browser.newPage();await page.route(/^https?:/,r=>r.abort());await page.goto('file://'+path.join(out,'index.html'));
  await page.waitForFunction(()=>!document.querySelector<HTMLButtonElement>('#intro')!.disabled&&document.querySelector<HTMLAudioElement>('#voice')!.readyState>0);
  await page.locator('#intro').click();await page.waitForFunction(()=>document.querySelector<HTMLAudioElement>('#source')!.currentTime>0);
  assert.equal(await page.locator('#source').evaluate(el=>(el as HTMLAudioElement).paused),false);
  await page.locator('#voice').evaluate(el=>(el as HTMLAudioElement).play());await page.waitForFunction(()=>document.querySelector<HTMLAudioElement>('#voice')!.currentTime>.05);
  assert.equal(await page.locator('#source').evaluate(el=>(el as HTMLAudioElement).paused),true);
  await page.locator('#source').evaluate(el=>(el as HTMLAudioElement).play());await page.waitForFunction(()=>document.querySelector<HTMLAudioElement>('#voice')!.paused);
  await page.locator('#outro').click();assert.equal(await page.locator('#voice').evaluate(el=>(el as HTMLAudioElement).paused),true);
 }finally{await browser.close();}
 assert(!(await readdir(out)).some(name=>name.endsWith('.wav')||name.endsWith('.mp4')));
});

test('portrait preview shares verified conceptual artwork and displays it offline',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'native-preview-art-'));t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(path.join(root,'inputs'));
 const image=path.join(root,'inputs/art.png');assert(mediaTool('ffmpeg',['-v','error','-f','lavfi','-i','color=c=tan:s=64x64','-frames:v','1',image]).ok);
 const base=productionFixture(),p={...base,width:1080,height:1440,fps:60,inputs:[{id:'art',path:'inputs/art.png',mediaType:'image',sha256:await hashFile(image),provenance:'Synthetic color',rights:'Original fixture'}],scenes:[{...base.scenes[0]!,template:'process',data:{items:[{id:'operating',label:'Customer',detail:'Pays'},{id:'equipment',label:'Company',detail:'Receives'}]},presentation:{layout:'explanation',chapterLabel:'Mechanism',processStyle:'chain',illustration:{inputId:'art',label:'Generated concept'}}}]};
 const file=path.join(root,'project.json');await writeFile(file,JSON.stringify(p));const cache=path.join(root,'shared'),out=path.join(root,'first');await createLivePreview(file,out,cache);const resources=await readdir(cache);assert.equal(resources.length,3);await createLivePreview(file,path.join(root,'second'),cache);assert.deepEqual(await readdir(cache),resources);assert(!(await readdir(out)).some(n=>n.endsWith('.png')));
 const browser=await chromium.launch();try{const page=await browser.newPage();await page.route(/^https?:/,r=>r.abort());await page.goto('file://'+path.join(out,'index.html'));await page.waitForFunction(()=>{const img=document.querySelector<HTMLIFrameElement>('#screen')?.contentDocument?.querySelector<HTMLImageElement>('.concept-art img');return !!img&&img.naturalWidth===64;});}finally{await browser.close();}
 await writeFile(image,'tampered');await assert.rejects(()=>createLivePreview(file,path.join(root,'bad'),cache),/input_hash_mismatch/);
});
