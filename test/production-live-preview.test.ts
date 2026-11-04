import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {chromium} from 'playwright';
import {productionFixture} from './production-fixture.js';
import {createLivePreview} from '../src/production/live-preview.js';

test('live inspection reuses shared resources and draws native intermediate frames offline',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'native-preview-'));t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(path.join(root,'inputs'));
 const p={...productionFixture(),width:1080,height:1440,fps:60};const file=path.join(root,'project.json');await writeFile(file,JSON.stringify(p));
 const cache=path.join(root,'shared-assets'),first=path.join(root,'one'),second=path.join(root,'two');await createLivePreview(file,first,cache);const resources=await readdir(cache);await createLivePreview(file,second,cache);assert.deepEqual(await readdir(cache),resources);assert.equal(resources.length,2);
 assert.equal(JSON.parse(await readFile(path.join(first,'preview.json'),'utf8')).encodedMp4,false);await assert.rejects(()=>createLivePreview(file,first,cache),/EEXIST/);
 const browser=await chromium.launch();try{
  const page=await browser.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto('file://'+path.join(first,'index.html'));
  await page.waitForFunction(()=>!!document.querySelector<HTMLIFrameElement>('#screen')?.contentDocument?.querySelector('.rail'));
  await page.locator('#frame').evaluate(el=>{(el as HTMLInputElement).value='7';el.dispatchEvent(new Event('input'));});
  await page.waitForFunction(()=>document.querySelector<HTMLInputElement>('#frame')?.value==='7');await page.waitForTimeout(50);
  const transform=await page.locator('#screen').evaluate(el=>(el as HTMLIFrameElement).contentDocument!.querySelector<HTMLElement>('.fill')!.style.transform);assert.notEqual(transform,'scaleX(1)');assert.notEqual(transform,'scaleX(0)');
  assert.equal(await page.locator('#language').inputValue(),'en');await page.locator('#language').selectOption('zh');assert((await page.locator('#notice').textContent())!.includes('仅供内部检查'));
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
 const asset=path.join(cache,resources[0]!);await writeFile(asset,'tampered resource');await assert.rejects(()=>createLivePreview(file,path.join(root,'bad'),cache),/preview_asset_hash_mismatch/);
});
