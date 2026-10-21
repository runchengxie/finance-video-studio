import {type ProductionProject,type Scene} from './manifest.js';
import {sceneState,type SceneState} from './scene-state.js';
import {labels} from './locales.js';
import {escapeHtml as e} from './templates.js';
const format=(v:number)=>new Intl.NumberFormat('en',{maximumFractionDigits:8}).format(v);
const ease=(x:number)=>1-Math.pow(1-Math.max(0,Math.min(1,x)),3);
function target(state:SceneState,id:string,body:string):string {
 const t=state.targets[id]!;const alpha=!t.visible?0:t.action==='reveal'?ease(t.progress):1;
 return `<div class="target" data-target="${e(id)}" style="opacity:${alpha};transform:translateY(${(1-alpha)*12}px)">${body}</div>`;
}
export function signedBars(scene:Extract<Scene,{template:'comparison'|'signed-comparison'}>,state:SceneState):string {
 const {items}=scene.data,lo=Math.min(0,...items.map(x=>x.value)),hi=Math.max(0,...items.map(x=>x.value)),span=hi-lo||1;
 const left=8,width=700,zero=left+(-lo/span)*width;
 return `<div class="unit" data-fit>${e(scene.data.unit)}</div><div class="bars">`+items.map(item=>{
  const end=left+(item.value-lo)/span*width;
  return target(state,item.id,`<div class="bar-label" data-fit>${e(item.label)}<span>${e(format(item.value))} ${e(scene.data.unit)}</span></div><svg viewBox="0 0 720 36" preserveAspectRatio="none"><line x1="${zero}" x2="${zero}" y1="0" y2="36" stroke="#c6cdd2"/><rect data-bar data-zero="${zero}" x="${Math.min(zero,end)}" y="5" width="${Math.abs(end-zero)}" height="26" fill="${item.value<0?'#acbac4':'#d33c76'}"/></svg>`);
 }).join('')+'</div>';
}
function content(scene:Scene,state:SceneState,p:ProductionProject):string {
 const l=labels[p.contentLanguage];
 switch(scene.template){
  case 'metric':return target(state,scene.data.id,`<div class="unit" data-fit>${e(scene.data.label)}</div><div class="metric" data-fit>${e(format(scene.data.value))}<small>${e(scene.data.unit)}</small></div>${scene.data.qualifier?`<div class="qualifier" data-fit>${e(scene.data.qualifier)}</div>`:''}`);
  case 'comparison':case 'signed-comparison':{
   const d=scene.template==='comparison'?scene.data.difference:undefined;
   return signedBars(scene,state)+(d&&state.targets[d.leftId]?.visible&&state.targets[d.rightId]?.visible?`<div class="difference" data-fit>${e(d.label)} <b>${e(format(scene.data.items.find(x=>x.id===d.rightId)!.value-scene.data.items.find(x=>x.id===d.leftId)!.value))}</b> ${e(scene.data.unit)}</div>`:'');
  }
  case 'evidence':return target(state,scene.data.id,`<div class="unit" data-fit>${l.evidence}</div><div class="excerpt" data-fit>${e(scene.data.text)}</div>`);
  case 'process':return `<div class="steps" style="--columns:${scene.data.items.length<=3?scene.data.items.length:2}">`+scene.data.items.map((x,i)=>target(state,x.id,`<article><div class="unit" data-fit>${l.step} ${i+1}</div><h2 data-fit>${e(x.label)}</h2><p data-fit>${e(x.detail)}</p></article>`)).join('')+'</div>';
  case 'trend':{
   const vals=scene.data.series.flatMap(x=>x.values.map(v=>v.value)),lo=Math.min(0,...vals),hi=Math.max(1,...vals),y=(v:number)=>420-(v-lo)/(hi-lo)*330;
   return `<div class="unit" data-fit>${e(scene.data.unit)}</div><svg viewBox="0 0 1500 510" class="plot"><path d="M80 60V420H1450" fill="none" stroke="#9eacb5"/>${scene.data.series.map((s,j)=>`<g opacity="${state.targets[s.id]!.visible?1:0}"><polyline points="${s.values.map((v,i)=>`${80+i/(s.values.length-1)*1370},${y(v.value)}`).join(' ')}" stroke="${j?'#acbac4':'#d33c76'}" stroke-width="6" fill="none"/><text data-fit x="${80+j*360}" y="495" font-size="28">${e(s.label)}</text></g>`).join('')}<text data-fit x="80" y="460" font-size="24">${e(scene.data.series[0]!.values[0]!.label)}</text><text data-fit x="1450" y="460" text-anchor="end" font-size="24">${e(scene.data.series[0]!.values.at(-1)!.label)}</text><text data-fit x="5" y="65" font-size="22">${format(hi)}</text><text data-fit x="5" y="420" font-size="22">${format(lo)}</text></svg>`;
  }
  case 'waterfall':{
   const pts=[scene.data.start,...scene.data.steps,scene.data.end];let total=scene.data.start.value;
   const spans=pts.map((v,i)=>{if(i===0||i===pts.length-1)return {v,a:0,b:v.value};const a=total;total+=v.value;return {v,a,b:total};});
   const lo=Math.min(0,...spans.flatMap(x=>[x.a,x.b])),hi=Math.max(1,...spans.flatMap(x=>[x.a,x.b])),y=(v:number)=>420-(v-lo)/(hi-lo)*330,w=1400/pts.length;
   return `<div class="unit" data-fit>${e(scene.data.unit)}</div><svg viewBox="0 0 1500 510" class="plot"><path d="M0 ${y(0)}H1450" stroke="#acbac4"/>${spans.map(({v,a,b},i)=>`<g opacity="${state.targets[v.id]!.visible?1:0}"><rect x="${i*w+8}" y="${Math.min(y(a),y(b))}" width="${w*.7}" height="${Math.abs(y(a)-y(b))}" fill="${v.value<0?'#acbac4':'#d33c76'}"/><text data-fit x="${i*w+8}" y="${Math.min(y(a),y(b))-14}" font-size="26">${format(v.value)}</text><text data-fit x="${i*w+8}" y="470" font-size="24">${e(v.label)}</text></g>`).join('')}</svg>`;
  }
 }
}
export function broadcastSceneHtml(p:ProductionProject,sceneId:string,frame:number,fontCss:string,assets:ReadonlyMap<string,string>=new Map()):string {
 const scene=p.scenes.find(s=>s.id===sceneId)!;const state=sceneState(p,sceneId,frame),l=labels[p.contentLanguage],view=scene.presentation;
 const layout=view?.layout??'explanation',sidebar=view?.sidebar??[],panels=view?.evidencePanels??[];
 const cueActive=(id:string)=>frame>=p.cues.find(c=>c.id===id)!.startFrame;
 const documents=panels.map(panel=>{
  const uri=assets.get(panel.inputId);if(!uri||!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(uri))throw new Error(`missing_visual_asset:${panel.inputId}`);
  const h=panel.highlight;
  return `<section class="document"><div class="doc-label" data-fit>${e(panel.label)} · ${e(panel.pageLabel)}</div><div class="image-wrap"><img src="${uri}" alt="${e(panel.label)}">${h?`<div data-highlight class="highlight" style="opacity:${cueActive(h.cueId)?1:0};left:${h.x*100}%;top:${h.y*100}%;width:${h.width*100}%;height:${h.height*100}%"></div>`:''}</div></section>`;
 }).join('');
 const citations=[...new Set([...scene.sourceIds,...(scene.template==='evidence'?[scene.data.sourceId]:[])])].map(id=>p.sources.find(s=>s.id===id)!.citation).join(' · ');
 const progress=(p.scenes.indexOf(scene)+1)/p.scenes.length*100,entry=ease((frame-scene.from)/18);
 return `<!doctype html><html lang="${p.contentLanguage}"><head><meta charset="utf-8"><style>${fontCss}
 *{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:transparent;color:#eef0ee;font-family:"Noto Sans SC",sans-serif}.broadcast{position:relative;width:1920px;height:1080px;background:rgba(13,20,24,.70)}
 .mast{position:absolute;left:64px;right:64px;top:38px;height:64px;display:flex;align-items:center;gap:24px;border-bottom:1px solid #69747c66;padding-bottom:8px}.brand{background:#b72c62;padding:8px 22px;font-size:26px;font-weight:700;white-space:nowrap}.series{font-size:24px;max-width:1100px;height:40px}.index{margin-left:auto;color:#9ba5ac;font-size:22px;white-space:nowrap}.title{position:absolute;left:64px;top:116px;width:1792px;height:70px;font-size:44px;font-weight:700;line-height:1.5;margin:0}
 .content{position:absolute;left:64px;top:204px;width:1792px;height:594px;display:grid;gap:44px;grid-template-columns:${layout==='evidence'?'526px minmax(0,1fr)'+(sidebar.length?' 312px':''):sidebar.length?'minmax(0,1fr) 312px':'minmax(0,1fr)'}}
 .main{min-width:0;height:594px;padding:12px 0;opacity:${entry};transform:translateY(${(1-entry)*18}px)}.documents{background:#202a30;border:1px solid #71808a55;height:594px;padding:18px;display:flex;flex-direction:column;gap:18px}.documents-heading{background:#b72c62;font-size:24px;padding:10px;margin:-18px -18px 0}.document{min-height:0;flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:10px}.doc-label{font-size:21px;width:100%;max-height:62px}.image-wrap{position:relative;min-height:0;max-width:100%;align-self:center;line-height:0}.image-wrap img{display:block;max-width:100%;max-height:${panels.length>1?178:444}px;width:auto;height:auto}.highlight{position:absolute;background:#f1c34a66;outline:3px solid #b72c62;mix-blend-mode:multiply}
 .side{height:594px;background:#1c282fdd;border-top:4px solid #b72c62;padding:24px}.side h2{font-size:24px;margin:0 0 28px}.side-item{font-size:25px;line-height:1.5;border-top:1px solid #6c7b8544;padding:20px 0;color:#8c9aa4}.side-item.active{color:#f1f4f5}.side-item b{color:#e45388;margin-right:14px}.unit{font-size:26px;color:#b7c2cb;margin-bottom:18px;max-height:80px}.metric{font-size:106px;font-weight:700;line-height:1.2;margin:35px 0;max-height:160px}.metric small{font-size:38px;margin-left:14px}.qualifier{font-size:30px;line-height:1.7;max-height:240px}.excerpt{font-size:${layout==='evidence'?34:44}px;line-height:1.6;max-height:465px}.target{min-width:0}.bars{display:flex;flex-direction:column;gap:12px}.bar-label{display:flex;justify-content:space-between;gap:20px;font-size:${layout==='evidence'?26:30}px;line-height:1.4;max-height:84px}.bar-label span{white-space:nowrap;color:#f0d6df}.bars svg{display:block;width:100%;height:${scene.template==='comparison'||scene.template==='signed-comparison'?Math.min(48,260/scene.data.items.length):40}px;margin:6px 0}.difference{border-top:1px solid #81909c66;margin-top:22px;padding-top:18px;font-size:28px;max-height:100px}.difference b{font-size:44px;color:#e45388}
 .steps{display:grid;grid-template-columns:repeat(var(--columns),minmax(0,1fr));gap:24px;height:100%;align-items:start}.steps article{background:#202b3299;border-top:4px solid #c7366b;padding:24px;height:100%}.steps h2{font-size:34px;line-height:1.5;margin:12px 0 24px}.steps p{font-size:28px;line-height:1.65;margin:0}.plot{width:100%;height:500px;fill:currentColor}.source{position:absolute;left:64px;top:818px;width:1792px;max-height:66px;font-size:22px;line-height:1.45;color:#aebac3}.lower{position:absolute;top:895px;left:0;width:1920px;height:64px;background:#eceee9;color:#141e24;display:flex;align-items:center}.chapter{background:#b72c62;color:white;font-size:25px;padding:12px 36px;height:64px;white-space:nowrap;max-width:650px}.headline{font-size:32px;padding:0 30px;max-height:64px;flex:1;min-width:0}.caption{position:absolute;left:64px;top:971px;width:1792px;max-height:100px;font-size:34px;line-height:1.4;text-align:center}.progress{position:absolute;bottom:0;height:4px;background:#b72c62;width:${progress}%}
 </style></head><body><div class="broadcast"><header class="mast" data-region><div class="brand" data-fit>${e(p.render.broadcast!.programName)}</div><div class="series" data-fit>${e(p.title)}</div><div class="index" data-fit>${p.fictional?l.fictional:''} ${String(p.scenes.indexOf(scene)+1).padStart(2,'0')} / ${p.scenes.length}</div></header><h1 class="title" data-fit data-region>${e(scene.title)}</h1><div class="content" data-region>${layout==='evidence'?`<div class="documents" data-region><div class="documents-heading" data-fit>${l.originalExcerpt}</div>${documents}</div>`:''}<main class="main" data-region>${content(scene,state,p)}</main>${sidebar.length?`<aside class="side" data-region><h2 data-fit>${l.inThisSection}</h2>${sidebar.map((x,i)=>`<div class="side-item ${!x.cueId||cueActive(x.cueId)?'active':''}" data-fit><b>${i+1}</b>${e(x.label)}</div>`).join('')}</aside>`:''}</div><div class="source" data-fit data-region>${citations?l.source+' · '+e(citations):''}</div><div class="lower" data-region><div class="chapter" data-fit>${e(view?.chapterLabel??scene.chapterId??l.evidence)}</div><div class="headline" data-fit>${e(view?.headline??scene.title)}</div></div>${state.caption?`<div class="caption" data-fit data-region>${e(state.caption)}</div>`:''}<div class="progress"></div></div></body></html>`;
}

