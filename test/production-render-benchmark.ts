// Focused experiment: compare full scene repaint with reusing one trend DOM.
// This is not a production renderer and does not grant approval.
import {createHash} from 'node:crypto';
import {productionFixture} from './production-fixture.js';
import {parseProject} from '../src/production/manifest.js';
import {sceneState} from '../src/production/scene-state.js';
import {capturePage,paint} from '../src/production/capture.js';

const base=productionFixture();
const project=parseProject({...base,width:1080,height:1440,fps:60,scenes:[{...base.scenes[0]!,template:'trend',data:{unit:'%',series:[{id:'line',label:'Fictional series',values:[{label:'2023',value:1},{label:'2024',value:2},{label:'2025',value:3}]}]}}],events:[{...base.events[0]!,targetId:'line',durationFrames:40}]});
const frameCount=60,frames=Array.from({length:frameCount},(_,index)=>index),samples=[0,15,30,45,59];
const opacity=(frame:number)=>{const target=sceneState(project,'cash',frame).targets.line!;return !target.visible?0:target.action==='reveal'?1-(1-target.progress)**3:1;};
const current=await capturePage(),reuse=await capturePage();
try{
 for(const frame of frames.slice(0,3))await paint(current.page,current.font,project,'cash',frame);
 let started=performance.now();
 for(const frame of frames)await paint(current.page,current.font,project,'cash',frame);
 const currentMs=performance.now()-started;
 await paint(reuse.page,reuse.font,project,'cash',0);
 const update=async(frame:number)=>reuse.page.evaluate(({alpha})=>{const group=document.querySelector('[data-target="line"]');if(!group)throw new Error('missing_trend_target');group.setAttribute('opacity',String(alpha));group.querySelector('polyline')?.setAttribute('stroke-dashoffset',String(1-alpha));},{alpha:opacity(frame)});
 for(const frame of frames.slice(0,3))await update(frame);
 started=performance.now();
 for(const frame of frames)await update(frame);
 const reuseMs=performance.now()-started;
 const hashes:{frame:number;current:string;reuse:string;equal:boolean}[]=[];
 for(const frame of samples){
  await paint(current.page,current.font,project,'cash',frame);const a=createHash('sha256').update(await current.page.screenshot({animations:'disabled'})).digest('hex');
  await update(frame);const b=createHash('sha256').update(await reuse.page.screenshot({animations:'disabled'})).digest('hex');
  hashes.push({frame,current:a,reuse:b,equal:a===b});
 }
 const report={frames:frameCount,currentMs:Number(currentMs.toFixed(1)),reuseMs:Number(reuseMs.toFixed(1)),speedup:Number((currentMs/reuseMs).toFixed(2)),samples:hashes,equal:hashes.every(sample=>sample.equal),notice:'Full repaint includes native layout checks and font/image waits; DOM reuse updates only target opacity and trend dash offsets. Screenshot equality is the guard, not a performance claim for every template.'};
 console.log(JSON.stringify(report,null,2));if(!report.equal)process.exitCode=1;
}finally{await current.close();await reuse.close();}
