import type {ProductionProject} from './manifest.js';
import {sceneHtml} from './templates.js';
import {previewLabels} from './preview-locales.js';

declare global {interface Window {STUDIO_VISUALS?:Record<string,string>;STUDIO_PREVIEW:{project:ProductionProject;audioUrl:string|null;sourceAudioUrl:string|null;fontUrl:string;snapshotHash:string}}}
type Adjustment={sceneId:string;targetId:string;translateX:number;translateY:number;scale:number};
const record=window.STUDIO_PREVIEW,p=record.project;
const voice=document.querySelector<HTMLAudioElement>('#voice')!,source=document.querySelector<HTMLAudioElement>('#source')!,screen=document.querySelector<HTMLIFrameElement>('#screen')!,slider=document.querySelector<HTMLInputElement>('#frame')!,search=document.querySelector<HTMLInputElement>('#search')!;
const adjustments=new Map<string,Adjustment>((p.visualAdjustments??[]).map(value=>[`${value.sceneId}/${value.targetId}`,{...value}]));
let requested=0,last=-1,pendingSeek:number|null=null,sourceStop:number|null=null,currentScene:string|null=null,editing=false;
let selected:{sceneId:string;targetId:string}|null=null,drag:{adjustment:Adjustment;x:number;y:number;baseX:number;baseY:number}|null=null;
const time=(f:number)=>{const s=Math.floor(f/p.fps);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const key=(sceneId:string,targetId:string)=>`${sceneId}/${targetId}`;
function selectedAdjustment(create=false):Adjustment|null {
 if(!selected)return null;
 const name=key(selected.sceneId,selected.targetId);let value=adjustments.get(name);
 if(!value&&create){value={sceneId:selected.sceneId,targetId:selected.targetId,translateX:0,translateY:0,scale:1};adjustments.set(name,value);}
 return value??null;
}
function applyAdjustments(doc:Document,sceneId:string):void {
 doc.documentElement.toggleAttribute('data-studio-editing',editing);
 for(const value of adjustments.values()){
  if(value.sceneId!==sceneId)continue;
  const element=doc.querySelector<HTMLElement|SVGElement>(`[data-target="${value.targetId}"]`);if(!element)continue;
  element.style.translate=`${value.translateX}px ${value.translateY}px`;
  element.style.scale=String(value.scale);
  element.style.transformOrigin='center';
  element.style.transformBox='fill-box';
  if(selected&&selected.sceneId===sceneId&&selected.targetId===value.targetId)element.setAttribute('data-studio-selected','');
 }
 if(selected&&selected.sceneId===sceneId)doc.querySelector(`[data-target="${selected.targetId}"]`)?.setAttribute('data-studio-selected','');
}
function draw(){
 const doc=screen.contentDocument,style=doc?.querySelector('#native-style');if(!doc||!style)return;
 const frame=Math.max(0,Math.min(p.durationFrames-1,record.audioUrl&&voice.readyState?Math.floor(voice.currentTime*p.fps+1e-3):requested));
 if(last===frame)return;last=frame;requested=frame;slider.value=String(frame);
 const scene=p.scenes.find(s=>frame>=s.from&&frame<s.from+s.durationFrames)!;currentScene=scene.id;
 const markup=new DOMParser().parseFromString(sceneHtml(p,scene.id,frame,'','improved',new Map(p.inputs.filter(x=>x.mediaType==='image').map(x=>[x.id,window.STUDIO_VISUALS?.[x.sha256]??'']))),'text/html');style.textContent=markup.querySelector('style')!.textContent;const sceneAttribute=markup.documentElement.getAttribute('data-scene');if(sceneAttribute)doc.documentElement.setAttribute('data-scene',sceneAttribute);else doc.documentElement.removeAttribute('data-scene');doc.body.innerHTML=markup.body.innerHTML;applyAdjustments(doc,scene.id);
 document.querySelector('#position')!.textContent=time(frame)+' / '+time(p.durationFrames);
 document.querySelectorAll<HTMLButtonElement>('#cues button').forEach(b=>b.classList.toggle('active',frame>=Number(b.dataset.start)&&frame<Number(b.dataset.end)));
}
function seek(frame:number){requested=Math.max(0,Math.min(p.durationFrames-1,frame));if(record.audioUrl){if(voice.readyState)voice.currentTime=requested/p.fps;else pendingSeek=requested;}last=-1;draw();}
function resize(){screen.style.transform='scale('+(document.querySelector('#stage')!.clientWidth/p.width)+')';}
function cues(){const q=search.value;const list=document.querySelector('#cues')!;list.replaceChildren();for(const cue of p.cues.filter(c=>c.text.includes(q))){const b=document.createElement('button');b.textContent=time(cue.startFrame)+' '+cue.text;b.dataset.start=String(cue.startFrame);b.dataset.end=String(cue.endFrame);b.onclick=()=>seek(cue.startFrame);list.append(b);}last=-1;draw();}
const language=document.querySelector<HTMLSelectElement>('#language')!;
try{language.value=(new URLSearchParams(location.search).get('lang')??localStorage.getItem('finance-preview-language'))==='zh'?'zh':'en';}catch{language.value='en';}
function updateEditor(){
 const l=previewLabels[language.value==='zh'?'zh':'en'],toggle=document.querySelector<HTMLButtonElement>('#edit-toggle')!,value=selectedAdjustment();
 toggle.textContent=editing?l.editActive:l.editToggle;toggle.setAttribute('aria-pressed',String(editing));
 for(const id of ['scale-down','scale-up','reset-selected'])document.querySelector<HTMLButtonElement>('#'+id)!.disabled=!editing||!selected;
 document.querySelector<HTMLButtonElement>('#export-patch')!.disabled=adjustments.size===0;
 document.querySelector('#selection')!.textContent=selected?`${l.selection}: ${selected.sceneId} / ${selected.targetId} · x ${value?.translateX??0} · y ${value?.translateY??0} · ×${(value?.scale??1).toFixed(2)}`:`${l.selection}: —`;
}
function localize(){const lang=language.value==='zh'?'zh':'en',l=previewLabels[lang];document.documentElement.lang=lang;for(const el of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n]')))el.textContent=l[el.dataset.i18n as keyof typeof l];search.placeholder=l.search;updateEditor();try{localStorage.setItem('finance-preview-language',lang);}catch{/* file storage can be unavailable */}}
language.onchange=localize;localize();document.querySelector('#title')!.textContent=p.title;document.querySelector('#snapshot')!.textContent=record.snapshotHash;
for(const scene of p.scenes){const b=document.createElement('button');b.textContent=time(scene.from)+' '+scene.title;b.onclick=()=>seek(scene.from);document.querySelector('#chapters')!.append(b);}
for(const item of p.sources){const line=document.createElement('p');line.textContent=item.citation;if(item.url){const a=document.createElement('a');a.href=item.url;a.textContent=' ↗';a.target='_blank';a.rel='noopener';line.append(a);}document.querySelector('#sources')!.append(line);}
slider.max=String(p.durationFrames-1);slider.oninput=()=>seek(Number(slider.value));search.oninput=cues;
screen.width=String(p.width);screen.height=String(p.height);document.querySelector<HTMLElement>('#stage')!.style.aspectRatio=p.width+'/'+p.height;
screen.onload=()=>{
 resize();last=-1;draw();
 const doc=screen.contentDocument;if(!doc)return;
 doc.addEventListener('pointerdown',event=>{
  if(!editing)return;const node=event.target as Element|null,target=node&&typeof node.closest==='function'?node.closest('[data-target]'):null;
  if(!target||!currentScene)return;event.preventDefault();
  selected={sceneId:currentScene,targetId:target.getAttribute('data-target')!};const value=selectedAdjustment(true)!;
  drag={adjustment:value,x:event.clientX,y:event.clientY,baseX:value.translateX,baseY:value.translateY};last=-1;draw();updateEditor();
 });
 doc.addEventListener('pointermove',event=>{
  if(!drag)return;const clamp=(value:number)=>Math.max(-400,Math.min(400,Math.round(value*2)/2));
  drag.adjustment.translateX=clamp(drag.baseX+event.clientX-drag.x);drag.adjustment.translateY=clamp(drag.baseY+event.clientY-drag.y);
  last=-1;draw();updateEditor();
 });
 const stop=()=>{drag=null;};doc.addEventListener('pointerup',stop);doc.addEventListener('pointercancel',stop);
 doc.addEventListener('keydown',editKey);
};
screen.srcdoc='<link rel="stylesheet" href="'+record.fontUrl+'"><style id="native-style"></style><style id="studio-edit-style">[data-studio-editing] [data-target]{cursor:move}[data-studio-selected]{outline:3px solid #b92a28!important;outline-offset:2px}</style><body></body>';window.addEventListener('resize',resize);
function scaleSelected(delta:number){if(!editing)return;const value=selectedAdjustment(true);if(!value)return;value.scale=Math.max(.5,Math.min(1.5,Math.round((value.scale+delta)*100)/100));last=-1;draw();updateEditor();}
function resetSelected(){const value=selectedAdjustment();if(!value)return;value.translateX=0;value.translateY=0;value.scale=1;last=-1;draw();updateEditor();}
function editKey(event:KeyboardEvent){
 if(!editing||!selected)return;const value=selectedAdjustment(true)!,step=event.shiftKey?10:1;let handled=true;
 if(event.key==='ArrowLeft')value.translateX=Math.max(-400,value.translateX-step);
 else if(event.key==='ArrowRight')value.translateX=Math.min(400,value.translateX+step);
 else if(event.key==='ArrowUp')value.translateY=Math.max(-400,value.translateY-step);
 else if(event.key==='ArrowDown')value.translateY=Math.min(400,value.translateY+step);
 else if(event.key==='+'||event.key==='=')value.scale=Math.min(1.5,Math.round((value.scale+.02)*100)/100);
 else if(event.key==='-'||event.key==='_')value.scale=Math.max(.5,Math.round((value.scale-.02)*100)/100);
 else if(event.key==='r'||event.key==='R'){value.translateX=0;value.translateY=0;value.scale=1;}
 else if(event.key==='Escape')selected=null;
 else handled=false;
 if(handled){event.preventDefault();last=-1;draw();updateEditor();}
}
window.addEventListener('keydown',editKey);window.addEventListener('pointerup',()=>{drag=null;});
document.querySelector('#edit-toggle')!.addEventListener('click',()=>{editing=!editing;if(editing){voice.pause();source.pause();}else{selected=null;drag=null;}const doc=screen.contentDocument;if(doc)doc.documentElement.toggleAttribute('data-studio-editing',editing);last=-1;draw();updateEditor();});
document.querySelector('#scale-down')!.addEventListener('click',()=>scaleSelected(-.02));document.querySelector('#scale-up')!.addEventListener('click',()=>scaleSelected(.02));document.querySelector('#reset-selected')!.addEventListener('click',resetSelected);
document.querySelector('#export-patch')!.addEventListener('click',()=>{
 const patch={schemaVersion:1,projectId:p.id,baseSnapshotHash:record.snapshotHash,changes:[...adjustments.values()].map(({sceneId,targetId,translateX,translateY,scale})=>({sceneId,targetId,translateX,translateY,scale}))};
 const json=JSON.stringify(patch,null,2);document.querySelector<HTMLTextAreaElement>('#patch-output')!.value=json;
 try{const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));link.download='visual-patch.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);}catch{/* a restricted file context may block downloads; the JSON stays visible */}
});
if(record.audioUrl){voice.src=record.audioUrl;voice.onloadedmetadata=()=>{if(pendingSeek!==null){voice.currentTime=pendingSeek/p.fps;pendingSeek=null;}last=-1;draw();};voice.onseeked=()=>{last=-1;draw();};voice.onplay=()=>source.pause();}else voice.hidden=true;
const edit=p.productionProfile?.audioEdit;
if(record.sourceAudioUrl&&edit?.decision==='trim'){
 source.src=record.sourceAudioUrl;source.onplay=()=>voice.pause();for(const id of ['intro','outro'])document.querySelector<HTMLButtonElement>('#'+id)!.disabled=true;source.onloadedmetadata=()=>{for(const id of ['intro','outro'])document.querySelector<HTMLButtonElement>('#'+id)!.disabled=false;};document.querySelector('#cut-interval')!.textContent=edit.startSeconds+' – '+edit.endSeconds+' s';
 const play=(from:number,to:number)=>{if(!source.readyState)return;voice.pause();source.currentTime=from;sourceStop=to;void source.play();};
 document.querySelector<HTMLButtonElement>('#intro')!.onclick=()=>play(0,Math.min(source.duration,edit.startSeconds+4));
 document.querySelector<HTMLButtonElement>('#outro')!.onclick=()=>play(Math.max(0,edit.endSeconds-5),source.duration);
 source.ontimeupdate=()=>{if(sourceStop!==null&&source.currentTime>=sourceStop){source.pause();sourceStop=null;}};
}else document.querySelector<HTMLElement>('#trim')!.hidden=true;
const cueId=new URLSearchParams(location.hash.slice(1)).get('cue'),initial=p.cues.find(c=>c.id===cueId);if(initial)seek(initial.startFrame);cues();
function tick(){draw();requestAnimationFrame(tick);}requestAnimationFrame(tick);
