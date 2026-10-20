import {type ProductionProject,type Scene} from './manifest.js';
import {sceneState,type SceneState} from './scene-state.js';
import {designTokens as t} from './design.js';
import {labels} from './locales.js';
export const escapeHtml=(value:unknown)=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const n=(x:number)=>new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(x);
function text(x:number,y:number,value:unknown,size=28,extra=''):string {return `<text data-fit x="${x}" y="${y}" font-size="${size}" ${extra}>${escapeHtml(value)}</text>`;}
function wrap(value:string,limit:number):string[]{const lines:string[]=[];let line='';for(const part of value.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*|\s+|./gu)??[]){if(line.length+part.length>limit&&line){lines.push(line.trim());line='';}line+=part;}if(line.trim())lines.push(line.trim());return lines;}
function chart(scene:Scene,state:SceneState,lang:ProductionProject['contentLanguage']):string {
 const l=labels[lang];const focus=Object.values(state.targets).some(s=>s.active);const group=(id:string,body:string)=>{const s=state.targets[id]!;const opacity=!s.visible?0:s.action==='reveal'?s.progress:focus&&!s.active?.55:1;return `<g data-target="${escapeHtml(id)}" opacity="${opacity}" ${s.active&&s.action!=='reveal'?`stroke="${t.secondary}" stroke-width="2"`:''}>${body}</g>`;};
 const unit='unit' in scene.data?text(0,30,`${l.unit} · ${scene.data.unit}`,25,`fill="${t.muted}"`):'';
 switch(scene.template){
  case 'metric':return unit+group(scene.data.id,text(0,220,n(scene.data.value),130)+text(0,305,scene.data.label,40)+(scene.data.qualifier?wrap(scene.data.qualifier,65).map((s,i)=>text(0,400+i*38,s,28,`fill="${t.muted}"`)).join(''):''));
  case 'comparison':{
   const {items,difference}=scene.data,max=Math.max(1,...items.map(x=>x.value)),gap=Math.min(110,510/items.length),top=100;
   let body=unit+`<path d="M 400 70 V ${top+items.length*gap}" stroke="${t.muted}"/>`+text(400,top+items.length*gap+35,'0',23);
   body+=items.map((item,i)=>group(item.id,text(0,top+i*gap+34,item.label,28)+`<rect x="400" y="${top+i*gap}" width="${item.value/max*920}" height="48" rx="7" fill="${t.accent}"/>`+text(1345,top+i*gap+34,n(item.value),30))).join('');
   if(difference&&state.targets[difference.leftId]!.visible&&state.targets[difference.rightId]!.visible){const left=items.findIndex(x=>x.id===difference.leftId),right=items.findIndex(x=>x.id===difference.rightId),a=top+left*gap+24,b=top+right*gap+24;body+=`<path d="M 1570 ${a} h 24 V ${b} h -24" fill="none" stroke="${t.secondary}" stroke-width="3"/>`+text(1640,(a+b)/2,`${difference.label}`,25,`text-anchor="end" fill="${t.secondary}"`)+text(1640,(a+b)/2+42,n(items[right]!.value-items[left]!.value),36,`text-anchor="end" fill="${t.secondary}"`);}return body;
  }
  case 'waterfall':{
   const points=[scene.data.start,...scene.data.steps,scene.data.end];let total=scene.data.start.value;const spans=points.map((p,i)=>{if(i===0||i===points.length-1)return {p,a:0,b:p.value};const a=total;total+=p.value;return {p,a,b:total};});
   const lo=Math.min(0,...spans.flatMap(x=>[x.a,x.b])),hi=Math.max(1,...spans.flatMap(x=>[x.a,x.b])),y=(v:number)=>480-(v-lo)/(hi-lo)*350,w=1480/points.length;
   return unit+`<path d="M 0 ${y(0)} H 1550" stroke="${t.muted}"/>`+spans.map(({p,a,b},i)=>group(p.id,`<rect x="${i*w+15}" y="${Math.min(y(a),y(b))}" width="${w*.65}" height="${Math.max(2,Math.abs(y(a)-y(b)))}" rx="4" fill="${p.value<0?t.negative:t.accent}"/>`+text(i*w+15,Math.min(y(a),y(b))-18,n(p.value),26)+text(i*w+15,545,p.label,24))).join('');
  }
  case 'trend':{
   const values=scene.data.series.flatMap(s=>s.values.map(x=>x.value)),lo=Math.min(0,...values),hi=Math.max(1,...values),y=(v:number)=>470-(v-lo)/(hi-lo)*350;
   return unit+`<path d="M 100 70 V 470 H 1550 M 100 ${y(0)} H 1550" fill="none" stroke="${t.muted}"/>`+text(0,90,n(hi),22)+text(0,470,n(lo),22)+scene.data.series.map((s,j)=>group(s.id,`<polyline points="${s.values.map((v,i)=>`${100+i/(s.values.length-1)*1450},${y(v.value)}`).join(' ')}" fill="none" stroke="${[t.accent,t.secondary,t.negative,'#9da4ef'][j]}" stroke-width="6"/>`+text(180+j*350,570,s.label,26))).join('')+text(100,520,scene.data.series[0]!.values[0]!.label,24)+text(1550,520,scene.data.series[0]!.values.at(-1)!.label,24,'text-anchor="end"');
  }
  case 'process':{const w=1620/scene.data.items.length;return scene.data.items.map((p,i)=>{
   const title=wrap(p.label,Math.floor((w-48)/40)),detail=wrap(p.detail,Math.floor((w-48)/32));
   if(title.length>2||detail.length>3)throw new Error(`process_density:${p.id}: shorten labels or split the scene`);
   const detailTop=title.length===1?335:395;
   return group(p.id,`<rect x="${i*w}" y="90" width="${w-24}" height="480" rx="18" fill="${t.surface}"/>`+text(i*w+24,150,`${l.step} ${i+1}`,28,`fill="${t.accent}"`)+title.map((s,j)=>text(i*w+24,220+j*60,s,40)).join('')+detail.map((s,j)=>text(i*w+24,detailTop+j*48,s,32,`fill="${t.muted}"`)).join(''));
  }).join('');}
  case 'evidence':return group(scene.data.id,text(0,60,l.evidence,26,`fill="${t.accent}"`)+wrap(scene.data.text,58).map((s,i)=>text(0,150+i*48,s,34)).join(''));
 }
}
export function sceneHtml(project:ProductionProject,sceneId:string,frame:number,fontCss:string,variant:'improved'|'legacy-comparison'='improved'):string {
 const state=sceneState(project,sceneId,frame),scene=project.scenes.find(s=>s.id===sceneId)!,l=labels[project.contentLanguage];
 const sources=[...new Set([...scene.sourceIds,...(scene.template==='evidence'?[scene.data.sourceId]:[])])].map(id=>project.sources.find(s=>s.id===id)!.citation).join(' · ');
 if(variant==='legacy-comparison'&&scene.template==='comparison'){
  const cards=scene.data.items.map((p,i)=>`<div data-fit style="position:absolute;left:${96+i*850}px;top:300px;width:780px;padding:50px;background:${t.surface};border-radius:20px;font-size:40px">${escapeHtml(p.label)}<p style="font-size:100px;margin:30px 0">${n(p.value)}</p>${escapeHtml(scene.data.unit)}</div>`).join('');
  return `<!doctype html><html><head><style>${fontCss}body{margin:0;background:${t.background};color:${t.ink};font-family:"Noto Sans SC";width:1920px;height:1080px}h1{position:absolute;left:96px;top:80px;font-size:50px}.caption{position:absolute;left:144px;top:900px;width:1632px;font-size:36px;text-align:center}</style></head><body><h1 data-fit>${escapeHtml(scene.title)}</h1>${cards}<div data-fit style="position:absolute;left:96px;top:810px;font-size:20px">${escapeHtml(sources)}</div>${state.caption?`<div data-fit class="caption">${escapeHtml(state.caption)}</div>`:''}</body></html>`;
 }
 return `<!doctype html><html lang="${project.contentLanguage}"><head><meta charset="utf-8"><style>${fontCss}*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:${t.background};color:${t.ink};font-family:"Noto Sans SC",sans-serif}svg{position:absolute;inset:0;fill:currentColor;font-family:inherit}h1{position:absolute;left:96px;top:88px;width:1728px;margin:0;font-size:50px;line-height:1.5}header{position:absolute;left:96px;top:38px;font-size:22px;letter-spacing:3px;color:${t.accent}}.caption{position:absolute;left:144px;top:880px;width:1632px;max-height:132px;padding:14px 28px;background:#172b3e;border-radius:12px;text-align:center;font-size:36px;line-height:1.4}.source{position:absolute;left:96px;top:810px;width:1728px;font-size:20px;line-height:1.4;color:${t.muted};max-height:56px;overflow:hidden}</style></head><body><header data-fit>${project.fictional?l.fictional:escapeHtml(project.id)} · ${escapeHtml(String(project.scenes.indexOf(scene)+1).padStart(2,'0'))}</header><h1 data-fit>${escapeHtml(scene.title)}</h1><svg width="1920" height="1080" viewBox="0 0 1920 1080"><g transform="translate(112 200)">${chart(scene,state,project.contentLanguage)}</g></svg>${sources?`<div data-fit class="source">${l.source} · ${escapeHtml(sources)}</div>`:''}${state.caption?`<div data-fit class="caption">${escapeHtml(state.caption)}</div>`:''}</body></html>`;
}

