import {parseProject,type ProductionProject} from './manifest.js';

const internal=/待听校|待逐句核对|年份按资料更正|原声保留|内容与字幕待核|画面探索|pending (?:human )?listening|original voice retained|year corrected from sources/i;
export type AuditIssue={code:string;field:string;original:string;suggestion?:string};
function strings(value:unknown,prefix:string):{field:string;text:string}[]{
 if(typeof value==='string')return [{field:prefix,text:value}];
 if(Array.isArray(value))return value.flatMap((v,i)=>strings(v,`${prefix}.${i}`));
 if(value&&typeof value==='object')return Object.entries(value).flatMap(([k,v])=>strings(v,`${prefix}.${k}`));
 return [];
}
export function audienceFields(project:ProductionProject):{field:string;text:string}[]{
 return strings({title:project.title,cues:project.cues,scenes:project.scenes,sources:project.sources.map(s=>({citation:s.citation})),programName:project.render.broadcast?.programName,delivery:project.delivery},'project');
}
export function assertAudienceReady(project:ProductionProject):void {
 const issues=audienceFields(project).filter(x=>internal.test(x.text));
 if(issues.length)throw new Error(`internal_note_in_audience:${issues.map(x=>x.field).join(',')}`);
}
export function auditProduction(value:ProductionProject){
 const p=parseProject(value),issues:AuditIssue[]=[];
 for(const x of audienceFields(p))if(internal.test(x.text))issues.push({code:'internal_note',field:x.field,original:x.text});
 const terms:Record<string,string>={'汇报率':'回报率','贪销':'摊销','先进流':'现金流','竞收益':'净收益','中指交易费':'终止交易费'};
 for(const cue of p.cues){
  const field=`cues.${cue.id}`;
  if(p.contentLanguage==='zh'){
   if(/[,;?!]/.test(cue.text))issues.push({code:'halfwidth_punctuation',field,original:cue.text,suggestion:cue.text.replace(/[,;?!]/g,c=>({',':'，',';':'；','?':'？','!':'！'})[c]!)});
   for(const [term,replacement] of Object.entries(terms))if(cue.text.includes(term))issues.push({code:'financial_term',field,original:cue.text,suggestion:cue.text.replaceAll(term,replacement)});
  }
  if([...cue.text].length>48)issues.push({code:'long_caption',field,original:cue.text});
  if(/\d/.test(cue.text)){
   issues.push({code:'numeric_fact_review',field,original:cue.text});
   if(!p.events.some(e=>e.cueId===cue.id))issues.push({code:'numeric_cue_without_event',field,original:cue.text});
  }
 }
 return {projectId:p.id,issues,factualVerification:false,manualListening:false,numericCoverageMeaning:'Event presence is a review lead, not proof of matching values or alignment.'};
}
