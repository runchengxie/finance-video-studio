import {productionFixture} from './production-fixture.js';
export function broadcastFixture() {
 const p=productionFixture();
 return {...p,inputs:[{id:'page',path:'inputs/page.png',mediaType:'image',sha256:'0'.repeat(64),provenance:'Fictional document',rights:'Original'},{id:'backdrop',path:'inputs/backdrop.mp4',mediaType:'video',sha256:'0'.repeat(64),provenance:'Generated',rights:'Original'}],
  sources:[{id:'document',citation:'Fictional document, 2026-01-01',inputId:'page'}],
  scenes:[{...p.scenes[0]!,sourceIds:['document'],presentation:{layout:'evidence',chapterLabel:'Test chapter',sidebar:[{label:'Compare',cueId:'cue-1'}],evidencePanels:[{inputId:'page',sourceId:'document',label:'Document',pageLabel:'1',highlight:{x:.1,y:.2,width:.4,height:.1,cueId:'cue-1'}}]}}],
  render:{...p.render,theme:'broadcast-v1',broadcast:{programName:'Fictional desk',backgroundVideoId:'backdrop'}}};
}

