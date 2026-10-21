import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseProject} from '../src/production/manifest.js';
import {sceneHtml} from '../src/production/templates.js';
import {capturePage,paint} from '../src/production/capture.js';
import {broadcastFixture} from './broadcast-fixture.js';

const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const assets=new Map([['page',pixel]]);
test('broadcast renders escaped local evidence and cue-bound highlight with localized labels',()=>{
 const p=parseProject(broadcastFixture());p.render.broadcast!.programName='<script>desk</script>';
 const html=sceneHtml(p,'cash',20,'','improved',assets);
 assert.ok(html.includes('class="broadcast"'));assert.ok(!html.includes('<script>desk'));
 assert.ok(html.includes('&lt;script&gt;desk'));assert.ok(html.includes('Original excerpt'));assert.ok(html.includes('data-highlight'));
 p.contentLanguage='zh';assert.ok(sceneHtml(p,'cash',20,'','improved',assets).includes('原文局部'));
 assert.throws(()=>sceneHtml(p,'cash',20,''),/missing_visual_asset/);
});

test('signed chart uses one zero and linear scale for mixed, negative, zero and large values',async()=>{
 const session=await capturePage();
 try{
  for(const values of [[-10,20],[-10,-20],[0,0],[1,1000000],[20,20]]){
   const base=parseProject(broadcastFixture()),s=base.scenes[0]!;base.events=[];
   base.scenes=[{...s,presentation:{layout:'wide-chart',chapterLabel:'Comparison'},template:'signed-comparison',data:{unit:'%',items:values.map((value,i)=>({id:'v'+i,label:'Sample '+i,value}))}}];
   await paint(session.page,session.font,base,'cash',30,'improved',assets);
   const geometry=await session.page.locator('[data-bar]').evaluateAll(els=>els.map(el=>({x:Number(el.getAttribute('x')),w:Number(el.getAttribute('width')),zero:Number(el.getAttribute('data-zero'))})));
   assert.equal(geometry.length,2);assert.equal(geometry[0]!.zero,geometry[1]!.zero);
   for(let i=0;i<2;i++)assert.ok(Math.abs((values[i]!<0?geometry[i]!.x+geometry[i]!.w:geometry[i]!.x)-geometry[i]!.zero)<.001);
   if(values[0]===0)assert.equal(geometry[0]!.w,0);
   else assert.ok(Math.abs(geometry[1]!.w/geometry[0]!.w-Math.abs(values[1]!/values[0]!))<.01);
  }
 }finally{await session.close();}
});

test('browser refuses title/source/caption overflow instead of silently clipping',async()=>{
 const session=await capturePage();
 try{
  const p=parseProject(broadcastFixture());await paint(session.page,session.font,p,'cash',30,'improved',assets);
  for(const field of ['title','source','caption']){
   const bad=structuredClone(p);
   if(field==='title')bad.scenes[0]!.title='长'.repeat(120);
   if(field==='source')bad.sources[0]!.citation='长'.repeat(500);
   if(field==='caption')bad.cues[0]!.text='长'.repeat(180);
   await assert.rejects(paint(session.page,session.font,bad,'cash',30,'improved',assets),/layout_check:cash/);
  }
 }finally{await session.close();}
});
