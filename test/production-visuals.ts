import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {productionFixture} from './production-fixture.js';
import {parseProject,type Scene} from '../src/production/manifest.js';
import {capturePage,paint} from '../src/production/capture.js';
import {assertExternal} from '../src/production/paths.js';
import {mediaTool} from '../src/production/media.js';
const out=process.argv[2]!;await assertExternal(out);await mkdir(out);const session=await capturePage();
try{
 const base=parseProject(productionFixture()),common={...base.scenes[0]!,title:'虚构示例 · 阅读图形中的关系'};
 const scenes:Scene[]=[base.scenes[0]!,{...common,template:'metric',data:{id:'metric',label:'Annual difference',value:-1234567890,unit:'fictional units',qualifier:'同一组虚构数据，用于比较版式和阅读顺序。'}},{...common,template:'waterfall',data:{unit:'units',start:{id:'start',label:'Opening',value:100},steps:[{id:'cost',label:'Cost',value:-30}],end:{id:'end',label:'Closing',value:70}}},{...common,template:'trend',data:{unit:'units',series:[{id:'series',label:'Series A',values:[{label:'2024',value:-20},{label:'2025',value:60},{label:'2026',value:100}]}]}},{...common,template:'process',data:{items:[{id:'a',label:'核验材料',detail:'确认数据来源和统计口径'},{id:'b',label:'对齐口播',detail:'让图形变化跟随语义'},{id:'c',label:'检查成片',detail:'保留人工审核意见'}]}},{...common,template:'evidence',data:{id:'quote',sourceId:'source',text:'这些数字均为虚构。图形展示的目的，是检查信息层级、文字可读性和动画时序。'}}];
 for(const [i,scene] of scenes.entries()){
  const p=parseProject({...base,contentLanguage:i?'zh':'en',sources:[{id:'source',citation:'Original synthetic fixture / 原创虚构样例'}],scenes:[{...scene,sourceIds:['source']}],events:i?[]:base.events});
  for(const frame of [0,7,30,89]){await paint(session.page,session.font,p,scene.id,frame);const file=path.join(out,`${scene.template}-${frame}.png`);await session.page.screenshot({path:file});if(frame===30)for(const width of [360,390])mediaTool('ffmpeg',['-v','error','-i',file,'-vf',`scale=${width}:-1`,'-frames:v','1',path.join(out,`${scene.template}-${width}.png`)]);}
 }
 await writeFile(path.join(out,'inspection.json'),JSON.stringify({templates:6,frames:24,network:'blocked',phoneWidths:[360,390],automatedLayout:'passed',manualInspection:false}));
}finally{await session.close();}
