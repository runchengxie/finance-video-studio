import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {z} from 'zod';
import {parseReview,status,importPolish,createReview,hash,type Review} from './review.js';

export const adapterConfigSchema=z.object({mode:z.enum(['manual','local_command']).default('manual'),extraTerms:z.array(z.string().min(1).max(80)).max(100).default([]),skillPath:z.string().optional(),command:z.string().optional(),args:z.array(z.string()).max(30).default([]),timeoutMs:z.number().int().min(100).max(60000).default(30000)}).strict();
export type AdapterConfig=z.infer<typeof adapterConfigSchema>;
export async function json(file:string):Promise<unknown>{return JSON.parse(await readFile(file,'utf8'));}
export async function loadConfig(file:string):Promise<AdapterConfig>{
 requireExternal(file);return adapterConfigSchema.parse(await json(file));
}
export async function loadReview(file:string):Promise<Review>{
 const envelope=z.object({status:z.string(),review:z.unknown()}).strict().parse(await json(file));
 return parseReview(envelope.review); // saved status is informational, always recomputed
}
function requireExternal(file:string):void{
 if(!path.isAbsolute(file))throw new Error('Review output must be an absolute external path');
 const relative=path.relative(fileURLToPath(new URL('../',import.meta.url)),file);
 if(relative===''||!relative.startsWith('..'))throw new Error('Keep manuscripts and review records outside the repository');
}
export async function saveReview(file:string,review:Review):Promise<void>{
 requireExternal(file);
 await mkdir(path.dirname(file),{recursive:true});
 await writeFile(file,JSON.stringify({status:status(review),review},null,2),{encoding:'utf8',flag:'wx'});
}
export async function runLocal(record:Review,config:AdapterConfig,explicitTrigger:boolean):Promise<Review>{
 const c=adapterConfigSchema.parse(config);
 record=parseReview(record);
 if(createReview(record.draft,record.extraTerms).inputHash!==record.inputHash)throw new Error('Draft hash is stale; initialize a new review');
 if(hash(c.extraTerms)!==hash(record.extraTerms))throw new Error('Configured policy differs from the saved review; initialize a new review');
 if(c.mode==='manual')return createReview(record.draft,record.extraTerms);
 if(!explicitTrigger)throw new Error('Local execution requires explicit --execute-local');
 if(!c.command||!path.isAbsolute(c.command)||!c.skillPath||!path.isAbsolute(c.skillPath))throw new Error('Local command and installed skill path must be explicit absolute paths');
 await readFile(c.skillPath,'utf8'); // verify availability; do not copy third-party instructions
 const request={protocolVersion:1,inputHash:record.inputHash,draft:record.draft,skillPath:c.skillPath,brief:{opening:'Enter substantive content in the first three seconds',structure:'Exactly three points',tone:'Natural spoken language',ending:'Stop when finished; no forced summary or suspense',truth:'Do not invent personal experience; preserve sources, figures and qualifiers'}};
 const raw=execFileSync(c.command,c.args,{input:JSON.stringify(request),encoding:'utf8',timeout:c.timeoutMs,maxBuffer:1024*1024,shell:false,windowsHide:true});
 return importPolish(record,JSON.parse(raw),'local');
}
