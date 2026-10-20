import {createHash} from 'node:crypto';
import {z} from 'zod';
import {schema,type Project} from './core.js';

const digest=z.string().regex(/^[a-f0-9]{64}$/);
const note=z.string().trim().min(1).max(10000);
const kind=z.enum(['numbers','units','dates','references','qualifiers']);
const changeSchema=z.object({field:z.string(),kind,before:z.array(z.string()),after:z.array(z.string())}).strict();
export type FactChange=z.infer<typeof changeSchema>;
const defaultTerms=['约','至少','至多','超过','不足','可能','预计','仅','未经审计','不构成投资建议','同比','环比','未','不','非','approximately','at least','at most','may','estimated','unaudited','not'];
const recordSchema=z.object({
 version:z.literal(1),draft:schema,polished:schema.nullable(),inputHash:digest,
 extraTerms:z.array(z.string().min(1).max(80)).max(100),
 execution:z.enum(['not_executed','manual_import','local_adapter']),
 skillUse:z.enum(['not_used','operator_reported','adapter_reported']),
 decision:z.enum(['pending','accepted','rejected']),changeNotes:z.string().max(10000),
 factDifferences:z.array(changeSchema),
 approval:z.object({reviewer:note,factReviewNotes:note,differenceReviewNotes:z.string().max(10000),reviewHash:digest,projectHash:digest,issuedAt:z.iso.datetime(),expiresAt:z.iso.datetime()}).strict().nullable()
}).strict();
export type Review=z.infer<typeof recordSchema>;
export const importSchema=z.object({inputHash:digest,decision:z.enum(['accepted','rejected']),polished:schema.nullable(),changeNotes:note,skillUse:z.enum(['not_used','operator_reported','adapter_reported'])}).strict();

function canonical(value:unknown):string{
 if(Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
 if(value&&typeof value==='object') return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
 return JSON.stringify(value);
}
export function hash(value:unknown):string{return createHash('sha256').update(canonical(value)).digest('hex');}
function claims(p:Project):Record<string,string>{return Object.fromEntries([['title',p.title],...p.captions.map((c,i)=>[`captions.${i}`,c.text])]);}
export function detectChanges(before:Project,after:Project,extraTerms:string[]):FactChange[]{
 return detectTextChanges(claims(before),claims(after),extraTerms);
}
export function detectTextChanges(a:Record<string,string>,b:Record<string,string>,extraTerms:string[],includeNewFields=false):FactChange[]{
 const changes:FactChange[]=[];
 for(const field of includeNewFields?[...new Set([...Object.keys(a),...Object.keys(b)])]:Object.keys(a)){
  const extract=(text:string)=>{
   const normalized=text.normalize('NFKC');
   return {
    numbers:normalized.match(/[+-]?\d+(?:,\d{3})*(?:\.\d+)?/g)??[],
    units:normalized.match(/USD million|M USD|USD|CNY|RMB|EUR|JPY|HKD|billion|million|thousand|trillion|百分点|百分比|亿美元|万元|亿元|美元|港元|日元|欧元|人民币|亿|万|元|%|倍|吨|人|家|kg|km|bps|bp/gi)??[],
    dates:normalized.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{4}年(?:\d{1,2}月(?:\d{1,2}日)?)?/g)??[],
    references:normalized.match(/\[[^\]\r\n]{1,80}\]|“[^”]+”|「[^」]+」/g)??[],
    qualifiers:[...new Set([...defaultTerms,...extraTerms])].flatMap(term=>Array.from(normalized.matchAll(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi')),()=>term))
   };
  };
  const x=extract(a[field]??''),y=extract(b[field]??'');
  for(const category of kind.options) if(hash(x[category])!==hash(y[category]))changes.push({field,kind:category,before:x[category],after:y[category]});
 }
 return changes;
}
function assertThreePoints(p:Project):void{if(p.captions.length!==3||p.captions[0]!.start!==0)throw new Error('Review workflow requires three points, starting immediately at frame zero');}
function nonText(p:Project):unknown{return {...p,title:'',captions:p.captions.map(c=>({...c,text:''}))};}
function inputHash(r:Pick<Review,'draft'|'extraTerms'>):string{return hash({draft:r.draft,extraTerms:r.extraTerms});}
function reviewHash(r:Review):string{const {approval:_,...content}=r;void _;return hash(content);}
export function createReview(project:Project,extraTerms:string[]=[]):Review{
 const draft=schema.parse(project);assertThreePoints(draft);
 const result:Review={version:1,draft,polished:null,inputHash:hash({draft,extraTerms}),extraTerms,execution:'not_executed',skillUse:'not_used',decision:'pending',changeNotes:'',factDifferences:[],approval:null};
 return recordSchema.parse(result);
}
export function parseReview(value:unknown):Review{
 const r=recordSchema.parse(value);assertThreePoints(r.draft);if(r.polished)assertThreePoints(r.polished);return r;
}
export function importPolish(record:Review,value:unknown,route:'manual'|'local'):Review{
 const r=parseReview(record),result=importSchema.parse(value);
 if(r.inputHash!==inputHash(r)||result.inputHash!==r.inputHash)throw new Error('Polish input hash does not match current draft and policy');
 if(result.decision==='accepted'&&!result.polished)throw new Error('Accepted polish requires a complete polished project');
 if(result.polished){assertThreePoints(result.polished);if(hash(nonText(r.draft))!==hash(nonText(result.polished)))throw new Error('Polish cannot change chart data, units or timeline; create a new draft instead');}
 if(route==='manual'&&result.skillUse==='adapter_reported')throw new Error('Manual import cannot claim adapter execution');
 return {...r,polished:result.polished,execution:route==='manual'?'manual_import':'local_adapter',skillUse:result.skillUse,decision:result.decision,changeNotes:result.changeNotes,factDifferences:result.polished?detectChanges(r.draft,result.polished,r.extraTerms):[],approval:null};
}
export type ReviewStatus='pending_execution'|'rejected'|'facts_changed'|'awaiting_approval'|'approved'|'stale_approval'|'invalid_record';
export function status(record:Review,now=new Date()):ReviewStatus{
 const r=parseReview(record);
 if(r.inputHash!==inputHash(r))return r.approval?'stale_approval':'invalid_record';
 if(r.approval&&(r.approval.reviewHash!==reviewHash(r)||r.approval.projectHash!==hash(r.polished)||Date.parse(r.approval.expiresAt)<=now.getTime()||Date.parse(r.approval.issuedAt)>now.getTime()))return 'stale_approval';
 if(r.execution==='not_executed'||r.decision==='pending')return 'pending_execution';
 if(r.decision==='rejected')return 'rejected';
 if(!r.polished||hash(nonText(r.draft))!==hash(nonText(r.polished))||hash(r.factDifferences)!==hash(detectChanges(r.draft,r.polished,r.extraTerms)))return 'invalid_record';
 if(r.approval)return 'approved';
 return r.factDifferences.length?'facts_changed':'awaiting_approval';
}
export function approve(record:Review,options:{reviewer:string;factReviewNotes:string;differenceReviewNotes?:string;expiresAt:string},now=new Date()):Review{
 const r=parseReview(record),state=status(r,now);
 if(!['awaiting_approval','facts_changed'].includes(state))throw new Error(`Cannot approve ${state}`);
 if(r.factDifferences.length&&!options.differenceReviewNotes?.trim())throw new Error('Every factual-token difference needs explicit human review notes');
 if(Date.parse(options.expiresAt)<=now.getTime())throw new Error('Approval must expire in the future');
 return parseReview({...r,approval:{...options,differenceReviewNotes:options.differenceReviewNotes??'',projectHash:hash(r.polished),reviewHash:reviewHash(r),issuedAt:now.toISOString()}});
}
export function assertApproved(project:Project,record:Review,now=new Date()):void{
 const r=parseReview(record);if(status(r,now)!=='approved'||hash(schema.parse(project))!==r.approval?.projectHash)throw new Error('Rendering requires current human approval for this exact project hash');
}
