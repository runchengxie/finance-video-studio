import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createReviewPage,reviewPageHtml} from '../src/production/review-page.js';
import {parseProject} from '../src/production/manifest.js';
import {productionFixture} from './production-fixture.js';
test('review HTML escapes script text and exposes seek controls',()=>{
 const p=parseProject({...productionFixture(),title:'</script><script>evil()</script>',internalNotes:[{id:'note',text:'<img src=x onerror=evil()>'}]});
 const html=reviewPageHtml(p);assert(!html.includes('</script><script>evil'));assert(html.includes('\\u003c/script>'));assert(html.includes('textContent'));assert(html.includes('currentTime'));assert(html.includes('hashchange'));assert(html.includes('controls'));assert(!html.includes('fetch('));
});
test('review refuses incomplete builds before creating output',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'finance-review-page-'));try{const manifest=path.join(root,'project.json'),build=path.join(root,'build'),out=path.join(root,'review');await writeFile(manifest,JSON.stringify(productionFixture()));await mkdir(build);await writeFile(path.join(build,'build.json'),'{}');await assert.rejects(createReviewPage(manifest,build,out),/native_build_report/);await assert.rejects(access(out));}finally{await rm(root,{recursive:true,force:true})}
});

test('review cue click and URL hash seek in pinned browser without network',async()=>{
 const {chromium}=await import('playwright');const browser=await chromium.launch({headless:true});try{const page=await browser.newPage();await page.route('**/*',route=>route.abort());const fixture=productionFixture();const p=parseProject({...fixture,cues:[{id:'cue-1',text:'Seek here',startFrame:30,endFrame:90}]});await page.setContent(reviewPageHtml(p));await page.getByRole('link',{name:'1.00s Seek here',exact:true}).click();assert.equal(await page.locator('video').evaluate(v=>(v as HTMLVideoElement).currentTime),1);await page.evaluate(()=>{location.hash='cue=cue-1';window.dispatchEvent(new Event('hashchange'));});assert.equal(await page.locator('video').evaluate(v=>(v as HTMLVideoElement).currentTime),1);assert.equal(await page.locator('script').count(),1);}finally{await browser.close()}
});

test('review refuses stale snapshot and changed media before output creation',async()=>{
 const {snapshotProject}=await import('../src/production/snapshot.js');const {hash}=await import('../src/review.js');const {compileStages}=await import('../src/production/stages.js');const {productionColors}=await import('../src/production/encoding.js');
 const root=await mkdtemp(path.join(tmpdir(),'finance-review-hashes-'));try{const manifest=path.join(root,'project.json'),build=path.join(root,'build'),out=path.join(root,'review');await writeFile(manifest,JSON.stringify(productionFixture()));await mkdir(build);const snapshot=await snapshotProject(manifest);const report={ok:true,inputHash:'0'.repeat(64),tools:{ffmpeg:'synthetic',ffprobe:'synthetic',browser:'synthetic',font:'0'.repeat(64)},stages:compileStages(snapshot.project).map(s=>({id:s.id,hit:false,reason:'synthetic',milliseconds:0})),milliseconds:0,failure:null,verification:{ok:true,file:'final.mp4',sha256:'0'.repeat(64),tools:{ffmpeg:'synthetic',ffprobe:'synthetic'},expectations:{width:1920,height:1080,fps:30,frames:90,durationSeconds:3,videoCodec:'h264',pixelFormat:'yuv420p',...productionColors,audio:{required:false}},checks:[{name:'full_decode',passed:true}],scans:{blackEvents:[],silenceEvents:[],loudness:[]},manualListening:false}};await writeFile(path.join(build,'build.json'),JSON.stringify(report));await assert.rejects(createReviewPage(manifest,build,out),/build_snapshot_mismatch/);await assert.rejects(access(out));report.inputHash=hash(snapshot);await writeFile(path.join(build,'build.json'),JSON.stringify(report));await writeFile(path.join(build,'final.mp4'),'changed media');await assert.rejects(createReviewPage(manifest,build,out),/build_media_hash_mismatch/);await assert.rejects(access(out));}finally{await rm(root,{recursive:true,force:true})}
});
