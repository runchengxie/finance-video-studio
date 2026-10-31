import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {readProject} from './project-io.js';
import {assertOutput,actualPath,within} from './paths.js';
import {parseProject,type ProductionProject,type Cue} from './manifest.js';

type SensitiveChanges={numbers:boolean;dates:boolean;units:boolean;financialTerms:boolean;before:Record<string,string[]>;after:Record<string,string[]>};
export type NarrationChange={kind:'added'|'removed'|'changed'|'retimed';before?:Cue;after?:Cue;beforeSceneIds:string[];afterSceneIds:string[];numericClaims:{before:unknown[];after:unknown[]};sensitiveChanges:SensitiveChanges};
export type NarrationComparison={schemaVersion:1;manualListening:false;factualVerification:false;scope:string;before:{manifest:string;sha256:string};after:{manifest:string;sha256:string};changes:NarrationChange[];voice:{comparison:'declared_only';verified:false;beforeHash:string|null;afterHash:string|null;status:'no_audio'|'unchanged'|'changed'|'missing_hash';requiresRetranscription:boolean};duration:{beforeFrames:number;afterFrames:number;beforeFps:number;afterFps:number;beforeSeconds:number;afterSeconds:number;changed:boolean};warnings:string[]};
const scope='Manifest/transcript comparison only. No listening, speech recognition, spoken-word verification, factual verification, approval or rendering. Audio hashes are declared metadata only; audio bytes are not read or verified.';
function tokens(text:string):Record<string,string[]>{
 const collect=(re:RegExp)=>[...new Set((text.match(re)??[]).map(x=>x.toLocaleLowerCase('en')))].sort();
 return {numbers:collect(/[+-]?\d+(?:[,.]\d+)*(?:[%％‰])?/g),dates:collect(/\b(?:19|20)\d{2}(?:[-/.]\d{1,2}){0,2}\b|\d{1,4}[年月日季]/g),units:collect(/[%％‰]|\b(?:USD|CNY|RMB|EUR|dollars?|yuan|million|billion|trillion|bps|basis points?)\b|亿元|万元|美元|人民币|百分点|基点|倍/gi),financialTerms:collect(/\b(?:revenue|profit|earnings|margin|debt|equity|cash flow|valuation|yield|interest|inflation|return|loss|net|gross)\b|营收|收入|利润|毛利|净利|负债|权益|现金流|估值|收益率|利率|通胀|亏损/gi)};
}
function sensitive(before:string,after:string):SensitiveChanges{const a=tokens(before),b=tokens(after),changed=(key:string)=>JSON.stringify(a[key])!==JSON.stringify(b[key]);return {numbers:changed('numbers'),dates:changed('dates'),units:changed('units'),financialTerms:changed('financialTerms'),before:a,after:b};}
function impacts(p:ProductionProject,c?:Cue){if(!c)return [];const ids=new Set(p.scenes.filter(s=>c.startFrame<s.from+s.durationFrames&&c.endFrame>s.from).map(s=>s.id));for(const e of p.events)if(e.cueId===c.id)ids.add(e.sceneId);return [...ids];}
function claims(p:ProductionProject,ids:string[]){return p.scenes.filter(s=>ids.includes(s.id)&&!['process','evidence'].includes(s.template)).map(s=>({sceneId:s.id,template:s.template,data:s.data}));}
function align(a:Cue[],b:Cue[]):[Cue|undefined,Cue|undefined][]{
 // Reject excessive work before allocating: at most four million DP cells (~16 MB).
 if((a.length+1)*(b.length+1)>4_000_000)throw new Error('narration_alignment_size_limit');
 const width=b.length+1,dp=new Uint32Array((a.length+1)*width);
 for(let i=a.length;i>=0;i--)for(let j=b.length;j>=0;j--){if(i===a.length){dp[i*width+j]=(b.length-j)*2;continue;}if(j===b.length){dp[i*width+j]=(a.length-i)*2;continue;}
 const x=a[i]!,y=b[j]!,cost=x.text===y.text?0:x.id===y.id?1:3;dp[i*width+j]=Math.min(cost+dp[(i+1)*width+j+1]!,2+dp[(i+1)*width+j]!,2+dp[i*width+j+1]!);}
 let i=0,j=0;const out:[Cue|undefined,Cue|undefined][]=[];
 while(i<a.length||j<b.length){const x=a[i],y=b[j];if(x&&y&&dp[i*width+j]===(x.text===y.text?0:x.id===y.id?1:3)+dp[(i+1)*width+j+1]!){out.push([x,y]);i++;j++;}else if(x&&dp[i*width+j]===2+dp[(i+1)*width+j]!){out.push([x,undefined]);i++;}else{out.push([undefined,y]);j++;}}return out;
}
const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function compareNarrations(beforeManifest:string,afterManifest:string,newOutput:string):Promise<NarrationComparison>{
 await assertOutput(beforeManifest,newOutput);await assertOutput(afterManifest,newOutput);
 const output=await actualPath(newOutput);for(const file of [beforeManifest,afterManifest])if(within(output,await actualPath(file)))throw new Error('comparison_output_overlaps_manifest');
 const [before,after]=await Promise.all([readProject(beforeManifest),readProject(afterManifest)]);
 const [beforeBytes,afterBytes]=await Promise.all([readFile(beforeManifest),readFile(afterManifest)]);
 // Bind the byte snapshots to the validated values, detecting concurrent manifest edits.
 const checkBefore=parseProject(JSON.parse(beforeBytes.toString('utf8').replace(/^\uFEFF/,''))),checkAfter=parseProject(JSON.parse(afterBytes.toString('utf8').replace(/^\uFEFF/,'')));
 if(JSON.stringify(before)!==JSON.stringify(checkBefore)||JSON.stringify(after)!==JSON.stringify(checkAfter))throw new Error('manifest_changed_during_comparison');
 const changes:NarrationChange[]=[];
 for(const [a,b] of align(before.cues,after.cues)){
 const timed=Boolean(a&&b&&(a.startFrame/before.fps!==b.startFrame/after.fps||a.endFrame/before.fps!==b.endFrame/after.fps));
 const kind=!a?'added':!b?'removed':a.text!==b.text?'changed':timed?'retimed':undefined;if(!kind)continue;
 const oldIds=impacts(before,a),newIds=impacts(after,b);changes.push({kind,before:a,after:b,beforeSceneIds:oldIds,afterSceneIds:newIds,numericClaims:{before:claims(before,oldIds),after:claims(after,newIds)},sensitiveChanges:sensitive(a?.text??'',b?.text??'')});
 }
 const voiceHash=(p:ProductionProject)=>p.inputs.find(x=>x.id===p.render.audioId)?.sha256??null;
 const beforeHash=voiceHash(before),afterHash=voiceHash(after),audioPresent=Boolean(before.render.audioId||after.render.audioId);
 const status=!audioPresent?'no_audio':!beforeHash||!afterHash?'missing_hash':beforeHash===afterHash?'unchanged':'changed';
 const transcriptUnchanged=before.cues.map(c=>c.text).join('\n')===after.cues.map(c=>c.text).join('\n')&&before.manuscript.map(x=>x.text).join('\n')===after.manuscript.map(x=>x.text).join('\n');
 const requiresRetranscription=transcriptUnchanged&&(status==='changed'||status==='missing_hash');
 const report:NarrationComparison={schemaVersion:1,manualListening:false,factualVerification:false,scope,before:{manifest:beforeManifest,sha256:createHash('sha256').update(beforeBytes).digest('hex')},after:{manifest:afterManifest,sha256:createHash('sha256').update(afterBytes).digest('hex')},changes,voice:{comparison:'declared_only',verified:false,beforeHash,afterHash,status,requiresRetranscription},duration:{beforeFrames:before.durationFrames,afterFrames:after.durationFrames,beforeFps:before.fps,afterFps:after.fps,beforeSeconds:before.durationFrames/before.fps,afterSeconds:after.durationFrames/after.fps,changed:before.durationFrames!==after.durationFrames||before.fps!==after.fps},warnings:requiresRetranscription?['Audio changed or hash is missing despite unchanged transcript. Retranscription and manual listening/review are required.']:[]};
 await mkdir(newOutput);await writeFile(path.join(newOutput,'before.manifest.json'),beforeBytes,{flag:'wx'});await writeFile(path.join(newOutput,'after.manifest.json'),afterBytes,{flag:'wx'});
 await writeFile(path.join(newOutput,'comparison.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Narration comparison</title><style>body{font:16px system-ui;max-width:1100px;margin:2rem auto;padding:1rem}td,th{border:1px solid #ccc;padding:.6rem;vertical-align:top}table{border-collapse:collapse;width:100%}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>Narration comparison</h1><p>${escape(scope)}</p><p>Manual listening: false. Factual verification: false.</p><p>Audio: ${status}. Declared hashes only; verified: false.</p>${report.warnings.map(w=>`<p><strong>${escape(w)}</strong></p>`).join('')}<p>Duration: ${report.duration.beforeSeconds}s → ${report.duration.afterSeconds}s</p><table><tr><th>Change</th><th>Before</th><th>After</th><th>Review impact</th></tr>${changes.map(c=>`<tr><td>${c.kind}</td><td>${escape(c.before?.text??'')}<pre>${escape(JSON.stringify(c.before??{},null,2))}</pre></td><td>${escape(c.after?.text??'')}<pre>${escape(JSON.stringify(c.after??{},null,2))}</pre></td><td><pre>${escape(JSON.stringify({beforeSceneIds:c.beforeSceneIds,afterSceneIds:c.afterSceneIds,sensitiveChanges:c.sensitiveChanges,numericClaims:c.numericClaims},null,2))}</pre></td></tr>`).join('')}</table></html>`;
 await writeFile(path.join(newOutput,'index.html'),html,{flag:'wx'});return report;
}
