import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productionFixture} from './production-fixture.js';
import {parseProject} from '../src/production/manifest.js';
import {capturePage,paint} from '../src/production/capture.js';
import {palettes} from '../src/production/visual-profile.js';

const luminance=(rgb:number[])=>rgb.map(x=>{const c=x/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i]!,0);
const hex=(value:string)=>[1,3,5].map(i=>parseInt(value.slice(i,i+2),16));

test('broadcast comparison values remain readable on configured backgrounds',async()=>{
 const session=await capturePage();
 try{
  for(const preset of ['warm-paper','navy'] as const){
   const base=productionFixture();
   const project=parseProject({...base,events:[],render:{...base.render,theme:'broadcast-v1',broadcast:{programName:'Fictional comparison'},visual:{preset,motion:'static'}}});
   await paint(session.page,session.font,project,project.scenes[0]!.id,30);
   const colors=await session.page.locator('.bar-label span').evaluateAll(elements=>elements.map(el=>getComputedStyle(el).color));
   assert(colors.length>0);
   for(const color of colors){
    const text=luminance(color.match(/[\d.]+/g)!.slice(0,3).map(Number)),background=luminance(hex(palettes[preset].background));
    const contrast=(Math.max(text,background)+.05)/(Math.min(text,background)+.05);
    assert(contrast>=4.5,`${preset} comparison value contrast ${contrast.toFixed(2)} is below 4.5`);
   }
  }
 }finally{await session.close();}
});
