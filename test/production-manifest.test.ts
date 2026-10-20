import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseProject} from '../src/production/manifest.js';
import {productionFixture} from './production-fixture.js';

test('v2 manifest preserves long manuscript and validates complete references and timeline',()=>{
 const p=productionFixture();p.manuscript[0]!.text='A'.repeat(4000);
 assert.equal(parseProject(p).manuscript[0]!.text.length,4000);
 for(const patch of [{fps:29.97},{extra:true},{durationFrames:91},{cues:[{id:'bad',text:'x',startFrame:2,endFrame:2}]},{events:[{...p.events[0],targetId:'missing'}]},{sources:[{id:'missing',citation:'x',inputId:'unknown'}]}])assert.throws(()=>parseProject({...p,...patch}));
 assert.throws(()=>parseProject({...p,scenes:[p.scenes[0],p.scenes[0]]}));
 assert.throws(()=>parseProject({...p,inputs:[{id:'x',path:'../escape',mediaType:'data',sha256:'0'.repeat(64),provenance:'x',rights:'original'}]}));
 assert.throws(()=>parseProject({...p,scenes:[{...p.scenes[0],data:{unit:'x',items:[{id:'a',label:'a',value:NaN},{id:'b',label:'b',value:2}]}}]}));
});

test('signed waterfall reconciles and discontinuous chapter identifiers reject',()=>{
 const p=productionFixture();
 const s={...p.scenes[0],template:'waterfall',data:{unit:'USD million',start:{id:'start',label:'Start',value:100},steps:[{id:'spend',label:'Spend',value:-70}],end:{id:'end',label:'End',value:30}}};
 assert.equal(parseProject({...p,events:[],scenes:[s]}).scenes[0]!.template,'waterfall');
 assert.throws(()=>parseProject({...p,events:[],scenes:[{...s,data:{...s.data,end:{...s.data.end,value:31}}}]}));
 const scenes=['a','b','a'].map((chapterId,i)=>({...p.scenes[0],id:'scene'+i,from:i*30,durationFrames:30,chapterId}));
 assert.throws(()=>parseProject({...p,events:[],scenes}));
});
