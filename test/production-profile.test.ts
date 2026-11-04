import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productionFixture} from './production-fixture.js';
import {parseProject} from '../src/production/manifest.js';
import {assertProductionProfileReady,productionProfileIssues} from '../src/production/profile.js';

function profiled(){
 const base=productionFixture();return parseProject({...base,width:1080,height:1440,fps:60,inputs:[{id:'original',path:'inputs/original.wav',mediaType:'audio',sha256:'0'.repeat(64),provenance:'Original generated tone',rights:'Synthetic fixture'},{id:'cut',path:'inputs/cut.wav',mediaType:'audio',sha256:'1'.repeat(64),provenance:'Derived generated tone',rights:'Synthetic fixture'}],
 render:{...base.render,theme:'broadcast-v1',broadcast:{programName:'Fictional desk'},audioId:'cut',visual:{preset:'warm-paper',motion:'subtle'}},
 events:[...base.events,{...base.events[0]!,id:'reveal-equipment',targetId:'equipment',offsetFrames:30}],
 productionProfile:{id:'portrait-explainer-v1',audioEdit:{decision:'trim',sourceAudioId:'original',outputAudioId:'cut',startSeconds:2,endSeconds:3.5,notes:'Synthetic cut. Not human listening or editorial approval.'}}});
}

test('profile readiness checks format, true cue reveals and explicit source trims',()=>{
 const p=profiled();assert.doesNotThrow(()=>assertProductionProfileReady(p));
 for(const mutate of [(x:typeof p)=>{x.width=1920;x.height=1080;x.fps=30;},(x:typeof p)=>{x.render.visual!.motion='static';},(x:typeof p)=>{x.events[0]!.action='highlight';},(x:typeof p)=>{x.events[0]!.durationFrames=1;},(x:typeof p)=>{x.productionProfile!.audioEdit={decision:'pending'};}]){
  const invalid=structuredClone(p);mutate(invalid);assert.throws(()=>assertProductionProfileReady(invalid),/production_profile_not_ready/);
 }
});

test('trim declarations preserve the original and agree with the selected duration',()=>{
 const p=profiled();
 for(const patch of [{startSeconds:4},{endSeconds:5},{sourceAudioId:'missing'},{outputAudioId:'original'}]){
  const invalid=structuredClone(p);invalid.productionProfile!.audioEdit={...p.productionProfile!.audioEdit,...patch};assert.throws(()=>assertProductionProfileReady(invalid));
 }
 const retained=profiled();retained.productionProfile!.audioEdit={decision:'retain_full',sourceAudioId:'original',reason:'Synthetic source has no service introduction or outro.'};retained.render.audioId='original';assert.doesNotThrow(()=>assertProductionProfileReady(retained));
 retained.render.audioId='cut';assert.throws(()=>assertProductionProfileReady(retained));
});

test('old manifests remain explicit legacy inputs with a visible readiness warning',()=>{
 const p=parseProject({...productionFixture(),fictional:false});assert.equal(productionProfileIssues(p)[0]!.code,'production_profile_missing');assert.doesNotThrow(()=>assertProductionProfileReady(p));
 assert.throws(()=>parseProject({...profiled(),productionProfile:{id:'unknown',audioEdit:{decision:'pending'}}}));
});
