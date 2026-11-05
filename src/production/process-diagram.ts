import type {ProductionProject,Scene} from './manifest.js';
import type {SceneState} from './scene-state.js';
import {labels} from './locales.js';
import {visualPalette} from './visual-profile.js';
import {escapeHtml as e} from './templates.js';

const lines=(text:string,width:number)=>{const result:string[]=[];let line='';for(const token of text.match(/[A-Za-z0-9]+|\s+|./gu)??[]){if(line.length+token.length>width&&line){result.push(line.trim());line='';}line+=token;}if(line.trim())result.push(line.trim());return result;};
export function processDiagram(scene:Extract<Scene,{template:'process'}>,state:SceneState,p:ProductionProject):string {
 const c=visualPalette(p),art=!!scene.presentation?.illustration,width=art?510:840,n=scene.data.items.length,step=540/n,nodeHeight=step-((scene.data.links?.length||scene.presentation?.processStyle==='chain'||scene.presentation?.processStyle==='cycle')?40:20),branches=scene.presentation?.processStyle==='branches',left=branches?260:75,nodeWidth=width-left-75;
 const progress=(id:string)=>{const t=state.targets[id]!;return !t.visible?0:t.action==='reveal'?1-(1-t.progress)**3:1;};
 const links=scene.data.links??(['parallel','branches'].includes(scene.presentation?.processStyle??'')?[]:scene.data.items.slice(1).map((x,i)=>({fromId:scene.data.items[i]!.id,toId:x.id,label:''})));
 const paths=links.map(link=>{
  const a=scene.data.items.findIndex(x=>x.id===link.fromId),b=scene.data.items.findIndex(x=>x.id===link.toId),forward=b===a+1;
  const x=left+nodeWidth/2,from=a*step+nodeHeight,to=b*step,mid=(from+to)/2,alpha=Math.min(progress(link.fromId),progress(link.toId));
  const path=forward?`M${x} ${from}V${to}`:`M${left+nodeWidth} ${a*step+nodeHeight/2}H${width-24}V${b*step+nodeHeight/2}H${left+nodeWidth}`;
  return `<g opacity="${alpha}"><path data-link="${e(link.fromId+'-'+link.toId)}" d="${path}" fill="none" stroke="${c.secondary}" stroke-width="4" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-alpha}"/><circle cx="${forward?x:width-24}" cy="${forward?from+(to-from)*alpha:a*step+nodeHeight/2+(b-a)*step*alpha}" r="6" fill="${c.accent}"/>${link.label?`<text x="${forward?x+18:width-18}" y="${forward?mid+7:(a+b)*step/2+nodeHeight/2}" data-fit style="font-size:20px;${forward?'':'writing-mode:vertical-rl'}">${e(link.label)}</text>`:''}<path d="${forward?`M${x-7} ${to-10}l7 8 7-8`:`M${left+nodeWidth+9} ${b*step+nodeHeight/2-6}l-8 6 8 6`}" fill="none" stroke="${c.secondary}" stroke-width="3"/></g>`;
 }).join('');
 const hub=branches?`<rect x="0" y="224" width="158" height="92" rx="16" fill="${c.accent}"/><text x="79" y="278" text-anchor="middle" style="fill:${c.background};font-size:27px">${e(labels[p.contentLanguage].dimensions)}</text>`:'';
 const branchPaths=branches?scene.data.items.map((item,i)=>`<path data-link="branch-${e(item.id)}" d="M158 270H202V${i*step+nodeHeight/2}H${left}" fill="none" stroke="${c.secondary}" stroke-width="4" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-progress(item.id)}" opacity="${progress(item.id)}"/>`).join(''):'';
 const nodes=scene.data.items.map((item,i)=>{
  const titleSize=art?29:34,detailSize=art?23:27,titleLine=Math.ceil(titleSize*1.55),detailLine=Math.ceil(detailSize*1.55),titles=lines(item.label,Math.floor((nodeWidth-36)/titleSize)),details=lines(item.detail,Math.floor((nodeWidth-36)/detailSize));
  const available=nodeHeight-16,needed=titles.length*titleLine+details.length*detailLine+6;if(needed>available)throw new Error('process_diagram_density:'+item.id);
  return `<g data-target="${e(item.id)}" opacity="${progress(item.id)}" style="filter:${state.targets[item.id]!.active&&state.targets[item.id]!.action!=='reveal'?'brightness(1.3) drop-shadow(0 0 5px '+c.accent+')':'none'}" transform="translate(${left} ${i*step})"><rect width="${nodeWidth}" height="${nodeHeight}" rx="14" fill="${c.background}" stroke="${c.muted}66"/><circle cx="${branches?-24:-34}" cy="28" r="22" fill="${c.accent}"/><text x="${branches?-24:-34}" y="36" text-anchor="middle" style="fill:${c.background};font-size:23px">${i+1}</text>${titles.map((line,j)=>`<text data-fit x="18" y="${titleSize+8+j*titleLine}" style="font-size:${titleSize}px;font-weight:700">${e(line)}</text>`).join('')}${details.map((line,j)=>`<text data-fit x="18" y="${titles.length*titleLine+detailSize+13+j*detailLine}" style="font-size:${detailSize}px;fill:${c.muted}">${e(line)}</text>`).join('')}</g>`;
 }).join('');
 return `<svg class="process-diagram" width="${width}" height="540" viewBox="0 0 ${width} 540">${hub}${paths}${branchPaths}${nodes}</svg>`;
}
