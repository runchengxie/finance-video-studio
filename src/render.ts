import {readFile,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {html,schema,srt,type Project} from './core.js';
import {writeFile} from 'node:fs/promises';

export async function fontCss():Promise<string>{
  const root=fileURLToPath(new URL('../node_modules/@fontsource/noto-sans-sc/',import.meta.url));
  const css=await readFile(path.join(root,'400.css'),'utf8');
  let result=css;
  for(const match of css.matchAll(/url\(([^)]+)\)/g)){
    const name=match[1]!.replace(/["']/g,'');
    const data=await readFile(path.join(root,name));
    result=result.replace(match[0],`url(data:font/woff2;base64,${data.toString('base64')})`);
  }
  return result;
}
export function ffmpeg(args:string[]):string{
  return execFileSync(process.env.FFMPEG_PATH??'ffmpeg',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
}
export async function render(input:Project,out:string,audio?:string):Promise<void>{
  const p=schema.parse(input);
  if(!path.isAbsolute(out)) throw new Error('Output directory must be absolute and outside repository');
  const repo=fileURLToPath(new URL('../',import.meta.url));
  if(path.relative(repo,out)==='' || !path.relative(repo,out).startsWith('..')) throw new Error('Output must be outside repository');
  await mkdir(out,{recursive:true});
  if((await readdir(out)).length) throw new Error('Output directory must be empty');
  const font=await fontCss();
  const browser=await chromium.launch({headless:true});
  const hashes:Record<number,string>={};
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
    await page.route('**/*',route=>route.abort());
    for(let frame=0;frame<p.frames;frame++){
      if(frame===0) await page.setContent(html(p,frame,font));
      else await page.evaluate(markup=>{document.body.innerHTML=markup;},html(p,frame,'').split('<body>')[1]!.split('</body>')[0]!);
      await page.evaluate(()=>document.fonts.ready);
      const fits=await page.evaluate(()=>{
        const elements=Array.from(document.querySelectorAll('h1,.caption,svg text'));
        return document.fonts.check('28px "Noto Sans SC"','虚构数据') && elements.every(el=>{
          const r=el.getBoundingClientRect();return r.left>=0&&r.right<=1280&&r.top>=0&&r.bottom<=720&&(!(el instanceof HTMLElement)||el.scrollWidth<=el.clientWidth);
        });
      });
      if(!fits) throw new Error(`Font or overflow check failed at frame ${frame}`);
      const png=await page.screenshot({path:path.join(out,`${String(frame).padStart(6,'0')}.png`),animations:'disabled'});
      if([0,Math.floor(p.frames/2),p.frames-1].includes(frame)) {
        hashes[frame]=createHash('sha256').update(png).digest('hex');
        const tealPixels=await page.evaluate(async data=>{
          const img=new Image();img.src=data;await img.decode();
          const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
          const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);
          const rgba=ctx.getImageData(0,0,1280,720).data;let count=0;
          for(let i=0;i<rgba.length;i+=4) if(rgba[i]===84&&rgba[i+1]===214&&rgba[i+2]===191) count++;
          return count;
        },`data:image/png;base64,${png.toString('base64')}`);
        if(p.data.some(d=>d.value>0)&&tealPixels<500) throw new Error(`Keyframe chart visual check failed: ${frame}`);
      }
    }
  }finally{await browser.close();}
  const audioArgs=audio?['-i',path.resolve(audio),'-map','0:v:0','-map','1:a:0','-af','apad','-c:a','aac','-b:a','192k']:['-an'];
  ffmpeg(['-y','-framerate',String(p.fps),'-i',path.join(out,'%06d.png'),...audioArgs,'-frames:v',String(p.frames),'-t',String(p.frames/p.fps),'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'video.mp4')]);
  await writeFile(path.join(out,'captions.srt'),srt(p));
  await writeFile(path.join(out,'render.json'),JSON.stringify({frames:p.frames,fps:p.fps,width:1280,height:720,audio:audio?'local audio supplied':'SILENT — no narration',keyframeHashes:hashes},null,2));
}
