import {z} from 'zod';
import {parse} from 'csv-parse/sync';

export const schema = z.object({
  title:z.string().min(1).max(28), fictional:z.boolean(),
  fps:z.literal(30), frames:z.number().int().min(60).max(18000),
  unit:z.enum(['USD million','%']), chart:z.enum(['bar','line']),
  data:z.array(z.object({label:z.string().min(1).max(12),value:z.number().finite().min(0).max(1e9)}).strict()).min(2).max(8),
  captions:z.array(z.object({start:z.number().int().nonnegative(),end:z.number().int().positive(),text:z.string().min(1).max(45)}).strict()).min(1).max(20)
}).strict().superRefine((v,ctx)=>{
  let end=0;
  for(const c of v.captions){
    if(c.start<end || c.end<=c.start || c.end>v.frames) ctx.addIssue({code:'custom',message:'Invalid caption ordering or bounds'});
    end=c.end;
  }
});
export type Project=z.infer<typeof schema>;
export function csvData(csv:string):Project['data']{
  const rows=parse(csv,{columns:true,skip_empty_lines:true,bom:true}) as Record<string,string>[];
  return rows.map(r=>{
    if(Object.keys(r).sort().join(',')!=='label,value' || !r.value?.trim() || !/^(?:\d+\.?\d*|\.\d+)$/.test(r.value)) throw new Error('CSV requires label,value and finite nonnegative decimal values');
    return {label:r.label!,value:Number(r.value)};
  });
}
export function format(value:number,unit:Project['unit']):string{
  if(!Number.isFinite(value)||value<0) throw new Error('Invalid value');
  return new Intl.NumberFormat('en-US',{minimumFractionDigits:1,maximumFractionDigits:1}).format(value)+(unit==='%'?'%':'M USD');
}
export function srt(p:Project):string{
  const stamp=(frame:number)=>{
    const ms=Math.round(frame*1000/p.fps);
    return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;
  };
  return p.captions.map((c,i)=>`${i+1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n');
}
export function html(p:Project,frame:number,fontCss:string):string{
  if(!Number.isInteger(frame)||frame<0||frame>=p.frames) throw new Error('Frame out of bounds');
  const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  const max=Math.max(...p.data.map(d=>d.value),1);
  const coords=p.data.map((d,i)=>({x:120+i*1000/(p.data.length-1),y:550-d.value/max*300}));
  const marks=p.data.map((d,i)=>{const c=coords[i]!;return `${p.chart==='bar'?`<rect x="${c.x-35}" y="${c.y}" width="70" height="${550-c.y}" fill="#54d6bf"/>`:`<circle cx="${c.x}" cy="${c.y}" r="7" fill="#54d6bf"/>`}<text x="${c.x}" y="590" text-anchor="middle">${escape(d.label)}</text><text x="${c.x}" y="${c.y-20}" text-anchor="middle">${format(d.value,p.unit)}</text>`;}).join('');
  const caption=p.captions.find(c=>frame>=c.start&&frame<c.end)?.text??'';
  const disclosure=p.fictional?'FICTIONAL DATA · 虚构数据':'HUMAN REVIEWED · 人工审稿';
  return `<!doctype html><html><head><style>${fontCss}*{box-sizing:border-box}body{margin:0;background:#101c30;color:#edf5ff;font-family:'Noto Sans SC';width:1280px;height:720px;padding:40px}h1{font-size:44px;margin:0}p{color:#f3c869;font-size:20px}svg{position:absolute;left:0;top:0;width:1280px;height:650px}text{fill:#edf5ff;font-size:21px}.caption{position:absolute;bottom:24px;left:60px;width:1160px;text-align:center;font-size:28px;white-space:nowrap}</style></head><body><h1>${escape(p.title)}</h1><p>${disclosure} · ${escape(p.unit)} · ${frame+1}/${p.frames}</p><svg xmlns="http://www.w3.org/2000/svg"><path d="M80 550H1200" stroke="#65758b"/>${p.chart==='line'?`<polyline points="${coords.map(c=>`${c.x},${c.y}`).join(' ')}" fill="none" stroke="#54d6bf" stroke-width="5"/>`:''}${marks}</svg><div class="caption">${escape(caption)}</div></body></html>`;
}
