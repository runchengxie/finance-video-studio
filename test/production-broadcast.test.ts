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

test('broadcast preserves authored decimal precision and waits for the difference cue',()=>{
 const p=broadcastFixture();p.cues=[{id:'cue-1',text:'Rate',startFrame:0,endFrame:45},{id:'cue-2',text:'Difference',startFrame:45,endFrame:90}];
 const s=p.scenes[0]!;
 const project=parseProject({...p,events:[],scenes:[{...s,data:{...s.data,precision:2,difference:{...s.data.difference,cueId:'cue-2'}}}]});
 const early=sceneHtml(project,'cash',30,'','improved',assets),late=sceneHtml(project,'cash',60,'','improved',assets);
 assert.ok(early.includes('30.00'));assert.ok(!early.includes('class="difference"'));assert.ok(late.includes('class="difference"'));
});

test('metric number and unit fit their line box at broadcast display size',async()=>{
 const p=parseProject(broadcastFixture()),s=p.scenes[0]!;p.events=[];
 p.scenes=[{...s,presentation:{layout:'explanation',chapterLabel:'Metric'},template:'metric',data:{id:'value',label:'Share',value:11.1,unit:'%',qualifier:'Same denominator'}}];
 const session=await capturePage();try{await paint(session.page,session.font,p,'cash',30,'improved',assets);}finally{await session.close();}
});

test('difference can use percentage points independently of percentage rates',()=>{
 const p=broadcastFixture(),s=p.scenes[0]!;
 const project=parseProject({...p,events:[],scenes:[{...s,data:{unit:'% / year',precision:2,items:[{id:'a',label:'A',value:.2},{id:'b',label:'B',value:1.15}],difference:{leftId:'a',rightId:'b',label:'Annual rate difference',unit:'percentage points'}}}]});
 assert.match(sceneHtml(project,'cash',30,'','improved',assets),/0.95<\/b> percentage points/);
});

test('evidence value list retains exact figures and cue reveals without implying separate bar totals',async()=>{
 const base=broadcastFixture(),s=base.scenes[0]!;
 const p=parseProject({...base,scenes:[{...s,presentation:{...s.presentation,chartStyle:'values'},data:{...s.data,precision:2}}]});
 const session=await capturePage();try{await paint(session.page,session.font,p,'cash',30,'improved',assets);assert.equal(await session.page.locator('[data-bar]').count(),0);assert.equal(await session.page.locator('.value-number').first().textContent(),'30.00');}finally{await session.close();}
});

test('stacked evidence cards validate visible text and ignore display-none step labels',async()=>{
 const p=parseProject(broadcastFixture()),s=p.scenes[0]!;p.events=[];p.scenes=[{...s,template:'process',data:{items:[{id:'a',label:'First',detail:'First detail'},{id:'b',label:'Second',detail:'Second detail'}]}}];
 const session=await capturePage();try{await paint(session.page,session.font,p,'cash',30,'improved',assets);}finally{await session.close();}
});

test('broadcast renders existing emphasis events and SVG reveal progress',async()=>{
 const p=parseProject(broadcastFixture());p.events=[];p.scenes[0]!.presentation={layout:'wide-chart',chapterLabel:'Test'};
 const session=await capturePage();
 try{
  for(const action of ['highlight','compare','annotate'] as const){
   await paint(session.page,session.font,p,'cash',25,'improved',assets);const plain=await session.page.screenshot();
   const active=structuredClone(p);active.events=[{id:'focus',sceneId:'cash',cueId:'cue-1',targetId:'operating',action,offsetFrames:20,durationFrames:15,precision:'cue_start'}];
   await paint(session.page,session.font,active,'cash',25,'improved',assets);assert.notDeepEqual(await session.page.screenshot(),plain,action);
  }
  const s=p.scenes[0]!;
  for(const scene of [
   {...s,template:'trend' as const,data:{unit:'%',series:[{id:'line',label:'Line',values:[{label:'A',value:1},{label:'B',value:2}]}]}},
   {...s,template:'waterfall' as const,data:{unit:'%',start:{id:'line',label:'Start',value:10},steps:[{id:'cost',label:'Cost',value:-2}],end:{id:'end',label:'End',value:8}}},
  ]){
   const q={...p,scenes:[scene],events:[{id:'reveal',sceneId:'cash',cueId:'cue-1',targetId:'line',action:'reveal' as const,offsetFrames:0,durationFrames:15,precision:'cue_start' as const}]};
   await paint(session.page,session.font,q,'cash',7,'improved',assets);const opacity=await session.page.locator('[data-target="line"]').getAttribute('opacity');assert.ok(Number(opacity)>0&&Number(opacity)<1);
  }
 }finally{await session.close();}
});

test('dense waterfall labels fail when neighboring text rectangles collide',async()=>{
 const p=parseProject(broadcastFixture()),s=p.scenes[0]!;p.events=[];p.scenes=[{...s,presentation:{layout:'wide-chart',chapterLabel:'Test'},template:'waterfall',data:{unit:'元',start:{id:'start',label:'开始资产',value:100},steps:Array.from({length:10},(_,i)=>({id:'p'+i,label:'管理费项目'+i,value:1})),end:{id:'end',label:'结束资产',value:110}}}];
 const session=await capturePage();try{await assert.rejects(paint(session.page,session.font,p,'cash',30,'improved',assets),/label_collision/);}finally{await session.close();}
});

test('document wrapping cannot silently shift highlights off the actual image',async()=>{
 const p=parseProject(broadcastFixture());p.events=[];const panel=p.scenes[0]!.presentation!.evidencePanels![0]!;panel.label='资料标题'.repeat(8);
 const session=await capturePage();
 try{
  const uri=await session.page.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=900;return c.toDataURL('image/png');});
  await assert.rejects(paint(session.page,session.font,p,'cash',30,'improved',new Map([['page',uri]])),/image_bounds/);
 }finally{await session.close();}
});
