import path from 'node:path';
import {capturePage} from './capture.js';
import {escapeHtml as e} from './templates.js';
import type {ProductionProject} from './manifest.js';
import {deliveryLabels} from './delivery-locales.js';
import {assertAudienceReady} from './preflight.js';
import {visualPalette} from './visual-profile.js';

export async function renderCovers(project:ProductionProject,output:string,assets:ReadonlyMap<string,string>):Promise<string[]>{
 assertAudienceReady(project);
 const l=deliveryLabels[project.contentLanguage],cover=project.delivery?.cover;
 const image=cover?.imageId?assets.get(cover.imageId):undefined;
 if(cover?.imageId&&!image)throw new Error('cover_image_missing');
 const session=await capturePage(),files:string[]=[];
 try{for(const [name,width,height] of [['cover-3x4.png',1080,1440],['cover-4x3.png',1440,1080]] as const){
  await session.page.setViewportSize({width,height});
  await session.page.setContent(`<!doctype html><html lang="${project.contentLanguage}"><meta charset="utf-8"><style>${session.font}*{box-sizing:border-box}body{margin:0;width:${width}px;height:${height}px;background:#f8f5ef;color:#25282b;font-family:'Noto Sans SC',sans-serif}.page{position:relative;height:100%;padding:72px 76px;overflow:hidden}.series{font-size:28px;letter-spacing:3px;border-bottom:2px solid #d9d1c7;padding-bottom:25px;color:#b92a28}.copy{position:relative;z-index:2;width:${width===1080?'928':'780'}px;margin-top:92px}h1{margin:0;white-space:pre-line;font-size:106px;line-height:1.65;overflow-wrap:anywhere;max-height:450px;overflow:hidden}.subtitle{font-size:30px;line-height:1.6;margin-top:36px;color:#796d63;overflow-wrap:anywhere}.art{position:absolute;${width===1080?'left:76px;right:76px;bottom:125px;height:500px':'right:55px;bottom:125px;width:490px;height:510px'};object-fit:contain}.foot{position:absolute;left:76px;right:76px;bottom:60px;border-top:2px solid #d9d1c7;padding-top:20px;font-size:20px;line-height:1.5;color:#796d63}.edge{position:absolute;left:0;bottom:0;background:#b92a28;width:35%;height:9px}</style><div class="page"><div class="series">${e(cover?.series??l.series)}</div><div class="copy"><h1>${e(cover?.headline??project.title)}</h1><div class="subtitle">${e(cover?.subtitle??l.subtitle)}</div></div>${image?`<img class="art" src="${image}" alt="${e(cover?.imageLabel??'')}">`:''}<div class="foot">${e([project.fictional?l.fictional:'',image?cover?.imageLabel:''].filter(Boolean).join(' · '))}</div><div class="edge"></div></div>`);
  if(project.render.visual){const c=visualPalette(project);await session.page.addStyleTag({content:`body{background:${c.background};color:${c.ink}}.series{color:${c.accent}}.subtitle,.foot{color:${c.muted}}.edge{background:${c.accent}}`});}
  await session.page.evaluate(async()=>{await document.fonts.ready;await Promise.all(Array.from(document.images).map(i=>i.decode()));
   const h=document.querySelector('h1')!;for(let size=106;h.scrollHeight>h.clientHeight+1&&size>52;size-=2)h.style.fontSize=`${size-2}px`;
  });
  const problems=await session.page.evaluate(()=>{
   const issues:string[]=[];const copy=document.querySelector('.copy')!.getBoundingClientRect(),art=document.querySelector('.art')?.getBoundingClientRect(),foot=document.querySelector('.foot')!.getBoundingClientRect();
   for(const el of Array.from(document.querySelectorAll<HTMLElement>('.series,h1,.subtitle,.foot'))){const r=el.getBoundingClientRect();if(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1||r.left<0||r.right>innerWidth||r.bottom>innerHeight)issues.push('text_overflow:'+el.tagName+':'+[el.scrollWidth,el.clientWidth,el.scrollHeight,el.clientHeight,r.right,r.bottom].join('/'))}
   if(copy.bottom>foot.top)issues.push('footer_collision');
   if(art&&Math.min(copy.right,art.right)>Math.max(copy.left,art.left)&&Math.min(copy.bottom,art.bottom)>Math.max(copy.top,art.top))issues.push('art_collision');
   return issues;
  });if(problems.length)throw new Error(`cover_layout:${problems.join(',')}`);
  await session.page.screenshot({path:path.join(output,name)});files.push(name);
 }}finally{await session.close()}return files;
}



