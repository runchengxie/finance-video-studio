import {chromium,type Page} from 'playwright';
import {fontCss} from '../render.js';
import {sceneHtml} from './templates.js';
import type {ProductionProject} from './manifest.js';
const loaded=new WeakSet<Page>();
export async function capturePage():Promise<{page:Page;font:string;close:()=>Promise<void>}>{
 const font=await fontCss(),browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 await page.route('**/*',route=>route.abort());return {page,font,close:()=>browser.close()};
}
export async function paint(page:Page,font:string,p:ProductionProject,sceneId:string,frame:number,variant:'improved'|'legacy-comparison'='improved',visualAssets:ReadonlyMap<string,string>=new Map()):Promise<void>{
 const markup=sceneHtml(p,sceneId,frame,loaded.has(page)?'':font,variant,visualAssets);
 if(!loaded.has(page)){await page.setContent(markup);loaded.add(page);}
 else await page.evaluate(html=>{const doc=new DOMParser().parseFromString(html,'text/html');const style=doc.querySelector('style')!.textContent!;let dynamic=document.querySelector('#production-style');if(!dynamic){dynamic=document.createElement('style');dynamic.id='production-style';document.head.append(dynamic);}dynamic.textContent=style;document.body.innerHTML=doc.body.innerHTML;},markup);
 await page.evaluate(async()=>{await document.fonts.load('30px "Noto Sans SC"','虚构示例');await document.fonts.ready;await Promise.all(Array.from(document.images).map(img=>img.decode()));});
 const problems=await page.evaluate(()=>{
  const issues:string[]=[];if(!document.fonts.check('30px "Noto Sans SC"','虚构示例'))issues.push('missing_font');
  const caption=document.querySelector('.caption')?.getBoundingClientRect();
  for(const el of Array.from(document.querySelectorAll('[data-fit]'))){if(!el.getClientRects().length)continue;const r=el.getBoundingClientRect();
   const region=el.parentElement?.closest('[data-region]')?.getBoundingClientRect();
   if(region&&(r.left<region.left-1||r.top<region.top-1||r.right>region.right+1||r.bottom>region.bottom+1))issues.push(`region_overflow:${el.textContent}`);
   if(r.left<0||r.top<0||r.right>1920||r.bottom>1080||el instanceof HTMLElement&&(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1))issues.push(`overflow:${el.textContent}`);
   if(caption&&el.closest('svg')&&r.bottom>caption.top&&r.top<caption.bottom)issues.push(`caption_collision:${el.textContent}`);
  }
  for(const svg of Array.from(document.querySelectorAll('svg'))){
   const texts=Array.from(svg.querySelectorAll('text[data-fit]'));
   for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
    const a=texts[i]!.getBoundingClientRect(),b=texts[j]!.getBoundingClientRect();
    if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)issues.push('label_collision:'+texts[i]!.textContent+'/'+texts[j]!.textContent);
   }
  }
  for(const img of Array.from(document.querySelectorAll('.image-wrap img'))){
   const image=img.getBoundingClientRect(),wrap=img.parentElement!.getBoundingClientRect(),panel=img.closest('.document')!.getBoundingClientRect();
   if(Math.abs(image.width-wrap.width)>1||Math.abs(image.height-wrap.height)>1||image.bottom>panel.bottom+1||image.right>panel.right+1)issues.push('image_bounds:'+img.getAttribute('alt'));
  }
  return issues;
 });if(problems.length)throw new Error(`layout_check:${sceneId}:${problems.join('|')}`);
}



