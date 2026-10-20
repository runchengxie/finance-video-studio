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
export async function paint(page:Page,font:string,p:ProductionProject,sceneId:string,frame:number,variant:'improved'|'legacy-comparison'='improved'):Promise<void>{
 const markup=sceneHtml(p,sceneId,frame,loaded.has(page)?'':font,variant);
 if(!loaded.has(page)){await page.setContent(markup);loaded.add(page);}
 else await page.evaluate(html=>{const doc=new DOMParser().parseFromString(html,'text/html');const style=doc.querySelector('style')!.textContent!;let dynamic=document.querySelector('#production-style');if(!dynamic){dynamic=document.createElement('style');dynamic.id='production-style';document.head.append(dynamic);}dynamic.textContent=style;document.body.innerHTML=doc.body.innerHTML;},markup);
 await page.evaluate(async()=>{await document.fonts.load('30px "Noto Sans SC"','虚构示例');await document.fonts.ready;});
 const problems=await page.evaluate(()=>{
  const issues:string[]=[];if(!document.fonts.check('30px "Noto Sans SC"','虚构示例'))issues.push('missing_font');
  const caption=document.querySelector('.caption')?.getBoundingClientRect();
  for(const el of Array.from(document.querySelectorAll('[data-fit]'))){const r=el.getBoundingClientRect();
   if(r.left<0||r.top<0||r.right>1920||r.bottom>1080||el instanceof HTMLElement&&(el.scrollWidth>el.clientWidth||el.scrollHeight>el.clientHeight))issues.push(`overflow:${el.textContent}`);
   if(caption&&el.closest('svg')&&r.bottom>caption.top&&r.top<caption.bottom)issues.push(`caption_collision:${el.textContent}`);
  }return issues;
 });if(problems.length)throw new Error(`layout_check:${problems.join('|')}`);
}

