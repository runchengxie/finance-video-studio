import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {parseProject} from '../src/production/manifest.js';
import {productionFixture} from './production-fixture.js';
import {snapshotProject} from '../src/production/snapshot.js';
import {createProductionReview,importProductionPolish,approveProductionReview} from '../src/production/review.js';
import {saveProductionReview} from '../src/production/review-io.js';
import {renderProduction} from '../src/production/render.js';
import {packageDelivery} from '../src/production/delivery.js';
import {createReviewPage} from '../src/production/review-page.js';
import {hashFile} from '../src/production/project-io.js';
import {mediaTool} from '../src/production/media.js';

test('portrait native render, audio timing, delivery and cross-revision scene cache reuse',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'portrait-native-'));try{
 await mkdir(path.join(root,'inputs'));const audio=path.join(root,'inputs','tone.wav');assert(mediaTool('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=440:duration=1','-c:a','pcm_s16le',audio]).ok);
 const fixture=productionFixture();const p=parseProject({...fixture,width:1080,height:1440,fps:60,durationFrames:120,
 inputs:[{id:'voice',path:'inputs/tone.wav',mediaType:'audio',sha256:await hashFile(audio),provenance:'Synthetic tone',rights:'Original fixture'}],
 render:{...fixture.render,audioId:'voice',visual:{preset:'warm-paper',motion:'static'}},
 scenes:[0,1].map(i=>({id:'s'+i,from:i*60,durationFrames:60,title:'Fictional result '+i,chapterId:'chapter'+i,sourceIds:[],template:'metric',data:{id:'value',label:'Fictional metric',value:30+i*10,unit:'USD million'}})),
 cues:[{id:'a',text:'Fictional 30',startFrame:0,endFrame:60},{id:'b',text:'Fictional 40',startFrame:60,endFrame:120}],events:[]});
 const manifest=path.join(root,'project.json');await writeFile(manifest,JSON.stringify(p));
 async function approve(name:string){const snapshot=await snapshotProject(manifest),pending=createProductionReview(snapshot),review=importProductionPolish(pending,{inputHash:pending.inputHash,decision:'accepted',polished:snapshot,changeNotes:'Synthetic integration',skillUse:'not_used'});const file=path.join(root,name+'.json');await saveProductionReview(file,approveProductionReview(review,{reviewer:'Synthetic test',factReviewNotes:'Original generated fixture',expiresAt:new Date(Date.now()+3600000).toISOString()}));return file}
 const first=await approve('first'),cache=path.join(root,'cache'),build=path.join(root,'build');const a=await renderProduction(manifest,first,build,cache);assert(a.ok);assert(a.stages.every(x=>!x.hit));assert.equal(a.verification!.expectations.fps,60);
 const delivered=await packageDelivery(manifest,first,build,path.join(root,'delivery'));assert(delivered.complete);
 assert((await readFile(path.join(root,'delivery','public','subtitles.srt'),'utf8')).includes('00:00:02,000'));
 await createReviewPage(manifest,build,path.join(root,'review'));
 p.cues[0]!.text='Changed first cue';await writeFile(manifest,JSON.stringify(p));const second=await approve('second');const b=await renderProduction(manifest,second,path.join(root,'revised'),cache);
 assert(b.stages.filter(x=>x.id.startsWith('s0-')).every(x=>!x.hit));assert(b.stages.filter(x=>x.id.startsWith('s1-')).every(x=>x.hit));
 const c=await renderProduction(manifest,second,path.join(root,'resumed'),cache);assert(c.stages.every(x=>x.hit));
 }finally{assert.equal(path.dirname(root),tmpdir());await rm(root,{recursive:true,force:true})}
});
