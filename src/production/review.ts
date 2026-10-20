import {z} from 'zod';
import {hash,detectTextChanges,type FactChange} from '../review.js';
import {manifestSchema,parseProject,type ProductionProject} from './manifest.js';
import type {EditorialSnapshot} from './snapshot.js';

const digest=z.string().regex(/^[a-f0-9]{64}$/),note=z.string().trim().min(1).max(10000);
export const snapshotSchema=z.object({schemaVersion:z.literal(2),project:manifestSchema.omit({reviewPath:true}),assets:z.array(z.object({id:z.string(),path:z.string(),sha256:digest}).strict()).max(2000),templateRevision:digest}).strict();
const difference=z.object({field:z.string(),kind:z.enum(['numbers','units','dates','references','qualifiers','text','presence']),before:z.array(z.string()),after:z.array(z.string())}).strict();
export type ProductionDifference=z.infer<typeof difference>;
const approvalSchema=z.object({reviewer:note,factReviewNotes:note,differenceReviewNotes:z.string().max(10000),snapshotHash:digest,reviewHash:digest,issuedAt:z.iso.datetime(),expiresAt:z.iso.datetime()}).strict();
const recordSchema=z.object({version:z.literal(2),draft:snapshotSchema,polished:snapshotSchema.nullable(),inputHash:digest,policyTerms:z.array(z.string().min(1).max(80)).max(100),execution:z.enum(['not_executed','manual_import']),skillUse:z.enum(['not_used','operator_reported']),decision:z.enum(['pending','accepted','rejected']),changeNotes:z.string().max(10000),differences:z.array(difference),approval:approvalSchema.nullable()}).strict();
export type ProductionReview=z.infer<typeof recordSchema>;
export type ProductionApprovalOptions={reviewer:string;factReviewNotes:string;differenceReviewNotes?:string;expiresAt:string};
function checkedSnapshot(value:unknown):EditorialSnapshot {
 const snapshot=snapshotSchema.parse(value);parseProject(snapshot.project);
 const expected=snapshot.project.inputs.map(x=>({id:x.id,path:x.path,sha256:x.sha256})).sort((a,b)=>a.id.localeCompare(b.id,'en'));
 if(hash(snapshot.assets)!==hash(expected))throw new Error('invalid_snapshot_assets');return snapshot;
}
export function parseProductionReview(value:unknown):ProductionReview {
 const r=recordSchema.parse(value);checkedSnapshot(r.draft);if(r.polished)checkedSnapshot(r.polished);return r;
}
function claims(project:ProductionProject):Record<string,string> {
 return Object.fromEntries([['title',project.title],...project.manuscript.map(x=>[`manuscript.${x.id}`,x.text]),...project.cues.map(x=>[`cues.${x.id}`,x.text]),...project.scenes.map(x=>[`scenes.${x.id}.title`,x.title])]);
}
export function detectProductionChanges(before:EditorialSnapshot,after:EditorialSnapshot,terms:string[]):ProductionDifference[] {
 const a=claims(before.project),b=claims(after.project),changes:ProductionDifference[]=detectTextChanges(a,b,terms,true) as FactChange[];
 for(const key of new Set([...Object.keys(a),...Object.keys(b)]))if(a[key]!==b[key])changes.push({field:key,kind:key in a&&key in b?'text':'presence',before:a[key]===undefined?[]:[a[key]!],after:b[key]===undefined?[]:[b[key]!]});
 return changes;
}
function structure(s:EditorialSnapshot):unknown {
 return {...s,project:{...s.project,title:'',manuscript:s.project.manuscript.map(x=>({...x,text:''})),cues:s.project.cues.map(x=>({...x,text:''})),scenes:s.project.scenes.map(x=>({...x,title:''}))}};
}
function reviewHash(r:ProductionReview):string {const {approval:_,...content}=r;void _;return hash(content);}
export function createProductionReview(snapshot:EditorialSnapshot,policyTerms:string[]=[]):ProductionReview {
 const draft=checkedSnapshot(snapshot);return parseProductionReview({version:2,draft,polished:null,inputHash:hash({draft,policyTerms}),policyTerms,execution:'not_executed',skillUse:'not_used',decision:'pending',changeNotes:'',differences:[],approval:null});
}
export function importProductionPolish(record:ProductionReview,value:unknown):ProductionReview {
 const r=parseProductionReview(record),result=z.object({inputHash:digest,decision:z.enum(['accepted','rejected']),polished:snapshotSchema.nullable(),changeNotes:note,skillUse:z.enum(['not_used','operator_reported'])}).strict().parse(value);
 if(r.inputHash!==hash({draft:r.draft,policyTerms:r.policyTerms})||result.inputHash!==r.inputHash)throw new Error('polish_hash_mismatch');
 if(result.decision==='accepted'&&!result.polished)throw new Error('accepted_requires_polished_snapshot');
 if(result.polished){checkedSnapshot(result.polished);if(hash(structure(r.draft))!==hash(structure(result.polished)))throw new Error('structural_changes_require_new_review');}
 return parseProductionReview({...r,polished:result.polished,execution:'manual_import',skillUse:result.skillUse,decision:result.decision,changeNotes:result.changeNotes,differences:result.polished?detectProductionChanges(r.draft,result.polished,r.policyTerms):[],approval:null});
}
export function productionReviewStatus(record:ProductionReview,now=new Date()):string {
 const r=parseProductionReview(record);
 if(r.inputHash!==hash({draft:r.draft,policyTerms:r.policyTerms}))return r.approval?'stale_approval':'invalid_record';
 if(r.approval&&(r.approval.reviewHash!==reviewHash(r)||r.approval.snapshotHash!==hash(r.polished)||Date.parse(r.approval.expiresAt)<=now.getTime()||Date.parse(r.approval.issuedAt)>now.getTime()))return 'stale_approval';
 if(r.execution==='not_executed'||r.decision==='pending')return 'pending_execution';if(r.decision==='rejected')return 'rejected';
 if(!r.polished||hash(structure(r.draft))!==hash(structure(r.polished))||hash(r.differences)!==hash(detectProductionChanges(r.draft,r.polished,r.policyTerms)))return 'invalid_record';
 if(r.approval)return 'approved';return r.differences.some(x=>x.kind!=='text')?'facts_changed':'awaiting_approval';
}
export function approveProductionReview(record:ProductionReview,options:ProductionApprovalOptions,now=new Date()):ProductionReview {
 const r=parseProductionReview(record),state=productionReviewStatus(r,now);
 if(!['awaiting_approval','facts_changed'].includes(state))throw new Error(`cannot_approve:${state}`);
 if(r.differences.some(x=>x.kind!=='text')&&!options.differenceReviewNotes?.trim())throw new Error('difference_review_notes_required');
 if(Date.parse(options.expiresAt)<=now.getTime())throw new Error('approval_must_expire_in_future');
 return parseProductionReview({...r,approval:{...options,differenceReviewNotes:options.differenceReviewNotes??'',snapshotHash:hash(r.polished),reviewHash:reviewHash(r),issuedAt:now.toISOString()}});
}
export function assertProductionApproved(snapshot:EditorialSnapshot,record:ProductionReview,now=new Date()):void {
 const r=parseProductionReview(record);checkedSnapshot(snapshot);if(productionReviewStatus(r,now)!=='approved'||hash(snapshot)!==r.approval?.snapshotHash)throw new Error('current_exact_snapshot_approval_required');
}
