import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productionFixture} from './production-fixture.js';
import {parseProject} from '../src/production/manifest.js';
import {sceneHtml} from '../src/production/templates.js';

test('portrait trend tracing and waterfall growth use actual cue progress and seek deterministically',()=>{
 const base=productionFixture(),common={...base,width:1080,height:1440,fps:60};
 const trend=parseProject({...common,scenes:[{...base.scenes[0]!,template:'trend',data:{unit:'units',series:[{id:'line',label:'Fictional series',values:[{label:'A',value:10},{label:'B',value:20},{label:'C',value:15}]}]}}],events:[{...base.events[0]!,targetId:'line',durationFrames:60}]});
 const at=(frame:number)=>sceneHtml(trend,'cash',frame,'');
 const offset=(html:string)=>Number(html.match(/stroke-dashoffset="([^"]+)"/)?.[1]);assert.equal(offset(at(0)),1);assert.equal(offset(at(30)),.125);assert.equal(offset(at(60)),0);const mid=at(30);at(0);at(60);assert.equal(at(30),mid);
 const waterfall=parseProject({...common,scenes:[{...base.scenes[0]!,template:'waterfall',data:{unit:'units',start:{id:'opening',label:'Opening',value:100},steps:[{id:'cost',label:'Cost',value:-30}],end:{id:'closing',label:'Closing',value:70}}}],events:[{...base.events[0]!,targetId:'cost',durationFrames:60}]});
 const height=(frame:number)=>Number(sceneHtml(waterfall,'cash',frame,'').match(/data-target="cost"[^>]*><rect[^>]*height="([^"]+)"/)?.[1]);assert.equal(height(0),0);assert.equal(height(30)/height(60),.875);assert.match(sceneHtml(waterfall,'cash',30,''),/>-30<\/text>/);
});
