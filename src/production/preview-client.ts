import type {ProductionProject} from './manifest.js';
import {sceneHtml} from './templates.js';
import {previewLabels} from './preview-locales.js';

declare global {interface Window {STUDIO_VISUALS?:Record<string,string>;STUDIO_PREVIEW:{project:ProductionProject;audioUrl:string|null;sourceAudioUrl:string|null;fontUrl:string;snapshotHash:string}}}
const record=window.STUDIO_PREVIEW,p=record.project;
const voice=document.querySelector<HTMLAudioElement>('#voice')!,source=document.querySelector<HTMLAudioElement>('#source')!,screen=document.querySelector<HTMLIFrameElement>('#screen')!,slider=document.querySelector<HTMLInputElement>('#frame')!,search=document.querySelector<HTMLInputElement>('#search')!;
let requested=0,last=-1,pendingSeek:number|null=null,sourceStop:number|null=null;
const time=(f:number)=>{const s=Math.floor(f/p.fps);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
function draw(){
 const doc=screen.contentDocument,style=doc?.querySelector('#native-style');if(!doc||!style)return;
 const frame=Math.max(0,Math.min(p.durationFrames-1,record.audioUrl&&voice.readyState?Math.floor(voice.currentTime*p.fps+1e-3):requested));
 if(last===frame)return;last=frame;requested=frame;slider.value=String(frame);
 const scene=p.scenes.find(s=>frame>=s.from&&frame<s.from+s.durationFrames)!;
 const markup=new DOMParser().parseFromString(sceneHtml(p,scene.id,frame,'','improved',new Map(p.inputs.filter(x=>x.mediaType==='image').map(x=>[x.id,window.STUDIO_VISUALS?.[x.sha256]??'']))),'text/html');style.textContent=markup.querySelector('style')!.textContent;doc.body.innerHTML=markup.body.innerHTML;
 document.querySelector('#position')!.textContent=time(frame)+' / '+time(p.durationFrames);
 document.querySelectorAll<HTMLButtonElement>('#cues button').forEach(b=>b.classList.toggle('active',frame>=Number(b.dataset.start)&&frame<Number(b.dataset.end)));
}
function seek(frame:number){requested=Math.max(0,Math.min(p.durationFrames-1,frame));if(record.audioUrl){if(voice.readyState)voice.currentTime=requested/p.fps;else pendingSeek=requested;}last=-1;draw();}
function resize(){screen.style.transform='scale('+(document.querySelector('#stage')!.clientWidth/p.width)+')';}
function cues(){const q=search.value;const list=document.querySelector('#cues')!;list.replaceChildren();for(const cue of p.cues.filter(c=>c.text.includes(q))){const b=document.createElement('button');b.textContent=time(cue.startFrame)+' '+cue.text;b.dataset.start=String(cue.startFrame);b.dataset.end=String(cue.endFrame);b.onclick=()=>seek(cue.startFrame);list.append(b);}last=-1;draw();}
const language=document.querySelector<HTMLSelectElement>('#language')!;
try{language.value=(new URLSearchParams(location.search).get('lang')??localStorage.getItem('finance-preview-language'))==='zh'?'zh':'en';}catch{language.value='en';}
function localize(){const lang=language.value==='zh'?'zh':'en',l=previewLabels[lang];document.documentElement.lang=lang;for(const el of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n]')))el.textContent=l[el.dataset.i18n as keyof typeof l];search.placeholder=l.search;try{localStorage.setItem('finance-preview-language',lang);}catch{/* file storage can be unavailable */}}
language.onchange=localize;localize();document.querySelector('#title')!.textContent=p.title;document.querySelector('#snapshot')!.textContent=record.snapshotHash;
for(const scene of p.scenes){const b=document.createElement('button');b.textContent=time(scene.from)+' '+scene.title;b.onclick=()=>seek(scene.from);document.querySelector('#chapters')!.append(b);}
for(const item of p.sources){const line=document.createElement('p');line.textContent=item.citation;if(item.url){const a=document.createElement('a');a.href=item.url;a.textContent=' ↗';a.target='_blank';a.rel='noopener';line.append(a);}document.querySelector('#sources')!.append(line);}
slider.max=String(p.durationFrames-1);slider.oninput=()=>seek(Number(slider.value));search.oninput=cues;
screen.width=String(p.width);screen.height=String(p.height);document.querySelector<HTMLElement>('#stage')!.style.aspectRatio=p.width+'/'+p.height;
screen.onload=()=>{resize();last=-1;draw();};screen.srcdoc='<link rel="stylesheet" href="'+record.fontUrl+'"><style id="native-style"></style><body></body>';window.addEventListener('resize',resize);
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
