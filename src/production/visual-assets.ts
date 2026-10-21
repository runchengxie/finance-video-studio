import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {chromium} from 'playwright';
import {resolveInput} from './paths.js';
import type {ProductionProject} from './manifest.js';

function dimensions(bytes:Buffer,mime:string):[number,number] {
 if(mime==='png'){
  if(bytes.length<24||bytes.toString('ascii',12,16)!=='IHDR')throw new Error('invalid_image_header');
  return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
 }
 let offset=2;
 while(offset+4<=bytes.length){
  if(bytes[offset++]!==255)throw new Error('invalid_image_header');
  while(bytes[offset]===255)offset++;
  const marker=bytes[offset++]!;
  if(marker===0xd9||marker===0xda)break;
  if(marker===0x01||marker>=0xd0&&marker<=0xd7)continue;
  if(offset+2>bytes.length)break;const length=bytes.readUInt16BE(offset);
  if(length<2||offset+length>bytes.length)break;
  if([0xc0,0xc1,0xc2].includes(marker)&&length>=8)return [bytes.readUInt16BE(offset+5),bytes.readUInt16BE(offset+3)];
  offset+=length;
 }
 throw new Error('invalid_image_header');
}
export async function loadVisualAssets(manifestFile:string,project:ProductionProject):Promise<ReadonlyMap<string,string>> {
 const assets=new Map<string,string>();
 for(const input of project.inputs.filter(x=>x.mediaType==='image')){
  const file=await resolveInput(manifestFile,input.path);
  if((await stat(file)).size>20*1024*1024)throw new Error(`image_size_limit:${input.id}`);
  const bytes=await readFile(file);
  if(bytes.length>20*1024*1024)throw new Error(`image_size_limit:${input.id}`);
  if(createHash('sha256').update(bytes).digest('hex')!==input.sha256)throw new Error(`input_hash_mismatch:${input.id}`);
  const ext=path.extname(file).toLowerCase();
  const mime=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'jpeg':null;
  if(!mime||(mime==='png'?ext!=='.png':!['.jpg','.jpeg'].includes(ext)))throw new Error(`image_type:${input.id}`);
  const [w,h]=dimensions(bytes,mime);if(w<1||h<1||w>4096||h>4096)throw new Error(`image_dimensions:${input.id}`);
  assets.set(input.id,`data:image/${mime};base64,${bytes.toString('base64')}`);
 }
 if(!assets.size)return assets;
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();await page.route('**/*',route=>route.abort());
  for(const [id,uri] of assets){
   const ok=await page.evaluate(async src=>{try{const img=new Image();img.src=src;await img.decode();return img.naturalWidth>0&&img.naturalWidth<=4096&&img.naturalHeight>0&&img.naturalHeight<=4096;}catch{return false;}},uri);
   if(!ok)throw new Error(`image_decode:${id}`);
  }
 }finally{await browser.close();}
 return assets;
}
